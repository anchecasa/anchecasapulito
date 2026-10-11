"""Estrazione forense locale di CME e Abaco con audit e ledger SHA-256."""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import shutil
from collections import Counter
from datetime import datetime, timezone
from decimal import Decimal, InvalidOperation
from pathlib import Path
from typing import Any

import pymupdf
from json_canonico import json_canonico


VERSIONE = "anchebim-forensic-extraction-v1"
RE_NUMERO = re.compile(r"(?<![\w])[-+]?(?:\d{1,3}(?:[.\s]\d{3})+|\d+)(?:[,.]\d+)?(?![\w])")
RE_QUOTA_Z = re.compile(
    r"(?:spessore|sp\.?)\s*[:=]?\s*(\d+(?:[.,]\d+)?)\s*(mm|cm|m)\b",
    re.I,
)
RE_PIANO = re.compile(
    r"^\s*(?:piano|livello)\s+(interrato|seminterrato|terra|rialzato|ammezzato|primo|secondo|terzo|quarto|quinto|sesto|settimo|ottavo|nono|decimo|\d{1,3})\b",
    re.I,
)
RE_QUOTA_PIANO = re.compile(
    r"(?:quota(?:\s*z)?|asse\s*z)\s*[:=]?\s*([+-]?\d+(?:[.,]\d+)?)\s*(mm|cm|m)\b",
    re.I,
)
RE_INTERPIANO = re.compile(
    r"(?:interpiano|altezza\s+di\s+piano|altezza\s+piano)\s*[:=]?\s*(\d+(?:[.,]\d+)?)\s*(mm|cm|m)\b",
    re.I,
)
ORDINALI_PIANO = {
    "interrato": -1,
    "seminterrato": -1,
    "terra": 0,
    "rialzato": 0,
    "ammezzato": 0,
    "primo": 1,
    "secondo": 2,
    "terzo": 3,
    "quarto": 4,
    "quinto": 5,
    "sesto": 6,
    "settimo": 7,
    "ottavo": 8,
    "nono": 9,
    "decimo": 10,
}
MM_PER_PUNTO = Decimal("25.4") / Decimal("72")
TOLLERANZA_MM = Decimal("0.001")


def sha256_byte(dati: bytes) -> str:
    return hashlib.sha256(dati).hexdigest()


def sha256_file(percorso: Path) -> str:
    digest = hashlib.sha256()
    with percorso.open("rb") as flusso:
        for blocco in iter(lambda: flusso.read(1024 * 1024), b""):
            digest.update(blocco)
    return digest.hexdigest()


def numero_canonico(token: str) -> str | None:
    pulito = token.replace(" ", "")
    if "." in pulito and "," in pulito:
        pulito = pulito.replace(".", "").replace(",", ".")
    elif "," in pulito:
        pulito = pulito.replace(",", ".")
    elif pulito.count(".") > 1:
        pulito = pulito.replace(".", "")
    try:
        valore = Decimal(pulito)
    except InvalidOperation:
        return None
    return format(valore, "f")


def numeri_da_testo(testo: str, pagina: int, contesto: str) -> list[dict[str, Any]]:
    risultato = []
    for indice, match in enumerate(RE_NUMERO.finditer(testo), start=1):
        canonico = numero_canonico(match.group())
        if canonico is None:
            continue
        risultato.append(
            {
                "indice": indice,
                "pagina": pagina,
                "contesto": contesto,
                "token": match.group(),
                "valoreCanonico": canonico,
                "inizio": match.start(),
                "fine": match.end(),
            }
        )
    return risultato


def millimetri_da_punti(punti: float) -> str:
    """Converte un punto tipografico in millimetri, al millesimo."""
    misura = (Decimal(str(punti)) * MM_PER_PUNTO).quantize(
        TOLLERANZA_MM, rounding="ROUND_HALF_UP"
    )
    return format(misura, "f")


def millimetri(valore: str, unita: str) -> str | None:
    """Porta una misura scritta in mm, cm o m ai millimetri, al millesimo."""
    fattore = {"mm": Decimal("1"), "cm": Decimal("10"), "m": Decimal("1000")}
    scala = fattore.get(unita.lower())
    if scala is None:
        return None
    try:
        misura = Decimal(valore.replace(",", ".")) * scala
    except InvalidOperation:
        return None
    return format(misura.quantize(TOLLERANZA_MM, rounding="ROUND_HALF_UP"), "f")


