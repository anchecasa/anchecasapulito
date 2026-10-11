import { createAdminClient } from "@/lib/supabase/admin";
import { reviewFeedback } from "@/app/admin/correzioni/actions";
import { requireAdminPage } from "@/lib/admin-guard";

export const metadata = { title: "Correzioni — Admin" };

const ESITO: Record<string, string> = {
  fai_da_te: "Fai da te",
  professionista: "Professionista",
  pericolo: "Pericolo",
  da_verificare: "Da verificare",
  fuori_tema: "Fuori tema",
};

const STATO: Record<string, string> = {
  in_attesa: "In attesa",
  approvata: "Approvata",
  scartata: "Scartata",
};

type Row = {
  id: string;
  vote: string;
  correzione: string;
  stato: string;
  created_at: string;
  diagnosis: {
    titolo?: string;
    esito?: string;
    payload?: { visto_sentito?: string; summary?: string };
  } | null;
};

function diagnosisOf(value: Row["diagnosis"] | Row["diagnosis"][]) {
  return Array.isArray(value) ? value[0] ?? null : value;
}

export default async function CorrezioniPage() {
  await requireAdminPage();
  let admin;
  try {
    admin = createAdminClient();
  } catch (err) {
    return <p>{err instanceof Error ? err.message : "Configura SUPABASE_SERVICE_ROLE_KEY"}</p>;
  }

  const { data, error } = await admin
    .from("sos_diagnosis_feedback")
    .select("id, vote, correzione, stato, created_at, diagnosis:sos_video_diagnoses(titolo, esito, payload)")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return <p>Elenco non letto. Applica la migrazione delle correzioni. {error.message}</p>;
  }

  const rows = ((data ?? []) as Row[]).slice().sort((a, b) => {
    if (a.stato === b.stato) return 0;
    if (a.stato === "in_attesa") return -1;
    if (b.stato === "in_attesa") return 1;
    return 0;
  });

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Correzioni ({rows.length})</h1>
      {rows.length === 0 ? (
        <p>Nessuna correzione.</p>
      ) : (
        <ul className="space-y-4">
          {rows.map((row) => {
            const diagnosis = diagnosisOf(row.diagnosis);
            const sintesi =
              diagnosis?.payload?.visto_sentito || diagnosis?.payload?.summary || diagnosis?.titolo || "Sintesi assente";
            return (
              <li key={row.id} className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
                <p className="text-sm text-slate-500">{STATO[row.stato] ?? row.stato}</p>
                <p className="font-semibold">{sintesi}</p>
                <p>Esito dato: {ESITO[diagnosis?.esito ?? ""] ?? diagnosis?.esito ?? "sconosciuto"}</p>
                <p>Correzione: {row.correzione.trim() || (row.vote === "up" ? "Pollice su, nessuna nota" : "Vuota")}</p>
                {row.stato === "in_attesa" && (
                  <div className="flex flex-wrap gap-3">
                    <form action={reviewFeedback.bind(null, row.id, "approvata")}>
                      <button
                        type="submit"
                        className="inline-flex min-h-11 items-center rounded-lg bg-slate-900 px-4 text-base font-semibold text-white"
                      >
                        Approva
                      </button>
                    </form>
                    <form action={reviewFeedback.bind(null, row.id, "scartata")}>
                      <button
                        type="submit"
                        className="inline-flex min-h-11 items-center rounded-lg border border-slate-300 bg-white px-4 text-base font-semibold"
                      >
                        Scarta
                      </button>
                    </form>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
