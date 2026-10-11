"use client";

import { FileCheck2, Globe2, Lock, Users } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { formatoData, formatoEuro } from "@/lib/e-procurement/formato";
import type { RigaRiepilogo, StatoGara } from "@/lib/e-procurement/tipi";
import { StatoGaraBadge } from "./ui";

type Filtro = "tutte" | "aperte" | "bozze" | "concluse";

const FILTRI: { id: Filtro; testo: string; vale: (s: StatoGara) => boolean }[] = [
  { id: "tutte", testo: "Tutte", vale: () => true },
  { id: "aperte", testo: "Aperte", vale: (s) => s === "pubblicata" },
  { id: "bozze", testo: "Bozze", vale: (s) => s === "bozza" },
  { id: "concluse", testo: "Concluse", vale: (s) => s === "chiusa" || s === "aggiudicata" || s === "annullata" },
];

function quandoScade(iso: string | null, stato: StatoGara) {
  if (stato !== "pubblicata" || !iso) return null;
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return { testo: "Scaduta", c: "text-[#9B2C1F]" };
  const giorni = Math.floor(ms / 86_400_000);
  if (giorni < 1) return { testo: `Scade tra ${Math.ceil(ms / 3_600_000)} ore`, c: "text-amber-800" };
  return { testo: `Scade tra ${giorni} giorni`, c: giorni <= 3 ? "text-amber-800" : "text-[#2A3C54]" };
}

export function TabellaGare({ gare, nomiOrg }: { gare: (RigaRiepilogo & { org: string })[]; nomiOrg: Record<string, string> }) {
  const [filtro, setFiltro] = useState<Filtro>("tutte");
  const [cerca, setCerca] = useState("");
  const piuAziende = Object.keys(nomiOrg).length > 1;

  const righe = useMemo(() => {
    const f = FILTRI.find((x) => x.id === filtro)!;
    const q = cerca.trim().toLowerCase();
    return gare.filter((g) => f.vale(g.stato) && (!q || g.titolo.toLowerCase().includes(q) || g.codice.toLowerCase().includes(q)));
  }, [gare, filtro, cerca]);

  return (
    <section className="overflow-hidden rounded-2xl bg-white ring-1 ring-[#EFE3D8]" aria-label="Gare pubblicate dal committente">
      <div className="flex flex-col gap-3 border-b border-[#EFE3D8] p-3 sm:flex-row sm:items-center sm:justify-between">
        <div role="tablist" aria-label="Filtra per stato" className="flex gap-1 overflow-x-auto">
          {FILTRI.map((f) => {
            const attivo = filtro === f.id;
            return (
              <button
                key={f.id}
                type="button"
                role="tab"
                aria-selected={attivo}
                onClick={() => setFiltro(f.id)}
                className={`min-h-11 whitespace-nowrap rounded-full px-4 text-sm font-semibold ${
                  attivo ? "bg-[#2A3C54] text-white" : "text-[#2A3C54] hover:bg-[#FBF8F3]"
                }`}
              >
                {f.testo} <span className={attivo ? "text-white/70" : "text-[#8A97A8]"}>{gare.filter((g) => f.vale(g.stato)).length}</span>
              </button>
            );
          })}
        </div>
        <input
          type="search"
          value={cerca}
          onChange={(e) => setCerca(e.target.value)}
          placeholder="Cerca titolo o codice"
          aria-label="Cerca gara"
          className="min-h-11 w-full rounded-xl border border-[#E7D3C3] px-3 text-base sm:w-64"
        />
      </div>

      {righe.length === 0 ? (
        <div className="px-6 py-14 text-center">
          <p className="text-lg font-semibold text-[#1A2432]">
            {filtro === "tutte" ? "Nessun pacchetto messo a gara" : "Nessuna gara in questa vista"}
          </p>
          <p className="mt-1 text-base text-[#2A3C54]">Con «Nuovo pacchetto» metti a gara il primo lavoro.</p>
        </div>
      ) : (
        <ul className="divide-y divide-[#EFE3D8]">
          {righe.map((g) => {
            const scade = quandoScade(g.scadenza, g.stato);
            return (
              <li key={g.id}>
                <Link
                  href={`/admin/e-procurement/${g.id}`}
                  className="grid gap-3 px-4 py-4 hover:bg-[#FBF8F3] md:grid-cols-[minmax(0,1fr)_auto] md:items-center"
                >
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-2 text-sm text-[#2A3C54]">
                      <span className="font-mono">{g.codice}</span>
                      <StatoGaraBadge stato={g.stato} />
                      <span className="inline-flex items-center gap-1">
                        {g.visibilita === "inviti" ? <Lock size={14} aria-hidden="true" /> : <Globe2 size={14} aria-hidden="true" />}
                        {g.visibilita === "inviti" ? "Su invito" : "Aperta"}
                      </span>
                      {piuAziende ? <span>· {nomiOrg[g.org]}</span> : null}
                    </p>
                    <p className="mt-1 truncate text-lg font-semibold text-[#1A2432]">{g.titolo}</p>
                  </div>
                  <dl className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm sm:grid-cols-5 md:text-right">
                    <div>
                      <dt className="text-[#8A97A8]">Budget</dt>
                      <dd className="font-semibold tabular-nums text-[#1A2432]">{formatoEuro(g.budget)}</dd>
                    </div>
                    <div className="sm:col-span-2">
                      <dt className="text-[#8A97A8]">Scadenza</dt>
                      <dd className="text-[#1A2432]">{formatoData(g.scadenza)}</dd>
                      {scade ? <dd className={`text-xs font-semibold ${scade.c}`}>{scade.testo}</dd> : null}
                    </div>
                    <div>
                      <dt className="text-[#8A97A8]">Invitati / offerte</dt>
                      <dd className="inline-flex items-center gap-1 font-semibold tabular-nums text-[#1A2432]">
                        <Users size={14} className="text-[#8A97A8]" aria-hidden="true" />
                        {g.invitati} / {g.offerte}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[#8A97A8]">Documenti</dt>
                      <dd className="inline-flex items-center gap-1 font-semibold tabular-nums text-[#1A2432]" title="Verificati AncheBIM / totale">
                        <FileCheck2 size={14} className="text-emerald-700" aria-hidden="true" />
                        {g.verificati}/{g.documenti}
                      </dd>
                    </div>
                  </dl>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
