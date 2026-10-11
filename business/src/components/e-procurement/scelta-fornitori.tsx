"use client";

import { Check, Search } from "lucide-react";
import { useMemo, useState } from "react";
import type { FornitoreAlbo } from "@/lib/e-procurement/tipi";

export function SceltaFornitori({
  albo,
  scelti,
  cambia,
  errore,
}: {
  albo: FornitoreAlbo[];
  scelti: string[];
  cambia: (ids: string[]) => void;
  errore?: boolean;
}) {
  const [cerca, setCerca] = useState("");
  const [regione, setRegione] = useState("");

  const regioni = useMemo(
    () => [...new Set(albo.map((f) => f.regione).filter(Boolean))].sort((a, b) => a.localeCompare(b, "it")),
    [albo],
  );
  const visibili = useMemo(() => {
    const q = cerca.trim().toLowerCase();
    return albo.filter(
      (f) =>
        (!regione || f.regione === regione) &&
        (!q || f.nome.toLowerCase().includes(q) || f.piva.includes(q) || f.citta.toLowerCase().includes(q)),
    );
  }, [albo, cerca, regione]);

  const set = new Set(scelti);
  const tuttiVisibili = visibili.length > 0 && visibili.every((f) => set.has(f.id));
  const alterna = (id: string) => cambia(set.has(id) ? scelti.filter((x) => x !== id) : [...scelti, id]);
  const alternaVisibili = () =>
    cambia(
      tuttiVisibili
        ? scelti.filter((id) => !visibili.some((f) => f.id === id))
        : [...new Set([...scelti, ...visibili.map((f) => f.id)])],
    );

  if (albo.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-[#E7D3C3] px-4 py-4 text-base text-[#2A3C54]">
        Nell&apos;Albo non ci sono fornitori attivi. Puoi pubblicare la gara come invito aperto.
      </p>
    );
  }

  return (
    <div className={`overflow-hidden rounded-2xl bg-white ring-1 ${errore ? "ring-[#C2412D]" : "ring-[#E7D3C3]"}`}>
      <div className="flex flex-col gap-2 border-b border-[#EFE3D8] p-2 sm:flex-row">
        <label className="relative flex-1">
          <span className="sr-only">Cerca fornitore</span>
          <Search className="pointer-events-none absolute left-3 top-3 text-[#8A97A8]" size={18} aria-hidden="true" />
          <input
            type="search"
            value={cerca}
            onChange={(e) => setCerca(e.target.value)}
            placeholder="Nome, P.IVA o città"
            className="min-h-11 w-full rounded-xl border border-[#EFE3D8] pl-10 pr-3 text-base focus:border-blue-700 focus:outline-none"
          />
        </label>
        <select
          value={regione}
          onChange={(e) => setRegione(e.target.value)}
          aria-label="Filtra per regione"
          className="min-h-11 rounded-xl border border-[#EFE3D8] px-3 text-base"
        >
          <option value="">Tutte le regioni</option>
          {regioni.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>
      <div className="flex items-center justify-between px-3 py-2 text-sm text-[#2A3C54]">
        <span>
          <strong className="text-[#1A2432]">{scelti.length}</strong> scelti · {visibili.length} in elenco
        </span>
        <button type="button" onClick={alternaVisibili} className="min-h-9 px-2 font-semibold text-blue-800 hover:underline">
          {tuttiVisibili ? "Togli quelli in elenco" : "Scegli quelli in elenco"}
        </button>
      </div>
      <ul className="max-h-64 overflow-y-auto border-t border-[#EFE3D8]" aria-label="Fornitori dell'Albo">
        {visibili.map((f) => {
          const on = set.has(f.id);
          return (
            <li key={f.id}>
              <button
                type="button"
                role="checkbox"
                aria-checked={on}
                onClick={() => alterna(f.id)}
                className={`flex min-h-11 w-full items-center gap-3 px-3 py-2 text-left ${on ? "bg-blue-50" : "hover:bg-[#FBF8F3]"}`}
              >
                <span
                  aria-hidden="true"
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                    on ? "border-blue-800 bg-blue-800 text-white" : "border-[#C9B8A8] bg-white"
                  }`}
                >
                  {on ? <Check size={14} /> : null}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold text-[#1A2432]">{f.nome}</span>
                  <span className="block truncate text-sm text-[#2A3C54]">
                    {[f.piva && `P.IVA ${f.piva}`, f.citta, f.regione].filter(Boolean).join(" · ") || "—"}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
