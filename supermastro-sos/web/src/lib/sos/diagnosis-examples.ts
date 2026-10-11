import { createAdminClient } from "@/lib/supabase/admin";

type ExampleRow = {
  vote: string;
  correzione: string;
  diagnosis: {
    titolo?: string;
    esito?: string;
    payload?: { visto_sentito?: string };
  } | null;
};

function clip(value: string, max: number) {
  const text = value.replace(/\s+/g, " ").trim();
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trimEnd()}…`;
}

function line(row: ExampleRow) {
  const diagnosis = Array.isArray(row.diagnosis) ? row.diagnosis[0] : row.diagnosis;
  const visto = clip(diagnosis?.payload?.visto_sentito || diagnosis?.titolo || "guasto di casa", 120);
  const esito = diagnosis?.esito || "sconosciuto";
  const correzione = clip(row.correzione, 160);
  if (correzione) {
    return `Visto «${visto}». Esito dato: ${esito}. Era invece: ${correzione}`;
  }
  return `Visto «${visto}». Esito ${esito} era giusto.`;
}

/** Fino a 20 correzioni approvate. Se il database non risponde in 1,5 s, stringa vuota. */
export async function loadApprovedExamples(): Promise<string> {
  try {
    const admin = createAdminClient();
    const query = admin
      .from("sos_diagnosis_feedback")
      .select("vote, correzione, diagnosis:sos_video_diagnoses(titolo, esito, payload)")
      .eq("stato", "approvata")
      .order("created_at", { ascending: false })
      .limit(20);
    const result = await Promise.race([
      query,
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 1500)),
    ]);
    if (!result || result.error || !result.data?.length) return "";
    return (result.data as ExampleRow[])
      .map(line)
      .filter(Boolean)
      .join("\n")
      .slice(0, 2500);
  } catch {
    return "";
  }
}
