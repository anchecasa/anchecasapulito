"use client";

import Link from "next/link";
import { useState } from "react";

type Verifica = Record<string, boolean>;

type Risultato = {
  ok: boolean;
  errore?: string;
  nome?: string;
  byte?: number;
  sha256?: string;
  etichetta?: string;
  stato?: string;
  nota?: string;
  triplaVerifica?: {
    coerente: boolean;
    hashPayload: string[];
    metriche?: {
      pagine?: number;
      tabelle?: number;
      valoriNumerici?: number;
      coordinate?: number;
    };
    audit: Array<{
      passaggio: number;
      esito: string;
      verifiche?: Verifica;
      coordinate?: {
        esito?: string;
        discrepanzeOltreTolleranza?: number;
        unita?: string;
        assi?: string;
        tolleranzaMm?: string;
        deltaMassimoMm?: string;
      };
    }>;
  };
  archivio?: {
    file: number;
    voci: Array<{ nome: string; etichetta: string; byte: number; sha256: string }>;
  };
  improntaRapporto?: string;
  piani?: Array<{
    nome: string;
    z0Mm: string;
    z1Mm: string;
    quotaScritta: boolean;
    interpianoMm: string | null;
  }>;
};

const ETICHETTE: Record<string, string> = {
  copiaByteIdentica: "Copia identica",
  sha256OriginaleCoincidente: "Impronta del file",
  payloadCanonicoCoincidente: "Contenuto estratto",
  metricheCoincidenti: "Numeri di riepilogo",
  testoCoincidente: "Testo",
  paroleCoincidenti: "Parole",
  righeCoincidenti: "Righe",
  tabelleCoincidenti: "Tabelle",
  griglieCoincidenti: "Griglia",
  valoriNumericiCoincidenti: "Valori numerici",
  coordinateAlMillesimo: "Coordinate x, y, z in millimetri",
};

