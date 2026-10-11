"use client";

import { useMemo, useState } from "react";

export type FoundRow = {
  id: string;
  nome: string;
  telefono: string;
  zona: string;
  volte: number;
  guasto: string;
  data: string;
  ricevuto: string;
  stato: string;
  /** Ha chiesto di non ricevere più richieste: non va contattato. */
  optOut: boolean;
};

const STATI = ["", "mai", "inviato", "aperto", "risposto", "iscritto"] as const;

/** Cella CSV sicura: niente formule eseguite da Excel (= + - @ all'inizio). */
function cell(value: string) {
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return `"${safe.replaceAll('"', '""')}"`;
}

export function FoundArtisans({ rows, stato }: { rows: FoundRow[]; stato: string }) {
  const [picked, setPicked] = useState<string[]>([]);
  const selected = useMemo(() => rows.filter((row) => picked.includes(row.id)), [picked, rows]);

  function toggle(id: string) {
    setPicked((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  function exportCsv() {
    const lines = [
      ["Attività", "Telefono", "Zona", "Volte cercato", "Guasto", "Data", "Cosa ha ricevuto", "Stato", "Non vuole richieste"].map(cell).join(","),
      ...selected.map((row) =>
        [row.nome, row.telefono, row.zona, String(row.volte), row.guasto, row.data, row.ricevuto, row.stato, row.optOut ? "Sì" : "No"]
          .map(cell)
          .join(","),
      ),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const href = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = href;
    link.download = "artigiani-trovati.csv";
    link.click();
    URL.revokeObjectURL(href);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {STATI.map((value) => (
          <a
            key={value || "tutti"}
            href={value ? `/admin/artigiani-trovati?stato=${value}` : "/admin/artigiani-trovati"}
            className={`inline-flex min-h-11 items-center rounded-lg border px-3 text-sm font-medium ${
              stato === value ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-700"
            }`}
          >
            {value || "Tutti"}
          </a>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          className="inline-flex min-h-11 items-center rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white disabled:opacity-40"
          disabled={selected.length === 0}
          onClick={exportCsv}
        >
          Esporta CSV
        </button>
        <button
          type="button"
          disabled
          className="inline-flex min-h-11 items-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-400"
        >
          Avvisa i selezionati
        </button>
        <p className="text-sm text-slate-600">In attesa del via libera privacy</p>
      </div>
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-slate-200 text-slate-500">
            <tr>
              <th className="px-3 py-3">
                <span className="sr-only">Seleziona</span>
              </th>
              <th className="px-3 py-3 font-medium">Attività</th>
              <th className="px-3 py-3 font-medium">Telefono</th>
              <th className="px-3 py-3 font-medium">Zona</th>
              <th className="px-3 py-3 font-medium">Volte</th>
              <th className="px-3 py-3 font-medium">Ultima richiesta</th>
              <th className="px-3 py-3 font-medium">Cosa ha ricevuto</th>
              <th className="px-3 py-3 font-medium">Stato</th>
              <th className="px-3 py-3 font-medium">Contatto</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td className="px-3 py-4 text-slate-600" colSpan={9}>
                  Nessuna attività.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="border-b border-slate-100">
                  <td className="px-3 py-2">
                    <label className="inline-flex min-h-11 min-w-11 items-center justify-center">
                      <input
                        type="checkbox"
                        className="size-5"
                        checked={picked.includes(row.id)}
                        aria-label={`Seleziona ${row.nome}`}
                        onChange={() => toggle(row.id)}
                      />
                    </label>
                  </td>
                  <td className="px-3 py-3 font-medium">{row.nome}</td>
                  <td className="px-3 py-3">{row.telefono || "Numero non pubblicato"}</td>
                  <td className="px-3 py-3">{row.zona}</td>
                  <td className="px-3 py-3">{row.volte}</td>
                  <td className="px-3 py-3">
                    {row.guasto}
                    <span className="block text-slate-500">{row.data}</span>
                  </td>
                  <td className="px-3 py-3">{row.ricevuto}</td>
                  <td className="px-3 py-3">{row.stato}</td>
                  <td className="px-3 py-3">
                    {row.optOut ? (
                      <span className="font-semibold text-red-700">Non vuole richieste</span>
                    ) : (
                      "Contattabile"
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