def quota_z_mm(testo: str) -> str:
    """Asse Z in millimetri. Senza quota scritta resta 0,000."""
    trovato = RE_QUOTA_Z.search(testo or "")
    if not trovato:
        return "0.000"
    return millimetri(trovato.group(1), trovato.group(2)) or "0.000"


def coordinate_millimetriche(x0: float, y0: float, x1: float, y1: float, testo: str) -> dict[str, str]:
    return {
        "x0Mm": millimetri_da_punti(x0),
        "y0Mm": millimetri_da_punti(y0),
        "x1Mm": millimetri_da_punti(x1),
        "y1Mm": millimetri_da_punti(y1),
        "z0Mm": "0.000",
        "z1Mm": quota_z_mm(testo),
    }


def punto(valore: Any) -> list[float] | None:
    if hasattr(valore, "x") and hasattr(valore, "y"):
        risultato = [float(valore.x), float(valore.y)]
        if hasattr(valore, "z"):
            risultato.append(float(valore.z))
        return risultato
    if (
        isinstance(valore, (list, tuple))
        and len(valore) == 2
        and all(isinstance(voce, (int, float)) for voce in valore)
    ):
        return [float(valore[0]), float(valore[1])]
    return None


def rettangolo(valore: Any) -> list[float] | None:
    if all(hasattr(valore, nome) for nome in ("x0", "y0", "x1", "y1")):
        return [float(valore.x0), float(valore.y0), float(valore.x1), float(valore.y1)]
    if (
        isinstance(valore, (list, tuple))
        and len(valore) == 4
        and all(isinstance(voce, (int, float)) for voce in valore)
    ):
        return [float(voce) for voce in valore[:4]]
    return None


def serializza_primitiva(voce: Any) -> Any:
    if isinstance(voce, (str, int, float, bool)) or voce is None:
        return voce
    coordinata = punto(voce)
    if coordinata is not None:
        return coordinata
    area = rettangolo(voce)
    if area is not None:
        return area
    if isinstance(voce, (list, tuple)):
        return [serializza_primitiva(elemento) for elemento in voce]
    return str(voce)


def estrai_disegni(pagina: pymupdf.Page) -> list[dict[str, Any]]:
    disegni = []
    for indice, disegno in enumerate(pagina.get_drawings(), start=1):
        disegni.append(
            {
                "indice": indice,
                "tipo": str(disegno.get("type") or ""),
                "rettangolo": rettangolo(disegno.get("rect")),
                "colore": serializza_primitiva(disegno.get("color")),
                "riempimento": serializza_primitiva(disegno.get("fill")),
                "spessore": float(disegno.get("width") or 0),
                "opacitaTratto": float(disegno.get("stroke_opacity") or 0),
                "opacitaRiempimento": float(disegno.get("fill_opacity") or 0),
                "primitive": [
                    serializza_primitiva(elemento)
                    for elemento in disegno.get("items", [])
                ],
            }
        )
    return disegni


def estrai_tabelle(pagina: pymupdf.Page) -> list[dict[str, Any]]:
    risultato = []
    try:
        tabelle = pagina.find_tables().tables
    except Exception as errore:
        return [{"erroreEstrazione": type(errore).__name__, "messaggio": str(errore)}]
    for indice, tabella in enumerate(tabelle, start=1):
        matrice = tabella.extract()
        celle = []
        for riga, valori in enumerate(matrice):
            for colonna, valore in enumerate(valori):
                celle.append(
                    {
                        "riga": riga,
                        "colonna": colonna,
                        "testo": "" if valore is None else str(valore),
                    }
                )
        risultato.append(
            {
                "indice": indice,
                "rettangolo": rettangolo(tabella.bbox),
                "righe": int(tabella.row_count),
                "colonne": int(tabella.col_count),
                "celle": celle,
            }
        )
    return risultato


