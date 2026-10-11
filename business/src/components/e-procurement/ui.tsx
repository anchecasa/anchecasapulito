"use client";

import { X } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";
import type { EsitoDocumento, StatoGara, StatoInvito } from "@/lib/e-procurement/tipi";

export const stile = {
  primario:
    "inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-blue-800 px-5 text-sm font-semibold text-white hover:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-800",
  secondario:
    "inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-white px-5 text-sm font-semibold text-blue-900 ring-1 ring-blue-200 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-800",
  pericolo:
    "inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-white px-5 text-sm font-semibold text-[#9B2C1F] ring-1 ring-[#F1C7BE] hover:bg-[#F8E6E1] disabled:cursor-not-allowed disabled:opacity-60",
  piccolo:
    "inline-flex min-h-9 items-center gap-1.5 rounded-full bg-white px-3 text-xs font-semibold text-blue-900 ring-1 ring-blue-200 hover:bg-blue-50 disabled:opacity-60",
  campo: (errore?: boolean) =>
    `mt-1 block w-full min-h-11 rounded-xl border px-3 py-2 text-base font-normal text-[#1A2432] placeholder:text-[#8A97A8] focus:outline-none focus:ring-2 ${
      errore ? "border-[#C2412D] focus:ring-[#C2412D]/30" : "border-[#E7D3C3] focus:border-blue-700 focus:ring-blue-700/20"
    }`,
  etichetta: "block text-sm font-semibold text-[#1A2432]",
  scheda: "rounded-2xl bg-white ring-1 ring-[#EFE3D8]",
};

export function Avviso({ tono, children }: { tono: "errore" | "ok" | "info"; children: ReactNode }) {
  const c = tono === "errore" ? "bg-[#F8E6E1]" : tono === "ok" ? "bg-[#E5F2E8]" : "bg-[#FFF4E8]";
  return (
    <p role={tono === "errore" ? "alert" : "status"} className={`rounded-2xl px-4 py-3 text-base text-[#1A2432] ${c}`}>
      {children}
    </p>
  );
}

const STATI: Record<StatoGara, { testo: string; c: string }> = {
  bozza: { testo: "Bozza", c: "bg-slate-100 text-slate-700" },
  pubblicata: { testo: "Aperta", c: "bg-blue-100 text-blue-900" },
  chiusa: { testo: "Chiusa", c: "bg-amber-100 text-amber-900" },
  aggiudicata: { testo: "Aggiudicata", c: "bg-emerald-100 text-emerald-900" },
  annullata: { testo: "Annullata", c: "bg-[#F8E6E1] text-[#9B2C1F]" },
};

export function StatoGaraBadge({ stato }: { stato: StatoGara }) {
  const s = STATI[stato];
  return <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${s.c}`}>{s.testo}</span>;
}

const ESITI: Record<EsitoDocumento | "in_coda" | "impronta" | "invio" | "errore", { testo: string; c: string }> = {
  in_coda: { testo: "In coda", c: "text-slate-500" },
  impronta: { testo: "Calcolo SHA-256…", c: "text-slate-500" },
  invio: { testo: "Caricamento…", c: "text-slate-500" },
  in_verifica: { testo: "In verifica AncheBIM", c: "text-amber-800" },
  verificato: { testo: "Verificato AncheBIM", c: "text-emerald-800" },
  avvisi: { testo: "Letto con avvisi", c: "text-amber-800" },
  respinto: { testo: "Respinto", c: "text-[#9B2C1F]" },
  errore: { testo: "Errore", c: "text-[#9B2C1F]" },
};

export function EsitoBadge({ esito }: { esito: keyof typeof ESITI }) {
  const e = ESITI[esito];
  return <span className={`whitespace-nowrap text-xs font-semibold ${e.c}`}>{e.testo}</span>;
}

const INVITI: Record<StatoInvito | "aperta", { testo: string; c: string }> = {
  aperta: { testo: "Aperta alla rete", c: "bg-slate-100 text-slate-700" },
  invitato: { testo: "Invitato", c: "bg-slate-100 text-slate-700" },
  visto: { testo: "Ha visto", c: "bg-blue-100 text-blue-900" },
  rinuncia: { testo: "Ha rinunciato", c: "bg-[#F8E6E1] text-[#9B2C1F]" },
  offerta: { testo: "Offerta inviata", c: "bg-emerald-100 text-emerald-900" },
};

export function InvitoBadge({ stato }: { stato: StatoInvito | "aperta" }) {
  const s = INVITI[stato];
  return <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${s.c}`}>{s.testo}</span>;
}

/** Finestra modale su <dialog> nativo: Esc e focus li gestisce il browser. */
export function Finestra({
  aperta,
  chiudi,
  titolo,
  sottotitolo,
  bloccata,
  larga,
  piede,
  children,
}: {
  aperta: boolean;
  chiudi: () => void;
  titolo: string;
  sottotitolo?: string;
  bloccata?: boolean;
  larga?: boolean;
  piede?: ReactNode;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (aperta && !d.open) d.showModal();
    if (!aperta && d.open) d.close();
  }, [aperta]);

  return (
    <dialog
      ref={ref}
      aria-label={titolo}
      onCancel={(e) => {
        e.preventDefault();
        if (!bloccata) chiudi();
      }}
      className={`m-auto w-[calc(100%-2rem)] rounded-3xl bg-[#FBF8F3] p-0 shadow-2xl backdrop:bg-[#1A2432]/50 ${larga ? "max-w-3xl" : "max-w-lg"}`}
    >
      <div className="flex max-h-[90vh] flex-col">
        <header className="flex items-start justify-between gap-4 border-b border-[#EFE3D8] px-5 py-4">
          <div>
            <h2 className="text-xl font-semibold text-[#1A2432]">{titolo}</h2>
            {sottotitolo ? <p className="mt-0.5 text-sm text-[#2A3C54]">{sottotitolo}</p> : null}
          </div>
          <button
            type="button"
            aria-label="Chiudi"
            onClick={() => !bloccata && chiudi()}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[#2A3C54] hover:bg-white"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto px-5 py-5">{children}</div>
        {piede ? (
          <footer className="flex flex-col-reverse gap-2 border-t border-[#EFE3D8] px-5 py-4 sm:flex-row sm:justify-end">{piede}</footer>
        ) : null}
      </div>
    </dialog>
  );
}
