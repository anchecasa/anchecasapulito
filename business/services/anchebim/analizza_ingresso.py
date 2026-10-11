"""Analisi per il cruscotto: controllo triplo del PDF e lettura dello ZIP.

Usa gli stessi moduli di AncheBIM (estrazione forense, audit delle coordinate, SHA-256).
Scrive solo JSON sullo stdout.
"""

from __future__ import annotations

import argparse
import copy
import hashlib
import json
import re
import zipfile
from datetime import datetime, timezone
from pathlib import Path

from estrazione_forense_cme_abaco import (
    audit_documento,
    estrai_documento,
    sha256_file,
)
from json_canonico import json_canonico


MAX_BYTE = 999 * 1024 * 1024
MAX_VOCI_ZIP = 400

INDIZI = (
    ("computo", re.compile(r"(?:cme|computo|metrico)", re.I)),
    ("elenco_prezzi", re.compile(r"(?:epu|elenco.?prezz|prezzario|listino)", re.I)),
    ("apu", re.compile(r"(?:^|[^a-z])apu(?:[^a-z]|$)|analisi.?prezz", re.I)),
    ("capitolato", re.compile(r"(?:capitolato|csa|prescrizion)", re.I)),
    ("abaco", re.compile(r"(?:abaco|abc.?part|part.?vert|geometr)", re.I)),
    ("contratto", re.compile(r"(?:contratto|quadro.?economic)", re.I)),
)

ETICHETTE = {
    "computo": "Computo metrico",
    "elenco_prezzi": "Elenco prezzi",
    "apu": "Analisi prezzi",
    "capitolato": "Capitolato",
    "abaco": "Abaco",
    "contratto": "Contratto",
    "altro": "Altro",
}


def tipo_da_nome(nome: str) -> str:
    base = Path(nome).name
    for chiave, motivo in INDIZI:
        if motivo.search(base):
            return chiave
    return "altro"


def sha256_byte(dati: bytes) -> str:
    return hashlib.sha256(dati).hexdigest()


def riassunto_audit(verifica: dict) -> dict:
    coordinate = verifica.get("coordinate") or {}
    return {
        "passaggio": verifica.get("passaggio"),
        "esito": verifica.get("esito"),
        "verifiche": verifica.get("verifiche"),
        "coordinate": {
            "esito": coordinate.get("esito"),
            "unita": coordinate.get("unita"),
            "assi": coordinate.get("assi"),
            "tolleranzaMm": coordinate.get("tolleranzaMm"),
            "deltaMassimoMm": coordinate.get("deltaMassimoMm"),
            "discrepanzeOltreTolleranza": coordinate.get("discrepanzeOltreTolleranza"),
        },
    }


def tripla_pdf(percorso: Path, tipo: str) -> dict:
    istante = datetime.now(timezone.utc)
    transazione = f"bim-{istante.strftime('%Y%m%dT%H%M%SZ')}"
    riferimento = None
    hash_payload: list[str] = []
    audit = []
    metriche = None
    for numero in range(1, 4):
        estrazione = estrai_documento(percorso, tipo, f"{transazione}-{numero}")
        if riferimento is None:
            riferimento = copy.deepcopy(estrazione)
            metriche = estrazione.get("metriche")
        verifica = audit_documento(percorso, percorso, riferimento, estrazione)
        verifica["passaggio"] = numero
        hash_payload.append(
            estrazione["certificazione"]["sha256PayloadSenzaCertificazione"]
        )
        audit.append(riassunto_audit(verifica))
    coerente = len(set(hash_payload)) == 1 and all(
        voce["esito"] == "parita_100_percento" for voce in audit
    )
    nucleo = {
        "passaggi": 3,
        "coerente": coerente,
        "hashPayload": hash_payload,
        "audit": audit,
        "metriche": metriche,
    }
    return {
        "triplaVerifica": nucleo,
        "piani": (riferimento or {}).get("piani", []),
        "improntaRapporto": sha256_byte(json_canonico(nucleo)),
    }


def analizza_zip(percorso: Path) -> dict:
    if not zipfile.is_zipfile(percorso):
        raise RuntimeError("L'archivio ZIP non si apre.")
    voci = []
    with zipfile.ZipFile(percorso) as archivio:
        infos = [info for info in archivio.infolist() if not info.is_dir()]
        if len(infos) > MAX_VOCI_ZIP:
            raise RuntimeError("Lo ZIP ha troppi file per questa analisi.")
        peso = sum(info.file_size for info in infos)
        if peso > MAX_BYTE:
            raise RuntimeError("Lo ZIP scompatta più di 999 MB.")
        for info in infos:
            nome = info.filename.replace("\\", "/")
            if nome.startswith("/") or ".." in Path(nome).parts:
                raise RuntimeError("Lo ZIP contiene un percorso non ammesso.")
            dati = archivio.read(info)
            voci.append(
                {
                    "nome": nome,
                    "byte": len(dati),
                    "tipo": tipo_da_nome(nome),
                    "etichetta": ETICHETTE[tipo_da_nome(nome)],
                    "sha256": sha256_byte(dati),
                }
            )
    return {"archivio": {"voci": voci, "file": len(voci)}}


def analizza(percorso: Path) -> dict:
    if not percorso.is_file():
        raise RuntimeError("Il file non c'è.")
    peso = percorso.stat().st_size
    if peso > MAX_BYTE:
        raise RuntimeError("Il file supera 999 MB.")
    nome = percorso.name
    tipo = tipo_da_nome(nome)
    esito: dict = {
        "ok": True,
        "nome": nome,
        "byte": peso,
        "sha256": sha256_file(percorso),
        "tipo": tipo,
        "etichetta": ETICHETTE[tipo],
    }
    suffisso = percorso.suffix.lower()
    if suffisso == ".pdf":
        esito.update(tripla_pdf(percorso, tipo))
        esito["stato"] = (
            "coerente"
            if esito["triplaVerifica"]["coerente"]
            else "discrepanze"
        )
    elif suffisso == ".zip":
        esito.update(analizza_zip(percorso))
        esito["stato"] = "archivio_letto"
    else:
        esito["stato"] = "impronta"
        esito["nota"] = (
            "Per il controllo triplo serve un PDF. Per l'elenco dei documenti serve uno ZIP."
        )
    return esito


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--file", required=True, type=Path)
    argomenti = parser.parse_args()
    try:
        print(json.dumps(analizza(argomenti.file.resolve()), ensure_ascii=False))
    except Exception as errore:
        print(json.dumps({"ok": False, "errore": str(errore)}, ensure_ascii=False))
        raise SystemExit(1)


if __name__ == "__main__":
    main()
