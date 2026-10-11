"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { loadCliente } from "@/lib/sos/cliente";
import { euro, INTERVENTO_EVENT, loadInterventi, type Intervento } from "@/lib/sos/intervento";

function statusLabel(item: Intervento): string {
  if (item.stars) return `Recensione ${item.stars} stelle`;
  if (item.balancePaidAt) return "Saldo pagato, in attesa di recensione";
  if (item.depositPaidAt) return `Acconto pagato, arrivo alle ${item.arrivalTime}`;
  if (item.totalEuro > 0) return "Preventivo da firmare";
  return "In corso";
}

export function StoricoInterventi() {
  const [items, setItems] = useState<Intervento[]>([]);
  const [card, setCard] = useState<string | null>(null);

  useEffect(() => {
    function refresh() {
      setItems(loadInterventi());
      setCard(loadCliente()?.cardLast4 ?? null);
    }
    refresh();
    window.addEventListener(INTERVENTO_EVENT, refresh);
    return () => window.removeEventListener(INTERVENTO_EVENT, refresh);
  }, []);

  return (
    <section className="mx-auto w-full max-w-5xl text-[#1A2432]">
      <header className="flex flex-col gap-4 border-b border-[#2A3C54]/10 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#E56B10]">SuperMastro</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">Storico interventi</h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-[#2A3C54]">
            {card
              ? `Pagamento tutelato sulla carta ${card}. Ogni intervento resta con il mastro e la recensione.`
              : "L'iscrizione tutela acconto e saldo. Lo storico registra chi ha fatto il lavoro."}
          </p>
        </div>
        <Link
          href="/supermastro/preventivo"
          className="inline-flex h-11 items-center justify-center rounded-xl bg-[#E56B10] px-4 text-sm font-semibold text-white"
        >
          Apri il preventivo
        </Link>
      </header>

      {items.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-[#2A3C54]/20 bg-white px-6 py-12 text-center">
          <p className="font-semibold">Nessun intervento registrato</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-[#2A3C54]">
            Quando il mastro invia il preventivo e il cliente firma, il lavoro compare in questo registro.
          </p>
          <Link href="/supermastro/privato" className="mt-5 inline-flex text-sm font-semibold text-[#E56B10]">
            Iscrivi il privato
          </Link>
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-2xl border border-[#2A3C54]/10 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#FBF8F3] text-[11px] font-semibold uppercase tracking-[0.14em] text-[#2A3C54]">
              <tr>
                <th className="px-4 py-3 font-semibold">Intervento</th>
                <th className="hidden px-4 py-3 font-semibold sm:table-cell">Mastro</th>
                <th className="px-4 py-3 font-semibold">Importo</th>
                <th className="hidden px-4 py-3 font-semibold md:table-cell">Stato</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-t border-[#2A3C54]/10">
                  <td className="px-4 py-4">
                    <Link
                      href={`/supermastro/preventivo?ruolo=cliente&nome=${encodeURIComponent(item.artisanName)}&mestiere=${encodeURIComponent(item.trade)}&guasto=${encodeURIComponent(item.fault)}`}
                      className="font-semibold hover:text-[#E56B10]"
                    >
                      {item.fault}
                    </Link>
                    <p className="mt-1 text-xs text-[#2A3C54] sm:hidden">
                      {item.trade} · {item.artisanName}
                    </p>
                  </td>
                  <td className="hidden px-4 py-4 text-[#2A3C54] sm:table-cell">
                    {item.artisanName}
                    <span className="mt-1 block text-xs">{item.trade}</span>
                  </td>
                  <td className="px-4 py-4 font-medium">{euro(item.totalEuro)}</td>
                  <td className="hidden px-4 py-4 md:table-cell">
                    <span className="inline-flex rounded-full bg-[#FBF8F3] px-2.5 py-1 text-xs font-semibold text-[#2A3C54]">
                      {statusLabel(item)}
                      {item.photos.length > 0 ? ` · ${item.photos.length}/5 foto` : ""}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