def estrai_pagina(pagina: pymupdf.Page) -> dict[str, Any]:
    numero = pagina.number + 1
    parole = []
    righe: dict[tuple[int, int], list[dict[str, Any]]] = {}
    for indice, parola in enumerate(
        pagina.get_text("words", sort=False),
        start=1,
    ):
        x0, y0, x1, y1, testo, blocco, riga, ordine = parola[:8]
        elemento = {
            "indice": indice,
            "testo": str(testo),
            "x0": float(x0),
            "y0": float(y0),
            "x1": float(x1),
            "y1": float(y1),
            "blocco": int(blocco),
            "riga": int(riga),
            "ordine": int(ordine),
        }
        elemento.update(coordinate_millimetriche(x0, y0, x1, y1, str(testo)))
        parole.append(elemento)
        righe.setdefault((int(blocco), int(riga)), []).append(elemento)
    righe_ordinate = []
    for indice, ((blocco, riga), componenti) in enumerate(righe.items(), start=1):
        testo_riga = " ".join(voce["testo"] for voce in componenti)
        riga_mm = coordinate_millimetriche(
            min(voce["x0"] for voce in componenti),
            min(voce["y0"] for voce in componenti),
            max(voce["x1"] for voce in componenti),
            max(voce["y1"] for voce in componenti),
            testo_riga,
        )
        righe_ordinate.append(
            {
                "indice": indice,
                "blocco": blocco,
                "riga": riga,
                "testo": testo_riga,
                "x0": min(voce["x0"] for voce in componenti),
                "y0": min(voce["y0"] for voce in componenti),
                "x1": max(voce["x1"] for voce in componenti),
                "y1": max(voce["y1"] for voce in componenti),
                "parole": [voce["indice"] for voce in componenti],
                **riga_mm,
            }
        )
    testo = pagina.get_text("text", sort=False)
    numeri = numeri_da_testo(testo, numero, "testo_pagina")
    return {
        "numero": numero,
        "larghezzaPt": float(pagina.rect.width),
        "altezzaPt": float(pagina.rect.height),
        "rotazione": int(pagina.rotation),
        "testoOriginaleEstratto": testo,
        "parole": parole,
        "righe": righe_ordinate,
        "tabelle": estrai_tabelle(pagina),
        "grigliaVettoriale": estrai_disegni(pagina),
        "valoriNumerici": numeri,
    }


def somma_mm(base: str, aggiunta: str, volte: int = 1) -> str:
    misura = Decimal(base) + Decimal(aggiunta) * volte
    return format(misura.quantize(TOLLERANZA_MM, rounding="ROUND_HALF_UP"), "f")


def etichetta_piano(token: str) -> tuple[str, int | None]:
    pulito = token.lower()
    if pulito.isdigit():
        numero = int(pulito)
        return f"Piano {numero}", numero
    indice = ORDINALI_PIANO.get(pulito)
    nomi = {
        "interrato": "Piano interrato",
        "seminterrato": "Piano seminterrato",
        "terra": "Piano terra",
        "rialzato": "Piano rialzato",
        "ammezzato": "Piano ammezzato",
    }
    if pulito in nomi:
        return nomi[pulito], indice
    if indice is None:
        return f"Piano {token}", None
    return f"Piano {indice}", indice


