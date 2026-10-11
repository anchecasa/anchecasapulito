import { createAdminClient } from "@/lib/supabase/admin";
import { FoundArtisans, type FoundRow } from "@/components/admin/found-artisans";
import { requireAdminPage } from "@/lib/admin-guard";

export const metadata = { title: "Artigiani trovati — Admin" };

const STATO = new Set(["mai", "inviato", "aperto", "risposto", "iscritto"]);

type Lead = {
  id: string;
  nome: string;
  telefono: string | null;
  indirizzo: string;
  volte_trovato: number;
  stato: string;
  ultima_richiesta_id: string | null;
  opt_out: boolean | null;
};

type Share = {
  id: string;
  lead_id: string;
  zona: string;
  guasto: string;
  created_at: string;
  risposta: string | null;
};

type EventRow = { lead_id: string; tipo: string };

function one(value: string | string[] | undefined) {
  return (Array.isArray(value) ? value[0] : value)?.trim() ?? "";
}

export default async function ArtigianiTrovatiPage({
  searchParams,
}: {
  searchParams: Promise<{ stato?: string | string[] }>;
}) {
  await requireAdminPage();
  const stato = one((await searchParams).stato);
  const filter = STATO.has(stato) ? stato : "";
  let rows: FoundRow[] = [];
  let counts = { trovati: 0, video: 0, aperti: 0, iscritti: 0 };
  let problem = "";

  try {
    const admin = createAdminClient();
    const leadsQuery = admin
      .from("artisan_leads")
      .select("id, nome, telefono, indirizzo, volte_trovato, stato, ultima_richiesta_id, opt_out")
      .order("updated_at", { ascending: false })
      .limit(100);
    const [{ data: leads, error: leadError }, videoCount, openCount, iscrittiCount, trovatiCount] = await Promise.all([
      filter ? leadsQuery.eq("stato", filter) : leadsQuery,
      // Si contano le attività (non gli invii): una stessa attività conta una volta sola.
      admin.from("artisan_leads").select("id", { count: "exact", head: true }).in("stato", ["inviato", "aperto", "risposto", "iscritto"]),
      admin.from("artisan_leads").select("id", { count: "exact", head: true }).in("stato", ["aperto", "risposto", "iscritto"]),
      admin.from("artisan_leads").select("id", { count: "exact", head: true }).eq("stato", "iscritto"),
      admin.from("artisan_leads").select("id", { count: "exact", head: true }),
    ]);
    if (leadError || videoCount.error || openCount.error) {
      problem = leadError?.message || videoCount.error?.message || openCount.error?.message || "Elenco non letto.";
    } else {
      const list = (leads ?? []) as Lead[];
      const leadIds = list.map((lead) => lead.id);
      const eventsResult = leadIds.length
        ? await admin.from("lead_events").select("lead_id, tipo").in("lead_id", leadIds)
        : { data: [] as EventRow[] };
      const eventRows = (eventsResult.data ?? []) as EventRow[];
      const shareIds = list.map((lead) => lead.ultima_richiesta_id).filter((id): id is string => Boolean(id));
      const sharesResult = shareIds.length
        ? await admin.from("sos_shared_requests").select("id, lead_id, zona, guasto, created_at, risposta").in("id", shareIds)
        : { data: [] as Share[] };
      const shares = new Map(((sharesResult.data ?? []) as Share[]).map((share) => [share.id, share]));
      const byLead = new Map<string, string[]>();
      for (const event of eventRows) {
        const bucket = byLead.get(event.lead_id) ?? [];
        bucket.push(event.tipo);
        byLead.set(event.lead_id, bucket);
      }
      counts = {
        trovati: trovatiCount.count ?? list.length,
        video: videoCount.count ?? 0,
        aperti: openCount.count ?? 0,
        iscritti: iscrittiCount.count ?? 0,
      };
      rows = list.map((lead) => {
        const share = lead.ultima_richiesta_id ? shares.get(lead.ultima_richiesta_id) : undefined;
        const received = byLead.get(lead.id) ?? [];
        const parts = [
          received.includes("video_inviato") ? "Video" : "",
          received.includes("link_aperto") ? "Link aperto" : "",
          share?.risposta ? `Risposta: ${share.risposta}` : "",
        ].filter(Boolean);
        return {
          id: lead.id,
          nome: lead.nome,
          telefono: lead.telefono ?? "",
          zona: share?.zona || lead.indirizzo || "In zona",
          volte: lead.volte_trovato,
          guasto: share?.guasto || "Nessuna richiesta",
          data: share?.created_at ? new Date(share.created_at).toLocaleString("it-IT") : "",
          ricevuto: parts.join(" · ") || "Niente",
          stato: lead.stato,
          optOut: Boolean(lead.opt_out),
        };
      });
    }
  } catch (err) {
    problem = err instanceof Error ? err.message : "Elenco non letto.";
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Artigiani trovati</h1>
      <div className="grid gap-3 sm:grid-cols-4">
        {[
          ["Trovati", counts.trovati],
          ["Video ricevuto", counts.video],
          ["Link aperto", counts.aperti],
          ["Iscritti", counts.iscritti],
        ].map(([label, value]) => (
          <div key={String(label)} className="rounded-xl border border-slate-200 bg-white px-4 py-3">
            <p className="text-sm text-slate-500">{label}</p>
            <p className="text-2xl font-semibold">{value}</p>
          </div>
        ))}
      </div>
      {problem ? <p>Elenco non letto. Applica la migrazione del video condiviso. {problem}</p> : null}
      <FoundArtisans rows={rows} stato={filter} />
    </div>
  );
}
