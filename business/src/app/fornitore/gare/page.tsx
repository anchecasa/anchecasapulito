import type { Metadata } from "next";
import { Globe2, Lock } from "lucide-react";
import Link from "next/link";
import { InvitoBadge, StatoGaraBadge } from "@/components/e-procurement/ui";
import { chiudiScadute } from "@/lib/e-procurement/dati";
import { adesso, formatoData, formatoEuro } from "@/lib/e-procurement/formato";
import type { GaraFornitore } from "@/lib/e-procurement/tipi";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Gare e richieste d'offerta · AncheCasa" };

export default async function GareFornitore() {
  await chiudiScadute();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("app_ep_mie_gare");
  const gare = ((data ?? []) as GaraFornitore[]).sort((a, b) => (a.scadenza ?? "").localeCompare(b.scadenza ?? ""));
  const ora = adesso();
  const inCorso = gare.filter((g) => g.stato === "pubblicata" && g.scadenza && new Date(g.scadenza).getTime() > ora);
  const concluse = gare.filter((g) => !inCorso.includes(g));

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-8 sm:px-6">
      <header>
        <h1 className="text-3xl font-semibold text-[#1A2432]">Gare e richieste d&apos;offerta</h1>
        <p className="mt-1 text-base text-[#2A3C54]">I bandi a cui sei invitato e quelli aperti a tutti i fornitori dell&apos;Albo.</p>
      </header>
      {error ? (
        <p role="alert" className="rounded-2xl bg-[#F8E6E1] px-4 py-3 text-base">
          Non riesco a leggere le gare.
        </p>
      ) : null}
      <Elenco titolo="In corso" righe={inCorso} vuoto="Nessuna gara aperta per te in questo momento." />
      {concluse.length > 0 ? <Elenco titolo="Concluse" righe={concluse} /> : null}
    </main>
  );
}

function Elenco({ titolo, righe, vuoto }: { titolo: string; righe: GaraFornitore[]; vuoto?: string }) {
  return (
    <section aria-label={titolo} className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-[#2A3C54]">{titolo}</h2>
      {righe.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-[#E7D3C3] px-4 py-8 text-center text-base text-[#2A3C54]">{vuoto}</p>
      ) : (
        <ul className="divide-y divide-[#EFE3D8] overflow-hidden rounded-2xl bg-white ring-1 ring-[#EFE3D8]">
          {righe.map((g) => (
            <li key={g.id}>
              <Link href={`/fornitore/gare/${g.id}`} className="flex flex-col gap-2 px-4 py-4 hover:bg-[#FBF8F3] sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2 text-sm text-[#2A3C54]">
                    <span className="font-mono">{g.codice}</span>
                    <span>{g.committente}</span>
                    {g.visibilita === "inviti" ? <Lock size={14} aria-label="Su invito" /> : <Globe2 size={14} aria-label="Aperta" />}
                  </p>
                  <p className="truncate text-lg font-semibold text-[#1A2432]">{g.titolo}</p>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-sm">
                  <span className="font-semibold tabular-nums text-[#1A2432]">{formatoEuro(g.budget)}</span>
                  <span className="text-[#2A3C54]">entro {formatoData(g.scadenza)}</span>
                  {g.stato === "pubblicata" ? (
                    <InvitoBadge stato={g.ho_offerto ? "offerta" : g.mio_stato} />
                  ) : g.vinta ? (
                    <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-900">Vinta</span>
                  ) : (
                    <StatoGaraBadge stato={g.stato} />
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