function byteLeggibili(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export default function PaginaBim() {
  const [file, setFile] = useState<File | null>(null);
  const [attesa, setAttesa] = useState(false);
  const [esito, setEsito] = useState<Risultato | null>(null);

  async function analizza() {
    if (!file) {
      setEsito({ ok: false, errore: "Scegli un PDF o uno ZIP." });
      return;
    }
    setAttesa(true);
    setEsito(null);
    const dati = new FormData();
    dati.set("file", file);
    try {
      const risposta = await fetch("/api/bim/analizza", { method: "POST", body: dati });
      const json = (await risposta.json()) as Risultato;
      setEsito(json);
    } catch {
      setEsito({ ok: false, errore: "Il controllo non è partito." });
    } finally {
      setAttesa(false);
    }
  }

  const tripla = esito?.triplaVerifica;
  const primo = tripla?.audit[0];

  return (
    <main className="mx-auto flex min-h-full w-full max-w-3xl flex-col gap-6 px-6 py-10">
      <Link href="/admin" className="min-h-11 text-base font-semibold text-[#B4500B]">
        ← Cruscotto
      </Link>
      <header>
        <p className="text-sm font-semibold text-[#B4500B]">AncheBIM</p>
        <h1 className="mt-1 text-3xl font-semibold text-[#1A2432]">Analizza un file</h1>
        <p className="mt-2 text-base text-[#2A3C54]">
          Un PDF viene letto tre volte. Le coordinate x, y e z sono in millimetri,
          al millesimo. In un palazzo ogni piano ha la sua quota: se scrivi il primo
          piano e l’interpiano, i piani sopra si calcolano da soli, anche se sono dieci.
          Uno ZIP elenca i documenti e ne calcola l’impronta.
        </p>
      </header>

      <label className="flex min-h-11 cursor-pointer flex-col justify-center rounded-2xl border border-[#E7D3C3] bg-white px-4 py-3">
        <span className="text-sm font-semibold text-[#1A2432]">File</span>
        <input
          className="mt-2 block w-full text-base"
          type="file"
          accept=".pdf,.zip,application/pdf,application/zip"
          aria-label="Scegli il PDF o lo ZIP da analizzare"
          onChange={(evento) => {
            setFile(evento.target.files?.[0] ?? null);
            setEsito(null);
          }}
        />
      </label>

      <button
        type="button"
        className="min-h-11 rounded-full bg-[#B4500B] px-5 text-base font-semibold text-white disabled:opacity-60"
        onClick={analizza}
        disabled={attesa}
      >
        {attesa ? "Analisi in corso…" : "Analizza"}
      </button>

      {esito && !esito.ok && (
        <p className="rounded-2xl bg-[#F8E6E1] px-4 py-3 text-base text-[#1A2432]" role="alert">
          {esito.errore || "Analisi non riuscita."}
        </p>
      )}

      {esito?.ok && (
        <section className="flex flex-col gap-4 rounded-2xl bg-white px-4 py-4">
          <h2 className="text-xl font-semibold text-[#1A2432]">{esito.nome}</h2>
          <p className="text-base text-[#2A3C54]">
            {esito.etichetta}
            {esito.byte != null ? ` · ${byteLeggibili(esito.byte)}` : ""}
            {esito.stato === "coerente" ? " · Controllo triplo superato" : ""}
            {esito.stato === "discrepanze" ? " · Il controllo triplo ha trovato differenze" : ""}
            {esito.stato === "archivio_letto" ? ` · ${esito.archivio?.file ?? 0} file` : ""}
          </p>
          {esito.nota && <p className="text-base text-[#2A3C54]">{esito.nota}</p>}
          <p className="break-all font-mono text-sm text-[#1A2432]">
            SHA-256 {esito.sha256}
          </p>
          {tripla?.metriche && (
            <p className="text-base text-[#2A3C54]">
              Pagine {tripla.metriche.pagine ?? 0}, tabelle {tripla.metriche.tabelle ?? 0},
              numeri {tripla.metriche.valoriNumerici ?? 0}, coordinate {tripla.metriche.coordinate ?? 0}.
            </p>
          )}
          {esito.piani && esito.piani.length > 0 && (
            <ul className="flex flex-col gap-2">
              {esito.piani.map((piano) => (
                <li key={`${piano.nome}-${piano.z0Mm}`} className="min-h-11 text-base text-[#1A2432]">
                  <span className="font-semibold">{piano.nome}</span>
                  {piano.z0Mm === "mancante" ? (
                    <span className="text-[#9B2C2C]"> · quota da scrivere, oppure indica l’interpiano</span>
                  ) : (
                    <span className="text-[#2A3C54]">
                      {" "}
                      · quota {piano.z0Mm} mm
                      {piano.quotaScritta ? "" : " · calcolata dall’interpiano"}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
          {primo?.coordinate?.unita === "mm" && (
            <p className="text-base text-[#2A3C54]">
              Assi {primo.coordinate.assi}. Tolleranza {primo.coordinate.tolleranzaMm} mm.
              Scarto massimo {primo.coordinate.deltaMassimoMm} mm.
            </p>
          )}
          {primo?.verifiche && (
            <ul className="flex flex-col gap-2">
              {Object.entries(primo.verifiche).map(([chiave, valore]) => (
                <li key={chiave} className="flex min-h-11 items-center justify-between gap-3 text-base">
                  <span>{ETICHETTE[chiave] || chiave}</span>
                  <span className={valore ? "font-semibold text-[#1F6B3A]" : "font-semibold text-[#9B2C2C]"}>
                    {valore ? "Uguale" : "Diverso"}
                  </span>
                </li>
              ))}
            </ul>
          )}
          {esito.archivio && (
            <ul className="flex flex-col gap-3">
              {esito.archivio.voci.map((voce) => (
                <li key={`${voce.nome}-${voce.sha256}`} className="text-base">
                  <span className="font-semibold text-[#1A2432]">{voce.nome}</span>
                  <span className="text-[#2A3C54]"> · {voce.etichetta} · {byteLeggibili(voce.byte)}</span>
                  <span className="mt-1 block break-all font-mono text-sm">{voce.sha256}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </main>
  );
}
