import "server-only";
import type { DocumentoGara, GaraPrivata } from "@/lib/e-procurement/tipi";
import { createClient } from "@/lib/supabase/server";

export type { DocumentoGara, GaraPrivata };

export async function caricaGare(orgIds: string[]): Promise<{ gare: GaraPrivata[]; errore: string | null }> {
  if (orgIds.length === 0) return { gare: [], errore: null };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("app_ep_gare")
    .select("id, org, titolo, descrizione, stato, scadenza, creato")
    .in("org", orgIds)
    .order("creato", { ascending: false })
    .limit(100);
  if (error) {
    if (/does not exist|schema cache|PGRST20[0-9]/i.test(error.message)) {
      return { gare: [], errore: "Manca la migrazione e-procurement su Supabase." };
    }
    return { gare: [], errore: "Non riesco a leggere le gare." };
  }
  const gare = (data ?? []) as Omit<GaraPrivata, "documenti">[];
  const ids = gare.map((gara) => gara.id);
  const documenti: DocumentoGara[] = [];
  if (ids.length > 0) {
    const letti = await supabase
      .from("app_ep_documenti")
      .select("id, gara, nome, sha256, byte")
      .in("gara", ids)
      .order("creato", { ascending: true });
    if (!letti.error && letti.data) {
      documenti.push(...(letti.data as DocumentoGara[]));
    }
  }
  return {
    gare: gare.map((gara) => ({
      ...gara,
      documenti: documenti.filter((documento) => documento.gara === gara.id),
    })),
    errore: null,
  };
}
