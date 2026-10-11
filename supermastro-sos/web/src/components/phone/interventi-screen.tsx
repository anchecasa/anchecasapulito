"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { euro, loadInterventi, type Intervento } from "@/lib/sos/intervento";

function statusLabel(item: Intervento): string {
  if (item.stars) return `Recensione ${item.stars} stelle`;
  if (item.balancePaidAt) return "Saldo pagato";
  if (item.depositPaidAt) return `Acconto pagato, arrivo alle ${item.arrivalTime}`;
  if (item.totalEuro > 0) return "Preventivo da firmare";
  return "In corso";
}

export function InterventiScreen() {
  const [items, setItems] = useState<Intervento[]>([]);

  useEffect(() => {
    const next = loadInterventi();
    queueMicrotask(() => setItems(next));
  }, []);

  return (
    <section className="min-h-full bg-[#FBF8F3] px-4 py-5 text-[#1A2432]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#E56B10]">Registro</p>
      <h1 className="mt-2 text-2xl font-semibold">Interventi</h1>
      <p className="mt-2 text-sm leading-relaxed text-[#2A3C54]">
        Qui restano preventivo, acconto, saldo e chi ha fatto il lavoro.
      </p>

      {items.length === 0 ? (
        <div className="mt-6 rounded-3xl bg-white px-4 py-8 text-center">
          <p className="font-semibold">Nessun intervento registrato</p>
          <p className="mt-2 text-sm text-[#2A3C54]">Parte dal video del guasto, oppure dall&apos;iscrizione del privato.</p>
          <Link href="/m/home" className="mt-4 inline-flex h-11 items-center rounded-full bg-[#E56B10] px-4 text-sm font-semibold text-white">
            Torna alla home
          </Link>
        </div>
      ) : (
        <div className="mt-5 space-y-3">
          {items.map((item) => (
            <Link
              key={item.id}
              href={`/m/preventivo?ruolo=cliente&nome=${encodeURIComponent(item.artisanName)}&mestiere=${encodeURIComponent(item.trade)}&guasto=${encodeURIComponent(item.fault)}`}
              className="block rounded-3xl bg-white px-4 py-4"
            >
              <p className="font-semibold">{item.fault}</p>
              <p className="mt-1 text-sm text-[#2A3C54]">
                {item.trade} · {item.artisanName}
              </p>
              <p className="mt-2 text-sm font-semibold">{euro(item.totalEuro)}</p>
              <p className="mt-1 text-xs text-[#2A3C54]">{statusLabel(item)}</p>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
