import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Documenti } from "@/components/e-procurement/dettaglio/documenti";
import { ModuloOfferta } from "@/components/e-procurement/fornitore/modulo-offerta";
import { Avviso, StatoGaraBadge } from "@/components/e-procurement/ui";
import { chiudiScadute } from "@/lib/e-procurement/dati";
import { UUID, adesso, formatoData, formatoEuro } from "@/lib/e-procurement/formato";
import { getContestoFornitore } from "@/lib/e-procurement/fornitore";
import { COLONNE_DOCUMENTO, COLONNE_GARA, type Documento, type Gara, type GaraFornitore } from "@/lib/e-procurement/tipi";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Gara · AncheCasa" };

export default async function GaraPerFornitore({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  await chiudiScadute();

  const ctx = await getContestoFornitore();
  const supabase = await createClient();
  const { data: mie } = await supabase.rpc("app_ep_mie_gare");
  const riga = ((mie ?? []) as GaraFornitore[]).find((g) => g.id === id);
  if (!riga) notFound();

  const [{ data }, documenti, offerta] = await Promise.all([
    supabase.from("app_ep_gare").select(COLONNE_GARA).eq("id", id).maybeSingle(),
    supabase.from("app_ep_documenti").select(COLONNE_DOCUMENTO).eq("gara", id).order("creato"),
    supabase.from("app_ep_offerte").select("id, importo, note, inviata_il").eq("gara", id).eq("fornitore", riga.fornitore).maybeSingle(),
  ]);
  const gara = data as Gara | null;
  if (!gara) notFound();

  // Prima apertura dell'invito → "visto" (il registro lo annota per il committente)
  const firma = ctx.fornitori.some((f) => f.id === riga.fornitore && f.firma);
  if (riga.mio_stato === "invitato" && firma) {
    await supabase.from("app_ep_inviti").update({ stato: "visto" }).eq("gara", id).eq("fornitore", riga.fornitore);
  }

  const aperta = gara.stato === "pubblicata" && Boolean(gara.scadenza) && new Date(gara.scadenza!).getTime() > adesso();

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8 sm:px-6">
      <Link href="/fornitore/gare" className="inline-flex min-h-11 w-fit items-center gap-1 text-base font-semibold text-blue-900">
        <ArrowLeft size={18} aria-hidden="true" /> Tutte le gare
      </Link>

      <header>
        <p className="flex flex-wrap items-center gap-2 text-sm text-[#2A3C54]">
          <span className="font-mono">{gara.codice}</span>
          <span>{riga.committente}</span>
          <StatoGaraBadge stato={gara.stato} />
        </p>
        <h1 className="mt-1 text-3xl font-semibold text-[#1A2432]">{gara.titolo}</h1>
        {ctx.fornitori.length > 1 ? <p className="mt-1 text-sm text-[#2A3C54]">Partecipi come {riga.fornitore_nome}</p> : null}
      </header>

      {gara.stato === "aggiudicata" && offerta.data ? (
        <Avviso tono={riga.vinta ? "ok" : "info"}>
          {riga.vinta
            ? "La tua offerta è stata aggiudicata. Il committente ti contatterà per i passi successivi."
            : "La gara è stata aggiudicata a un altro fornitore. Grazie per aver partecipato."}
        </Avviso>
      ) : null}
      {gara.stato === "annullata" ? <Avviso tono="info">Il committente ha annullato questa gara.</Avviso> : null}

      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        {[
          ["Budget stimato", formatoEuro(gara.budget)],
          ["Scadenza offerte", formatoData(gara.scadenza)],
          ["Pubblicata", formatoData(gara.pubblicato_il)],
        ].map(([t, v]) => (
          <div key={t} className="rounded-2xl bg-white px-4 py-4 ring-1 ring-[#EFE3D8]">
            <dt className="text-sm text-[#2A3C54]">{t}</dt>
            <dd className="mt-1 text-lg font-semibold tabular-nums text-[#1A2432]">{v}</dd>
          </div>
        ))}
      </dl>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
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
          <Documenti gara={gara.id} stato={gara.stato} documenti={(documenti.data ?? []) as Documento[]} gestisci={false} />
        </div>
        <aside>
          <ModuloOfferta
            gara={gara.id}
            fornitore={riga.fornitore}
            aperta={aperta}
            firma={firma}
            rinunciato={riga.mio_stato === "rinuncia"}
            invitato={riga.mio_stato !== "aperta"}
            scadenza={gara.scadenza}
            esistente={(offerta.data as { importo: number; note: string; inviata_il: string } | null) ?? null}
          />
        </aside>
      </div>
    </main>
  );
}
