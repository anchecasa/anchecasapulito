import type { Metadata } from "next";
import { ArrowLeft, Globe2, Lock } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AzioniGara } from "@/components/e-procurement/dettaglio/azioni-gara";
import { Documenti } from "@/components/e-procurement/dettaglio/documenti";
import { Inviti } from "@/components/e-procurement/dettaglio/inviti";
import { Offerte } from "@/components/e-procurement/dettaglio/offerte";
import { Avviso, StatoGaraBadge } from "@/components/e-procurement/ui";
import { getProcurementContext } from "@/lib/e-procurement/context";
import { caricaAlbo, chiudiScadute } from "@/lib/e-procurement/dati";
import { UUID, adesso, formatoData, formatoEuro, nomeEvento } from "@/lib/e-procurement/formato";
import {
  COLONNE_DOCUMENTO,
  COLONNE_GARA,
  type Documento,
  type Evento,
  type FornitoreAlbo,
  type Gara,
  type Invito,
  type Offerta,
} from "@/lib/e-procurement/tipi";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Dettaglio gara · Cruscotto admin" };

export default async function DettaglioGara({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ nota?: string }>;
}) {
  const { id } = await params;
  const { nota } = await searchParams;
  if (!UUID.test(id)) notFound();

  const ctx = await getProcurementContext();
  if (!ctx.configured) notFound();
  await chiudiScadute();
  const supabase = await createClient();

  const { data } = await supabase.from("app_ep_gare").select(COLONNE_GARA).eq("id", id).maybeSingle();
  const gara = data as Gara | null;
  if (!gara || !ctx.orgs.some((o) => o.id === gara.org)) notFound();

  const aperta = gara.stato === "bozza" || gara.stato === "pubblicata";
  const [inviti, documenti, offerte, eventi, albo] = await Promise.all([
    supabase.from("app_ep_inviti").select("fornitore, stato, creato, risposto_il").eq("gara", id).order("creato"),
    supabase.from("app_ep_documenti").select(COLONNE_DOCUMENTO).eq("gara", id).order("creato"),
    // La RLS restituisce le offerte solo a buste aperte
    supabase.from("app_ep_offerte").select("id, fornitore, importo, note, inviata_il").eq("gara", id),
    supabase.from("app_ep_eventi").select("id, evento, dati, creato").eq("gara", id).order("creato", { ascending: false }).limit(100),
    aperta ? caricaAlbo() : Promise.resolve([] as FornitoreAlbo[]),
  ]);

  const listaInviti = (inviti.data ?? []) as Invito[];
  const listaOfferte = (offerte.data ?? []) as Offerta[];
  const idFornitori = [...new Set([...listaInviti.map((i) => i.fornitore), ...listaOfferte.map((o) => o.fornitore)])];
  const { data: org } = idFornitori.length
    ? await supabase.from("app_org").select("id, nome").in("id", idFornitori)
    : { data: [] as { id: string; nome: string }[] };
  const nomi: Record<string, string> = Object.fromEntries((org ?? []).map((o) => [o.id as string, o.nome as string]));
  const quante = listaInviti.filter((i) => i.stato === "offerta").length;
  const vincitrice = listaOfferte.find((o) => o.id === gara.offerta_vincitrice);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 sm:py-10">
      <Link href="/admin/e-procurement" className="inline-flex min-h-11 w-fit items-center gap-1 text-base font-semibold text-blue-900">
        <ArrowLeft size={18} aria-hidden="true" /> Tutte le gare
      </Link>

      {nota ? <Avviso tono="info">{nota}</Avviso> : null}

      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-2 text-sm text-[#2A3C54]">
            <span className="font-mono">{gara.codice}</span>
            <StatoGaraBadge stato={gara.stato} />
            <span className="inline-flex items-center gap-1">
              {gara.visibilita === "inviti" ? <Lock size={14} aria-hidden="true" /> : <Globe2 size={14} aria-hidden="true" />}
              {gara.visibilita === "inviti" ? "Su invito" : "Invito aperto"}
            </span>
          </p>
          <h1 className="mt-1 text-3xl font-semibold text-[#1A2432]">{gara.titolo}</h1>
        </div>
        <AzioniGara gara={gara} />
      </header>

      {vincitrice ? (
        <Avviso tono="ok">
          Aggiudicata a <strong>{nomi[vincitrice.fornitore] ?? "fornitore"}</strong> per <strong>{formatoEuro(vincitrice.importo)}</strong>
          {gara.aggiudicata_il ? ` il ${formatoData(gara.aggiudicata_il)}` : ""}.
        </Avviso>
      ) : null}

      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          ["Budget stimato", formatoEuro(gara.budget)],
          ["Scadenza offerte", formatoData(gara.scadenza)],
          ["Pubblicata", formatoData(gara.pubblicato_il)],
          ["Offerte ricevute", String(quante)],
        ].map(([t, v]) => (
          <div key={t} className="rounded-2xl bg-white px-4 py-4 ring-1 ring-[#EFE3D8]">
            <dt className="text-sm text-[#2A3C54]">{t}</dt>
            <dd className="mt-1 text-lg font-semibold tabular-nums text-[#1A2432]">{v}</dd>
          </div>
        ))}
      </dl>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Offerte
            gara={gara}
            offerte={listaOfferte}
            quante={quante}
            nomi={nomi}
            busteChiuse={gara.stato === "pubblicata" && (!gara.scadenza || new Date(gara.scadenza).getTime() > adesso())}
          />

          <section className="rounded-2xl bg-white px-4 py-4 ring-1 ring-[#EFE3D8]">
            <h2 className="text-lg font-semibold text-[#1A2432]">Descrizione</h2>
            <p className="mt-2 whitespace-pre-line text-base text-[#1A2432]">{gara.descrizione || "—"}</p>
            {gara.capitolato ? (
              <>
                <h3 className="mt-5 font-semibold text-[#1A2432]">Capitolato</h3>
                <pre className="mt-2 max-h-96 overflow-auto whitespace-pre-wrap rounded-xl bg-[#FBF8F3] p-3 font-mono text-sm text-[#1A2432]">
                  {gara.capitolato}
                </pre>
              </>
            ) : null}
          </section>

          <Documenti gara={gara.id} stato={gara.stato} documenti={(documenti.data ?? []) as Documento[]} gestisci />
        </div>

        <div className="flex flex-col gap-6">
          <Inviti gara={gara} inviti={listaInviti} albo={albo} nomi={nomi} />

          <section className="rounded-2xl bg-white ring-1 ring-[#EFE3D8]" aria-labelledby="titolo-registro">
            <h2 id="titolo-registro" className="border-b border-[#EFE3D8] px-4 py-3 text-lg font-semibold text-[#1A2432]">
              Registro attività
            </h2>
            {(eventi.data ?? []).length === 0 ? (
              <p className="px-4 py-6 text-base text-[#2A3C54]">Nessuna attività.</p>
            ) : (
              <ol className="flex max-h-[28rem] flex-col gap-3 overflow-y-auto px-4 py-3">
                {((eventi.data ?? []) as Evento[]).map((e) => {
                  const f = typeof e.dati.fornitore === "string" ? nomi[e.dati.fornitore] ?? "Fornitore" : null;
                  const n = typeof e.dati.nome === "string" ? e.dati.nome : null;
                  return (
                    <li key={e.id} className="border-l-2 border-[#E7D3C3] pl-3">
                      <p className="text-sm font-semibold text-[#1A2432]">{nomeEvento(e.evento)}</p>
                      {f || n ? <p className="truncate text-sm text-[#2A3C54]">{f ?? n}</p> : null}
                      <p className="text-xs text-[#8A97A8]">{formatoData(e.creato)}</p>
                    </li>
                  );
                })}
              </ol>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