def assegna_piani(pagine: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Mette ogni piano sulla sua quota Z, anche se sono dieci o più."""
    interpiano = None
    for pagina in pagine:
        for riga in pagina["righe"]:
            trovato = RE_INTERPIANO.search(riga["testo"])
            if trovato:
                interpiano = millimetri(trovato.group(1), trovato.group(2))
                break
        if interpiano:
            break

    piani: list[dict[str, Any]] = []
    corrente: dict[str, Any] | None = None
    for pagina in pagine:
        for riga in pagina["righe"]:
            trovato = RE_PIANO.search(riga["testo"])
            if trovato:
                nome, indice = etichetta_piano(trovato.group(1))
                quota = RE_QUOTA_PIANO.search(riga["testo"])
                if quota:
                    z0 = millimetri(quota.group(1), quota.group(2)) or "mancante"
                    scritta = z0 != "mancante"
                elif (
                    corrente
                    and corrente["z0Mm"] != "mancante"
                    and interpiano
                    and indice is not None
                    and corrente["indice"] is not None
                ):
                    z0 = somma_mm(corrente["z0Mm"], interpiano, indice - corrente["indice"])
                    scritta = False
                else:
                    z0 = "mancante"
                    scritta = False
                corrente = {
                    "nome": nome,
                    "indice": indice,
                    "z0Mm": z0,
                    "z1Mm": z0,
                    "quotaScritta": scritta,
                    "interpianoMm": interpiano,
                }
                piani.append(corrente)
            if corrente is None:
                continue
            spessore = quota_z_mm(riga["testo"])
            z0 = corrente["z0Mm"]
            z1 = z0 if z0 == "mancante" or spessore == "0.000" else somma_mm(z0, spessore)
            riga["piano"] = corrente["nome"]
            riga["z0Mm"] = z0
            riga["z1Mm"] = z1
            for indice_parola in riga["parole"]:
                parola = pagina["parole"][indice_parola - 1]
                parola["piano"] = corrente["nome"]
                parola["z0Mm"] = z0
                parola["z1Mm"] = z1
    return [
        {
            "nome": piano["nome"],
            "indice": piano["indice"],
            "z0Mm": piano["z0Mm"],
            "z1Mm": piano["z1Mm"],
            "quotaScritta": piano["quotaScritta"],
            "interpianoMm": piano["interpianoMm"],
        }
        for piano in piani
    ]


def metriche(documento: dict[str, Any]) -> dict[str, Any]:
    pagine = documento["struttura"]["pagine"]
    tabelle = [tabella for pagina in pagine for tabella in pagina["tabelle"]]
    tabelle_valide = [tabella for tabella in tabelle if "celle" in tabella]
    numeri = [numero for pagina in pagine for numero in pagina["valoriNumerici"]]
    coordinate = []
    for pagina in pagine:
        for parola in pagina["parole"]:
            coordinate.extend(
                parola[chiave]
                for chiave in ("x0Mm", "y0Mm", "z0Mm", "x1Mm", "y1Mm", "z1Mm")
            )
        for riga in pagina["righe"]:
            coordinate.extend(
                riga[chiave]
                for chiave in ("x0Mm", "y0Mm", "z0Mm", "x1Mm", "y1Mm", "z1Mm")
            )
    return {
        "pagine": len(pagine),
        "pagineSenzaTesto": sum(not pagina["testoOriginaleEstratto"] for pagina in pagine),
        "caratteri": sum(len(pagina["testoOriginaleEstratto"]) for pagina in pagine),
        "parole": sum(len(pagina["parole"]) for pagina in pagine),
        "righe": sum(len(pagina["righe"]) for pagina in pagine),
        "tabelle": len(tabelle_valide),
        "celleTabella": sum(len(tabella["celle"]) for tabella in tabelle_valide),
        "primitiveGrafiche": sum(
            len(pagina["grigliaVettoriale"]) for pagina in pagine
        ),
        "valoriNumerici": len(numeri),
        "coordinate": len(coordinate),
    }


def estrai_documento(percorso: Path, tipo: str, transazione: str) -> dict[str, Any]:
    byte = percorso.read_bytes()
    documento_pdf = pymupdf.open(stream=byte, filetype="pdf")
    pagine = [estrai_pagina(pagina) for pagina in documento_pdf]
    piani = assegna_piani(pagine)
    struttura = {
        "schema": VERSIONE,
        "tipo": tipo,
        "unitaCoordinate": "millimetri",
        "precisioneAuditCoordinate": "0.001",
        "assi": "x,y,z",
        "pagine": pagine,
    }
    dati = {
        "documento": {
            "tipo": tipo,
            "nomeFonte": percorso.name,
            "formato": "PDF",
            "byteFonte": len(byte),
            "sha256Fonte": sha256_byte(byte),
        },
        "struttura": struttura,
        "piani": piani,
    }
    dati["metriche"] = metriche(dati)
    hash_payload = sha256_byte(json_canonico(dati))
    dati["certificazione"] = {
        "schema": VERSIONE,
        "transazione": transazione,
        "algoritmo": "SHA-256",
        "sha256PayloadSenzaCertificazione": hash_payload,
        "ledger": "ledger-forense.jsonl",
        "modalita": "impronta_distaccata",
    }
    return dati


def scarto_mm(prima: str, seconda: str) -> Decimal:
    if prima == "mancante" and seconda == "mancante":
        return Decimal("0")
    if prima == "mancante" or seconda == "mancante":
        return TOLLERANZA_MM + Decimal("1")
    return abs(Decimal(prima) - Decimal(seconda))


def confronta_coordinate(originale: dict[str, Any], elaborato: dict[str, Any]) -> dict[str, Any]:
    massimo = Decimal("0")
    discrepanze = 0
    campi = ("x0Mm", "y0Mm", "z0Mm", "x1Mm", "y1Mm", "z1Mm")
    for pagina_a, pagina_b in zip(
        originale["struttura"]["pagine"],
        elaborato["struttura"]["pagine"],
        strict=True,
    ):
        for raccolta in ("parole", "righe"):
            for voce_a, voce_b in zip(
                pagina_a[raccolta],
                pagina_b[raccolta],
                strict=True,
            ):
                for campo in campi:
                    delta = scarto_mm(str(voce_a[campo]), str(voce_b[campo]))
                    massimo = max(massimo, delta)
                    if delta > TOLLERANZA_MM:
                        discrepanze += 1
    return {
        "unita": "mm",
        "assi": "x,y,z",
        "tolleranzaMm": "0.001",
        "deltaMassimoMm": format(massimo, "f"),
        "discrepanzeOltreTolleranza": discrepanze,
        "esito": "conforme" if discrepanze == 0 else "non_conforme",
    }


def audit_documento(
    fonte: Path,
    copia: Path,
    memoria: dict[str, Any],
    riletto: dict[str, Any],
) -> dict[str, Any]:
    numeri_memoria = Counter(
        (
            voce["pagina"],
            voce["token"],
            voce["valoreCanonico"],
            voce["inizio"],
            voce["fine"],
        )
        for pagina in memoria["struttura"]["pagine"]
        for voce in pagina["valoriNumerici"]
    )
    numeri_riletti = Counter(
        (
            voce["pagina"],
            voce["token"],
            voce["valoreCanonico"],
            voce["inizio"],
            voce["fine"],
        )
        for pagina in riletto["struttura"]["pagine"]
        for voce in pagina["valoriNumerici"]
    )
    hash_payload_atteso = memoria["certificazione"]["sha256PayloadSenzaCertificazione"]
    senza_certificazione = {
        chiave: valore
        for chiave, valore in riletto.items()
        if chiave != "certificazione"
    }
    verifiche = {
        "copiaByteIdentica": fonte.read_bytes() == copia.read_bytes(),
        "sha256OriginaleCoincidente": sha256_file(fonte) == sha256_file(copia),
        "payloadCanonicoCoincidente": (
            sha256_byte(json_canonico(senza_certificazione)) == hash_payload_atteso
        ),
        "metricheCoincidenti": memoria["metriche"] == riletto["metriche"],
        "testoCoincidente": all(
            pagina_a["testoOriginaleEstratto"] == pagina_b["testoOriginaleEstratto"]
            for pagina_a, pagina_b in zip(
                memoria["struttura"]["pagine"],
                riletto["struttura"]["pagine"],
                strict=True,
            )
        ),
        "paroleCoincidenti": all(
            pagina_a["parole"] == pagina_b["parole"]
            for pagina_a, pagina_b in zip(
                memoria["struttura"]["pagine"],
                riletto["struttura"]["pagine"],
                strict=True,
            )
        ),
        "righeCoincidenti": all(
            pagina_a["righe"] == pagina_b["righe"]
            for pagina_a, pagina_b in zip(
                memoria["struttura"]["pagine"],
                riletto["struttura"]["pagine"],
                strict=True,
            )
        ),
        "tabelleCoincidenti": all(
            pagina_a["tabelle"] == pagina_b["tabelle"]
            for pagina_a, pagina_b in zip(
                memoria["struttura"]["pagine"],
                riletto["struttura"]["pagine"],
                strict=True,
            )
        ),
        "griglieCoincidenti": all(
            pagina_a["grigliaVettoriale"] == pagina_b["grigliaVettoriale"]
            for pagina_a, pagina_b in zip(
                memoria["struttura"]["pagine"],
                riletto["struttura"]["pagine"],
                strict=True,
            )
        ),
        "valoriNumericiCoincidenti": numeri_memoria == numeri_riletti,
    }
    coordinate = confronta_coordinate(memoria, riletto)
    verifiche["coordinateAlMillesimo"] = coordinate["esito"] == "conforme"
    conforme = all(verifiche.values())
    return {
        "esito": "parita_100_percento" if conforme else "discrepanze_rilevate",
        "paritaPercentuale": "100.000" if conforme else "non_calcolabile",
        "verifiche": verifiche,
        "coordinate": coordinate,
        "differenzeNumeriche": {
            "mancanti": sum((numeri_memoria - numeri_riletti).values()),
            "aggiunti": sum((numeri_riletti - numeri_memoria).values()),
        },
        "metriche": riletto["metriche"],
    }


def append_ledger(
    ledger: Path,
    transazione: str,
    tipo: str,
    fonte: Path,
    originale: Path,
    elaborato: Path,
    audit: dict[str, Any],
) -> dict[str, Any]:
    precedente = "0" * 64
    sequenza = 1
    if ledger.exists():
        righe = [riga for riga in ledger.read_text(encoding="utf-8").splitlines() if riga]
        if righe:
            ultimo = json.loads(righe[-1])
            precedente = ultimo["hashEvento"]
            sequenza = int(ultimo["sequenza"]) + 1
    payload = {
        "transazione": transazione,
        "tipo": tipo,
        "sha256Fonte": sha256_file(fonte),
        "sha256CopiaOriginale": sha256_file(originale),
        "sha256Elaborato": sha256_file(elaborato),
        "esitoAudit": audit["esito"],
    }
    nucleo = {
        "versione": VERSIONE,
        "sequenza": sequenza,
        "timestampUtc": datetime.now(timezone.utc).isoformat(timespec="milliseconds"),
        "evento": "documento_estratto_certificato",
        "algoritmo": "SHA-256",
        "hashPrecedente": precedente,
        "hashPayload": sha256_byte(json_canonico(payload)),
        "payload": payload,
    }
    evento = {**nucleo, "hashEvento": sha256_byte(json_canonico(nucleo))}
    with ledger.open("a", encoding="utf-8", newline="\n") as flusso:
        flusso.write(json.dumps(evento, ensure_ascii=False, sort_keys=True) + "\n")
    return evento


def verifica_ledger(percorso: Path) -> dict[str, Any]:
    precedente = "0" * 64
    eventi = []
    for numero, riga in enumerate(
        percorso.read_text(encoding="utf-8").splitlines(),
        start=1,
    ):
        evento = json.loads(riga)
        hash_evento = evento.pop("hashEvento")
        valido = (
            evento["sequenza"] == numero
            and evento["hashPrecedente"] == precedente
            and sha256_byte(json_canonico(evento["payload"])) == evento["hashPayload"]
            and sha256_byte(json_canonico(evento)) == hash_evento
        )
        eventi.append({"sequenza": numero, "valido": valido, "hashEvento": hash_evento})
        precedente = hash_evento
    return {
        "esito": "valido" if all(voce["valido"] for voce in eventi) else "non_valido",
        "eventi": eventi,
        "testa": precedente,
    }


def scrivi_json(percorso: Path, dati: Any) -> None:
    percorso.write_text(
        json.dumps(dati, ensure_ascii=False, indent=2, allow_nan=False) + "\n",
        encoding="utf-8",
    )


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--cme", required=True, type=Path)
    parser.add_argument("--abaco", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    argomenti = parser.parse_args()
    argomenti.output.mkdir(parents=True, exist_ok=True)

    transazione = f"forense-{datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ')}"
    ledger = argomenti.output / "ledger-forense.jsonl"
    rapporti = {}
    eventi = {}
    definizioni = [
        ("cme", argomenti.cme, "01-CME-Originale.pdf", "02-CME-Elaborato-Timbrato.json"),
        (
            "abaco",
            argomenti.abaco,
            "03-Abaco-Originale.pdf",
            "04-Abaco-Elaborato-Timbrato.json",
        ),
    ]
    for tipo, fonte, nome_originale, nome_elaborato in definizioni:
        originale = argomenti.output / nome_originale
        elaborato = argomenti.output / nome_elaborato
        shutil.copyfile(fonte, originale)
        dati = estrai_documento(fonte, tipo, transazione)
        scrivi_json(elaborato, dati)
        riletto = json.loads(elaborato.read_text(encoding="utf-8"))
        audit = audit_documento(fonte, originale, dati, riletto)
        rapporti[tipo] = audit
        eventi[tipo] = append_ledger(
            ledger,
            transazione,
            tipo,
            fonte,
            originale,
            elaborato,
            audit,
        )

    verifica = verifica_ledger(ledger)
    rapporto = {
        "schema": VERSIONE,
        "transazione": transazione,
        "metodo": {
            "motore": f"PyMuPDF {pymupdf.VersionBind}",
            "hash": "SHA-256",
            "coordinate": "punti PDF",
            "tolleranzaCoordinate": "0.001",
            "ambito": "byte, testo PDF, parole, righe, tabelle, primitive vettoriali, numeri e coordinate",
        },
        "documenti": rapporti,
        "ledger": verifica,
        "eventiLedger": eventi,
        "esitoGlobale": (
            "parita_100_percento"
            if verifica["esito"] == "valido"
            and all(voce["esito"] == "parita_100_percento" for voce in rapporti.values())
            else "discrepanze_rilevate"
        ),
    }
    scrivi_json(argomenti.output / "05-Rapporto-Audit-Forense.json", rapporto)
    print(json.dumps(rapporto, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
