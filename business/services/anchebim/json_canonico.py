"""JSON canonico AncheBIM compatibile con JSON.stringify sui numeri ammessi."""

from __future__ import annotations

import hashlib
import json
import math
from decimal import Decimal
from typing import Any


VERSIONE_JSON_CANONICO = "anchebim-json-canonical-v1"
MASSIMO_INTERO_ESATTO = 9_007_199_254_740_991


class ErroreJsonCanonico(TypeError):
    codice = "VALORE_NON_JSON"


def _chiave_utf16(valore: str) -> bytes:
    return valore.encode("utf-16-be", errors="surrogatepass")


def _numero_canonico(valore: int | float) -> str:
    if isinstance(valore, int):
        if abs(valore) > MASSIMO_INTERO_ESATTO:
            raise ErroreJsonCanonico("Intero oltre il limite esatto IEEE-754.")
        return str(valore)
    if not math.isfinite(valore):
        raise ErroreJsonCanonico("Il JSON canonico accetta soltanto numeri finiti.")
    if valore == 0:
        return "0"
    assoluto = abs(valore)
    rappresentazione = repr(valore).lower()
    if 1e-6 <= assoluto < 1e21:
        testo = format(Decimal(rappresentazione), "f")
        return testo.rstrip("0").rstrip(".") if "." in testo else testo
    mantissa, esponente = rappresentazione.split("e")
    mantissa = mantissa.rstrip("0").rstrip(".")
    numero_esponente = int(esponente)
    segno = "+" if numero_esponente >= 0 else ""
    return f"{mantissa}e{segno}{numero_esponente}"


def _serializza(valore: Any, percorso: str = "$") -> str:
    if valore is None:
        return "null"
    if isinstance(valore, bool):
        return "true" if valore else "false"
    if isinstance(valore, str):
        return json.dumps(valore, ensure_ascii=False, separators=(",", ":"))
    if isinstance(valore, (int, float)):
        return _numero_canonico(valore)
    if isinstance(valore, (list, tuple)):
        return "[" + ",".join(
            _serializza(figlio, f"{percorso}[{indice}]")
            for indice, figlio in enumerate(valore)
        ) + "]"
    if isinstance(valore, dict):
        if any(not isinstance(chiave, str) for chiave in valore):
            raise ErroreJsonCanonico(f"Chiave non testuale in {percorso}.")
        parti = []
        for chiave in sorted(valore, key=_chiave_utf16):
            nome = json.dumps(chiave, ensure_ascii=False, separators=(",", ":"))
            parti.append(f"{nome}:{_serializza(valore[chiave], f'{percorso}.{chiave}')}")
        return "{" + ",".join(parti) + "}"
    raise ErroreJsonCanonico(f"Valore non JSON in {percorso}.")


def json_canonico(dati: Any) -> bytes:
    return _serializza(dati).encode("utf-8")


def digest(dati: bytes) -> str:
    return hashlib.sha256(dati).hexdigest()


def sha256_canonico(dati: Any) -> str:
    return digest(json_canonico(dati))
