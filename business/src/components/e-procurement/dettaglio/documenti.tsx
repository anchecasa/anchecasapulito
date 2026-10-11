"use client";

import { Download, FilePlus2, RefreshCw, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { togliDocumento, verificaDiNuovo } from "@/app/admin/e-procurement/actions";
import { caricaDocumentoGara, type StatoCaricamento } from "@/lib/e-procurement/caricamento";
import { linkDocumento } from "@/lib/e-procurement/documenti";
import { formatoByte, formatoData } from "@/lib/e-procurement/formato";
import { ESTENSIONI, controllaFile } from "@/lib/e-procurement/schemi";
import type { Documento, StatoGara } from "@/lib/e-procurement/tipi";
import { EsitoBadge, stile } from "../ui";

export function Documenti({
  gara,
  stato,
  documenti,
  gestisci,
}: {
  gara: string;
  stato: StatoGara;
  documenti: Documento[];
  /** true nel cruscotto admin, false nel portale fornitori */
  gestisci: boolean;
}) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [invii, setInvii] = useState<{ nome: string; stato: StatoCaricamento; errore?: string }[]>([]);
  const [errore, setErrore] = useState<string | null>(null);
  const [attesa, avvia] = useTransition();

  const puoCaricare = gestisci && (stato === "bozza" || stato === "pubblicata");
  const puoTogliere = gestisci && stato === "bozza";

  const scarica = (id: string) =>
    avvia(async () => {
      const r = await linkDocumento(id);
      if (!r.ok) setErrore(r.errore);
      else window.location.assign(r.dati.url);
    });

  const togli = (id: string, nome: string) => {
    if (!window.confirm(`Togliere «${nome}»?`)) return;
    avvia(async () => {
      const r = await togliDocumento(id);
      if (!r.ok) setErrore(r.errore);
    });
  };

  const riprova = (id: string) =>
    avvia(async () => {
      const r = await verificaDiNuovo(id);
      if (!r.ok) setErrore(r.errore);
    });

  const scegli = async (lista: FileList | null) => {
    if (!lista?.length) return;
    setErrore(null);
    const file = Array.from(lista);
    const problemi = file.map(controllaFile).filter(Boolean) as string[];
    if (problemi.length) {
      setErrore(problemi.join(" · "));
      return;
    }
    if (stato === "pubblicata" && !window.confirm("La gara è già aperta: il file si aggiunge come integrazione e lo vedono i fornitori. Procedere?")) {
      return;
    }
    setInvii(file.map((f) => ({ nome: f.name, stato: "in_coda" as StatoCaricamento })));
    for (const [n, f] of file.entries()) {
      await caricaDocumentoGara(gara, f, (s, extra) => setInvii((l) => l.map((x, i) => (i === n ? { ...x, stato: s, errore: extra?.errore } : x))));
    }
    if (input.current) input.current.value = "";
    router.refresh();
    setTimeout(() => setInvii((l) => l.filter((x) => x.stato === "errore")), 2500);
  };

  return (
    <section className="rounded-2xl bg-white ring-1 ring-[#EFE3D8]" aria-labelledby="titolo-documenti">
      <header className="flex items-center justify-between gap-2 border-b border-[#EFE3D8] px-4 py-3">
        <h2 id="titolo-documenti" className="flex items-center gap-2 text-lg font-semibold text-[#1A2432]">
          <ShieldCheck size={18} className="text-blue-800" aria-hidden="true" />
          Documenti di gara <span className="font-normal text-[#8A97A8]">{documenti.length}</span>
        </h2>
        {puoCaricare ? (
          <label className={`${stile.piccolo} cursor-pointer`}>
            <FilePlus2 size={14} aria-hidden="true" />
            {stato === "pubblicata" ? "Aggiungi integrazione" : "Carica"}
            <input ref={input} type="file" multiple accept={ESTENSIONI.join(",")} className="sr-only" onChange={(e) => scegli(e.target.files)} />
          </label>
        ) : null}
      </header>

      {errore ? (
        <p role="alert" className="px-4 pt-3 text-sm text-[#9B2C1F]">
          {errore}
        </p>
      ) : null}

      {invii.length > 0 ? (
        <ul className="border-b border-[#EFE3D8] bg-[#FBF8F3] px-4 py-2">
          {invii.map((x, i) => (
            <li key={i} className="flex items-center justify-between gap-3 py-1 text-sm">
              <span className="truncate">
                {x.nome}
                {x.errore ? <span className="text-[#9B2C1F]"> · {x.errore}</span> : null}
              </span>
              <EsitoBadge esito={x.stato} />
            </li>
          ))}
        </ul>
      ) : null}

      {documenti.length === 0 ? (
        <p className="px-4 py-8 text-center text-base text-[#2A3C54]">Nessun documento allegato.</p>
      ) : (
        <ul className="divide-y divide-[#EFE3D8]">
          {documenti.map((d) => (
            <li key={d.id} className="flex min-h-11 flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2.5">
              <div className="min-w-0 flex-1 basis-56">
                <p className="truncate font-semibold text-[#1A2432]">{d.nome}</p>
                <p className="truncate font-mono text-xs text-[#2A3C54]" title={d.sha256}>
                  {formatoByte(d.byte)} · {formatoData(d.creato)} · sha256:{d.sha256.slice(0, 16)}…
                </p>
              </div>
              <EsitoBadge esito={d.esito} />
              {gestisci && d.esito === "in_verifica" ? (
                <button type="button" onClick={() => riprova(d.id)} disabled={attesa} aria-label={`Ripeti il controllo di ${d.nome}`} className="flex h-11 w-11 items-center justify-center rounded-full text-[#2A3C54] hover:bg-[#FBF8F3]">
                  <RefreshCw size={16} aria-hidden="true" />
                </button>
              ) : null}
              <button type="button" onClick={() => scarica(d.id)} disabled={attesa} aria-label={`Scarica ${d.nome}`} className="flex h-11 w-11 items-center justify-center rounded-full text-[#2A3C54] hover:bg-[#FBF8F3]">
                <Download size={18} aria-hidden="true" />
              </button>
              {puoTogliere ? (
                <button type="button" onClick={() => togli(d.id, d.nome)} disabled={attesa} className="min-h-9 px-2 text-sm text-[#2A3C54] hover:text-[#9B2C1F]">
                  Togli
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
