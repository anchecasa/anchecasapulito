import "server-only";
import { cache } from "react";
import { supabaseConfigurato } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export type ContestoFornitore = {
  configured: boolean;
  userId: string | null;
  fornitori: { id: string; nome: string; firma: boolean }[];
};

type Riga = { org: string; ruolo: string; app_org: { nome: string; tipo: string; stato: string } | null };

/** Fornitori attivi dell'Albo di cui l'utente fa parte. firma = titolare o responsabile. */
export const getContestoFornitore = cache(async (): Promise<ContestoFornitore> => {
  if (!supabaseConfigurato()) return { configured: false, userId: null, fornitori: [] };
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return { configured: true, userId: null, fornitori: [] };

  const { data: righe } = await supabase
    .from("app_org_membri")
    .select("org, ruolo, app_org(nome, tipo, stato)")
    .eq("utente", data.user.id)
    .returns<Riga[]>();

  const fornitori = (righe ?? [])
    .filter((r) => r.app_org?.tipo === "fornitore" && r.app_org.stato === "attiva")
    .map((r) => ({ id: r.org, nome: r.app_org!.nome, firma: r.ruolo === "titolare" || r.ruolo === "responsabile" }));

  return { configured: true, userId: data.user.id, fornitori };
});
