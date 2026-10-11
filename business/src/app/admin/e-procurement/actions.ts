"use server";

import { createHash, randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { analizzaDocumentoGara } from "@/lib/e-procurement/anchebim";
import { getProcurementContext } from "@/lib/e-procurement/context";
import { schemaBozza, schemaGara } from "@/lib/e-procurement/schemi";
import type { EsitoAzione } from "@/lib/e-procurement/tipi";
import { createClient } from "@/lib/supabase/server";

const MASSIMO = 30 * 1024 * 1024;

async function contestoUtile() {
  const ctx = await getProcurementContext();
  if (!ctx.configured) return { ctx, errore: "Manca il collegamento a Supabase." };
  if (!ctx.userId || !ctx.canManageProcurement) return { ctx, errore: "Non hai il ruolo per gestire le gare private." };
  return { ctx, errore: "" };
}

export async function creaBozza(_precedente: EsitoAzione, form: FormData): Promise<EsitoAzione> {
  const accesso = await contestoUtile();
  if (accesso.errore) return { errore: accesso.errore, fatto: "" };
  const letto = schemaBozza.safeParse({
    org: form.get("org"),
    titolo: form.get("titolo"),
    descrizione: form.get("descrizione") ?? "",
    scadenza: form.get("scadenza") ?? "",
  });
  if (!letto.success) return { errore: "Controlla azienda, titolo e scadenza.", fatto: "" };
  if (!accesso.ctx.orgs.some((org) => org.id === letto.data.org)) {
    return { errore: "Questa azienda non è tra quelle che puoi gestire.", fatto: "" };
  }
  const scadenza = letto.data.scadenza ? new Date(letto.data.scadenza) : null;
  if (letto.data.scadenza && Number.isNaN(scadenza?.getTime())) {
    return { errore: "La scadenza non è una data valida.", fatto: "" };
  }
  const supabase = await createClient();
  const { error } = await supabase.from("app_ep_gare").insert({
    org: letto.data.org,
    titolo: letto.data.titolo,
    descrizione: letto.data.descrizione,
    scadenza: scadenza ? scadenza.toISOString() : null,
    stato: "bozza",
    creato_da: accesso.ctx.userId,
  });
  if (error) return { errore: "Non riesco a creare la bozza.", fatto: "" };
  revalidatePath("/admin/e-procurement");
  return { errore: "", fatto: "Bozza creata." };
}

export async function pubblicaGara(_precedente: EsitoAzione, form: FormData): Promise<EsitoAzione> {
  const accesso = await contestoUtile();
  if (accesso.errore) return { errore: accesso.errore, fatto: "" };
  const letto = schemaGara.safeParse({ gara: form.get("gara") });
  if (!letto.success) return { errore: "Gara non riconosciuta.", fatto: "" };
  const supabase = await createClient();
  const { error } = await supabase
    .from("app_ep_gare")
    .update({ stato: "pubblicata", pubblicato_il: new Date().toISOString() })
    .eq("id", letto.data.gara)
    .eq("stato", "bozza");
  if (error) return { errore: "Non riesco a pubblicare la gara.", fatto: "" };
  revalidatePath("/admin/e-procurement");
  return { errore: "", fatto: "Gara pubblicata. La vedono i fornitori dell'albo." };
}

export async function caricaDocumento(_precedente: EsitoAzione, form: FormData): Promise<EsitoAzione> {
  const accesso = await contestoUtile();
  if (accesso.errore) return { errore: accesso.errore, fatto: "" };
  const letto = schemaGara.safeParse({ gara: form.get("gara") });
  const file = form.get("file");
  if (!letto.success || !(file instanceof File) || file.size === 0) {
    return { errore: "Scegli un PDF o uno ZIP della gara.", fatto: "" };
  }
  if (file.size > MASSIMO) return { errore: "Il file supera 30 MB.", fatto: "" };
  const nome = file.name.toLowerCase();
  if (!nome.endsWith(".pdf") && !nome.endsWith(".zip")) {
    return { errore: "Accetto solo PDF o ZIP.", fatto: "" };
  }
  const bytes = Buffer.from(await file.arrayBuffer());
  const sha256 = createHash("sha256").update(bytes).digest("hex");
  const esito = await analizzaDocumentoGara(file.name, bytes);
  const supabase = await createClient();
  const id = randomUUID();
  const sicuro = file.name.replace(/[^\w.\- ()]/g, "_").slice(0, 120) || "documento";
  const percorso = `${letto.data.gara}/${id}/${sicuro}`;
  const caricato = await supabase.storage.from("e-procurement").upload(percorso, bytes, {
    contentType: file.type || "application/octet-stream",
    upsert: false,
  });
  if (caricato.error) return { errore: "Non riesco a conservare il file.", fatto: "" };
  const { error } = await supabase.from("app_ep_documenti").insert({
    id,
    gara: letto.data.gara,
    nome: sicuro,
    percorso,
    sha256,
    byte: file.size,
    esito_bim: esito,
  });
  if (error) {
    await supabase.storage.from("e-procurement").remove([percorso]);
    return { errore: "Il file è stato scartato: non riesco a registrarlo.", fatto: "" };
  }
  revalidatePath("/admin/e-procurement");
  return {
    errore: "",
    fatto: esito.ok ? "Documento caricato e letto da AncheBIM." : "Documento caricato. AncheBIM non ha completato la lettura.",
  };
}
