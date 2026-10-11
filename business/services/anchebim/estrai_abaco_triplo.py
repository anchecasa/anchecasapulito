"""Estrazione autonoma e tripla dell'Abaco, senza incroci documentali."""

from __future__ import annotations

import argparse
import copy
import json
import os
import shutil
import stat
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from estrazione_forense_cme_abaco import (
    VERSIONE,
    audit_documento,
    estrai_documento,
    sha256_byte,
    sha256_file,
    scrivi_json,
)
from json_canonico import json_canonico


VERSIONE_TRIPLA = "anchebim-abaco-tripla-estrazione-v1"


def rendi_sola_lettura(percorso: Path) -> None:
    os.chmod(percorso, stat.S_IREAD)


def copia_originale_immutabile(fonte: Path, destinazione: Path) -> None:
    destinazione.parent.mkdir(parents=True, exist_ok=True)
    if destinazione.exists():
        if sha256_file(destinazione) != sha256_file(fonte):
            raise RuntimeError(
                "Un originale Abaco differente è già presente nell'archivio."
            )
        rendi_sola_lettura(destinazione)
        return
    shutil.copy2(fonte, destinazione)
    rendi_sola_lettura(destinazione)


def estrai_passaggio(
    fonte: Path,
    originale: Path,
    cartella: Path,
    transazione: str,
    numero: int,
    riferimento: dict[str, Any] | None,
) -> tuple[dict[str, Any], dict[str, Any]]:
    cartella.mkdir(parents=True, exist_ok=False)
    copia = cartella / "abaco.pdf"
    shutil.copy2(fonte, copia)
    rendi_sola_lettura(copia)
    estrazione = estrai_documento(copia, "abaco", transazione)
    griglia = cartella / "griglia.json"
    scrivi_json(griglia, estrazione)
    riletto = json.loads(griglia.read_text(encoding="utf-8"))
    base = riferimento if riferimento is not None else estrazione
    audit = audit_documento(fonte, originale, base, riletto)
    audit["passaggio"] = numero
    audit["sha256CopiaPdf"] = sha256_file(copia)
    audit["sha256GrigliaJson"] = sha256_file(griglia)
    audit["sha256Payload"] = estrazione["certificazione"][
        "sha256PayloadSenzaCertificazione"
    ]
    scrivi_json(cartella / "audit.json", audit)
    return estrazione, audit


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--abaco", required=True, type=Path)
    parser.add_argument("--storage", required=True, type=Path)
    parser.add_argument("--nome-fonte", default="")
    argomenti = parser.parse_args()

    fonte = argomenti.abaco.resolve()
    if not fonte.is_file() or fonte.suffix.lower() != ".pdf":
        raise RuntimeError("Il file Abaco PDF non è disponibile.")

    radice = argomenti.storage.resolve() / "abaco"
    originale = radice / "originali" / "abaco.pdf"
    copia_originale_immutabile(fonte, originale)

    istante = datetime.now(timezone.utc)
    transazione = f"abaco-{istante.strftime('%Y%m%dT%H%M%SZ')}"
    acquisizione = radice / "estrazioni" / transazione
    passaggi = acquisizione / "passaggi"
    passaggi.mkdir(parents=True, exist_ok=False)

    estrazioni: list[dict[str, Any]] = []
    audit: list[dict[str, Any]] = []
    riferimento = None
    for numero in range(1, 4):
        estrazione, verifica = estrai_passaggio(
            fonte,
            originale,
            passaggi / f"{numero:02d}",
            transazione,
            numero,
            riferimento,
        )
        if riferimento is None:
            riferimento = copy.deepcopy(estrazione)
        estrazioni.append(estrazione)
        audit.append(verifica)

    hash_payload = [
        voce["certificazione"]["sha256PayloadSenzaCertificazione"]
        for voce in estrazioni
    ]
    hash_pdf = [voce["sha256CopiaPdf"] for voce in audit]
    coerente = (
        len(set(hash_payload)) == 1
        and len(set(hash_pdf)) == 1
        and hash_pdf[0] == sha256_file(originale)
        and all(voce["esito"] == "parita_100_percento" for voce in audit)
    )
    metriche = estrazioni[0]["metriche"]
    risultato = {
        "schema": VERSIONE_TRIPLA,
        "schemaEstrazione": VERSIONE,
        "transazione": transazione,
        "creatoIl": istante.isoformat(timespec="milliseconds"),
        "stato": (
            "estratto_non_incrociato"
            if coerente
            else "estratto_con_discrepanze"
        ),
        "arrestoFlusso": {
            "fase": "prima_incrocio",
            "incrociEseguiti": [],
            "proiezioneStore": False,
            "telemetriaEconomica": False,
        },
        "fonte": {
            "nome": str(argomenti.nome_fonte or fonte.name),
            "originaleArchivio": originale.relative_to(argomenti.storage.resolve()).as_posix(),
            "byte": fonte.stat().st_size,
            "sha256": sha256_file(fonte),
        },
        "triplaEstrazione": {
            "passaggi": 3,
            "coerente": coerente,
            "hashPayload": hash_payload,
            "hashCopiePdf": hash_pdf,
            "audit": audit,
        },
        "metriche": metriche,
        "dati": estrazioni[0],
    }
    nucleo = copy.deepcopy(risultato)
    risultato["integrita"] = {
        "algoritmo": "SHA-256",
        "sha256JsonSenzaIntegrita": sha256_byte(json_canonico(nucleo)),
    }

    elaborati = radice / "elaborati"
    elaborati.mkdir(parents=True, exist_ok=True)
    json_acquisizione = acquisizione / "abaco.estratto.json"
    json_corrente = elaborati / "abaco.estratto.json"
    rapporto = acquisizione / "rapporto-tripla-estrazione.json"
    scrivi_json(json_acquisizione, risultato)
    shutil.copy2(json_acquisizione, json_corrente)
    scrivi_json(
        rapporto,
        {
            "schema": VERSIONE_TRIPLA,
            "transazione": transazione,
            "esito": "coerente" if coerente else "discrepanze",
            "passaggi": 3,
            "metriche": metriche,
            "sha256Originale": sha256_file(originale),
            "sha256JsonEstratto": sha256_file(json_acquisizione),
            "arrestoFlusso": risultato["arrestoFlusso"],
        },
    )
    for percorso in (json_acquisizione, json_corrente, rapporto):
        rendi_sola_lettura(percorso)

    print(
        json.dumps(
            {
                "ok": coerente,
                "transazione": transazione,
                "originale": str(originale),
                "json": str(json_corrente),
                "rapporto": str(rapporto),
                "metriche": metriche,
                "stato": risultato["stato"],
            },
            ensure_ascii=False,
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
