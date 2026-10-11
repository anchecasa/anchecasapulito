"use server";

import { createClient } from "@/lib/supabase/server";
import type { Risultato } from "./tipi";

/**
 * Link di download valido 2 minuti. Serve sia al committente sia ai fornitori:
 * decide la RLS di Supabase chi può ottenerlo.
 */
export async function linkDocumento(id: string): Promise<Risultato<{ url: string }>> {
  const supabase = await createClient();
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return { ok: false, errore: "Sessione scaduta: entra di nuovo." };

  const { data: doc } = await supabase.from("app_ep_documenti").select("percorso, nome").eq("id", id).maybeSingle();
  if (!doc) return { ok: false, errore: "Documento non disponibile." };

  const { data, error } = await supabase.storage
    .from("e-procurement")
    .createSignedUrl(doc.percorso as string, 120, { download: doc.nome as string });
  if (error || !data) return { ok: false, errore: "Non riesco a preparare il download." };
  return { ok: true, dati: { url: data.signedUrl } };
}
