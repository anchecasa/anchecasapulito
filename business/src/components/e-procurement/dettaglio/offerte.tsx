"use client";

import { Award, LockKeyhole, Trophy } from "lucide-react";
import { useState, useTransition } from "react";
import { aggiudica } from "@/app/admin/e-procurement/actions";
import { formatoData, formatoEuro } from "@/lib/e-procurement/formato";
import type { Gara, Offerta } from "@/lib/e-procurement/tipi";
import { stile } from "../ui";

export function Offerte({
  gara,
  offerte,
  quante,
  nomi,
  busteChiuse,
}: {
  gara: Gara;
  offerte: Offerta[];
  quante: number;
  nomi: Record<string, string>;
  /** calcolato sul server: gara aperta e scadenza non ancora passata */
  busteChiuse: boolean;
}) {
  const [attesa, avvia] = useTransition();
  const [errore, setErrore] = useState<string | null>(null);

  const chiuse = busteChiuse;
  const ordinate = [...offerte].sort((a, b) => Number(a.importo) - Number(b.importo));
  const minima = ordinate[0]?.importo;

  const scegli = (o: Offerta) => {
    if (!window.confirm(`Aggiudicare a ${nomi[o.fornitore] ?? "questo fornitore"} per ${formatoEuro(o.importo)}? È definitivo.`)) return;
    setErrore(null);
    avvia(async () => {
      const r = await aggiudica(gara.id, o.id);
      if (!r.ok) setErrore(r.errore);
    });
  };

  return (
    <section className="rounded-2xl bg-white ring-1 ring-[#EFE3D8]" aria-labelledby="titolo-offerte">
      <header className="flex items-center justify-between gap-2 border-b border-[#EFE3D8] px-4 py-3">
        <h2 id="titolo-offerte" className="text-lg font-semibold text-[#1A2432]">
          Offerte <span className="font-normal text-[#8A97A8]">{quante}</span>
        </h2>
        {!chiuse && ordinate.length > 0 && gara.budget ? (
          <span className="text-sm text-[#2A3C54]">Budget {formatoEuro(gara.budget)}</span>
        ) : null}
      </header>
      {errore ? (
        <p role="alert" className="px-4 pt-3 text-sm text-[#9B2C1F]">
          {errore}
        </p>
      ) : null}

      {gara.stato === "bozza" ? (
        <p className="px-4 py-8 text-center text-base text-[#2A3C54]">Le offerte arrivano dopo la pubblicazione.</p>
      ) : chiuse ? (
        <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
          <LockKeyhole size={26} className="text-[#8A97A8]" aria-hidden="true" />
          <p className="text-lg font-semibold text-[#1A2432]">Buste chiuse fino al {formatoData(gara.scadenza)}</p>
          <p className="max-w-md text-base text-[#2A3C54]">
            Gli importi non si leggono, neanche dal database, fino alla scadenza o alla chiusura anticipata.
          </p>
        </div>
      ) : ordinate.length === 0 ? (
        <p className="px-4 py-8 text-center text-base text-[#2A3C54]">Nessuna offerta ricevuta.</p>
      ) : (
        <ul className="divide-y divide-[#EFE3D8]">
          {ordinate.map((o) => {
            const vince = gara.offerta_vincitrice === o.id;
            const scarto = gara.budget ? ((Number(o.importo) - Number(gara.budget)) / Number(gara.budget)) * 100 : null;
            return (
              <li key={o.id} className={`flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 ${vince ? "bg-emerald-50" : ""}`}>
                <div className="min-w-0 flex-1 basis-56">
                  <p className="flex flex-wrap items-center gap-2 font-semibold text-[#1A2432]">
                    {vince ? <Trophy size={16} className="text-emerald-700" aria-label="Aggiudicataria" /> : null}
                    {nomi[o.fornitore] ?? "Fornitore"}
                    {o.importo === minima && !vince ? (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">Più bassa</span>
                    ) : null}
                  </p>
                  {o.note ? <p className="mt-0.5 line-clamp-2 text-sm text-[#2A3C54]">{o.note}</p> : null}
                  <p className="text-xs text-[#8A97A8]">Inviata il {formatoData(o.inviata_il)}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold tabular-nums text-[#1A2432]">{formatoEuro(o.importo)}</p>
                  {scarto != null ? (
                    <p className={`text-sm tabular-nums ${scarto > 0 ? "text-[#9B2C1F]" : "text-emerald-800"}`}>
                      {scarto > 0 ? "+" : ""}
                      {scarto.toFixed(1)}% sul budget
                    </p>
                  ) : null}
                </div>
                {gara.stato === "chiusa" ? (
                  <button type="button" onClick={() => scegli(o)} disabled={attesa} className={stile.primario}>
                    <Award size={16} aria-hidden="true" /> Aggiudica
                  </button>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
