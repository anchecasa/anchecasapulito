"use server";

import { revalidatePath } from "next/cache";
import { UUID } from "@/lib/e-procurement/formato";
import { getContestoFornitore } from "@/lib/e-procurement/fornitore";
import { erroriCampi, schemaOfferta, type InputOfferta } from "@/lib/e-procurement/schemi";
import type { Risultato } from "@/lib/e-procurement/tipi";
import { createClient } from "@/lib/supabase/server";

function errore(e: unknown): { ok: false; errore: string } {
  const pg = e as { code?: string; message?: string };
  if (pg?.message && /row-level|permission denied/i.test(pg.message)) {
    return { ok: false, errore: "Termine scaduto o gara non più disponibile." };
  }
  if (pg?.code === "22023" && pg.message) return { ok: false, errore: pg.message };
  console.error("[fornitore/gare]", e);
  return { ok: false, errore: "Qualcosa non ha funzionato. Riprova." };
}

async function puoFirmare(fornitore: string) {
  const ctx = await getContestoFornitore();
  return ctx.fornitori.some((f) => f.id === fornitore && f.firma);
}

/** Invia o aggiorna l'offerta. Una per fornitore, modificabile fino alla scadenza. */
export async function inviaOfferta(input: InputOfferta): Promise<Risultato> {
  const letto = schemaOfferta.safeParse(input);
  if (!letto.success) return { ok: false, errore: "Controlla l'importo.", campi: erroriCampi(letto.error.issues) };
  const v = letto.data;
  if (!(await puoFirmare(v.fornitore))) return { ok: false, errore: "Solo il titolare o un responsabile può firmare l'offerta." };

  try {
    const supabase = await createClient();
    const { data: esiste } = await supabase.from("app_ep_offerte").select("id").eq("gara", v.gara).eq("fornitore", v.fornitore).maybeSingle();
    if (esiste) {
      const { data, error } = await supabase
        .from("app_ep_offerte")
        .update({ importo: v.importo, note: v.note })
        .eq("id", esiste.id)
        .select("id");
      if (error) throw error;
      if (!data?.length) return { ok: false, errore: "Termine scaduto: l'offerta non si può più cambiare." };
    } else {
      const { error } = await supabase.from("app_ep_offerte").insert({ gara: v.gara, fornitore: v.fornitore, importo: v.importo, note: v.note });
      if (error) throw error;
    }
    revalidatePath("/fornitore/gare", "layout");
    return { ok: true };
  } catch (e) {
    return errore(e);
  }
}

export async function rinuncia(gara: string, fornitore: string): Promise<Risultato> {
  if (!UUID.test(gara) || !UUID.test(fornitore)) return { ok: false, errore: "Richiesta non valida." };
  if (!(await puoFirmare(fornitore))) return { ok: false, errore: "Solo il titolare o un responsabile può rinunciare." };
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("app_ep_inviti")
      .update({ stato: "rinuncia" })
      .eq("gara", gara)
      .eq("fornitore", fornitore)
      .select("gara");
    if (error) throw error;
    if (!data?.length) return { ok: false, errore: "Invito non trovato." };
    revalidatePath("/fornitore/gare", "layout");
    return { ok: true };
  } catch (e) {
    return errore(e);
  }
}
