import "server-only";
import type { OrgGestita, ProcurementContext } from "@/lib/e-procurement/tipi";
import { RUOLO_ACQUIRENTE, ruoloAbilitato } from "@/lib/eprocurement/ruoli";
import { supabaseConfigurato } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export type { OrgGestita, ProcurementContext };

type Membro = { org: string; ruolo: string };

export async function getProcurementContext(): Promise<ProcurementContext> {
  if (!supabaseConfigurato()) {
    return { configured: false, userId: null, canManageProcurement: false, orgs: [] };
  }
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const utente = data.user;
  if (!utente) {
    return { configured: true, userId: null, canManageProcurement: false, orgs: [] };
  }

  const { data: adminRiga } = await supabase.from("admins").select("id").eq("id", utente.id).maybeSingle();
  const sonoAdmin = Boolean(adminRiga?.id);
  const { data: membri } = await supabase.from("app_org_membri").select("org, ruolo").eq("utente", utente.id);
  const righe = (membri ?? []) as Membro[];
  const orgAcquirente = righe.filter((riga) => riga.ruolo === RUOLO_ACQUIRENTE).map((riga) => riga.org);
  const puo = ruoloAbilitato(sonoAdmin, righe.map((riga) => riga.ruolo));

  let orgs: OrgGestita[] = [];
  if (sonoAdmin) {
    const { data: tutte } = await supabase
      .from("app_org")
      .select("id, nome")
      .eq("stato", "attiva")
      .order("nome")
      .limit(200);
    orgs = (tutte ?? []) as OrgGestita[];
  } else if (orgAcquirente.length > 0) {
    const { data: scelte } = await supabase.from("app_org").select("id, nome").in("id", orgAcquirente).eq("stato", "attiva");
    orgs = (scelte ?? []) as OrgGestita[];
  }

  return {
    configured: true,
    userId: utente.id,
    canManageProcurement: puo,
    orgs,
  };
}
