"use client";

import { registraDocumento } from "@/app/admin/e-procurement/actions";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import { nomeSicuro } from "./schemi";
import type { EsitoDocumento } from "./tipi";

export type StatoCaricamento = EsitoDocumento | "in_coda" | "impronta" | "invio" | "errore";

export async function sha256File(file: File): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Impronta SHA-256 nel browser → file nel bucket privato (senza passare dal server,
 * così non c'è il limite di dimensione delle funzioni) → registrazione e controllo AncheBIM sul server.
 */
export async function caricaDocumentoGara(
  gara: string,
  file: File,
  aggiorna: (stato: StatoCaricamento, extra?: { sha256?: string; errore?: string }) => void,
): Promise<StatoCaricamento> {
  try {
    aggiorna("impronta");
    const sha256 = await sha256File(file);
    aggiorna("invio", { sha256 });

    const percorso = `${gara}/${sha256}-${nomeSicuro(file.name)}`;
    const { error } = await createBrowserSupabase()
      .storage.from("e-procurement")
      .upload(percorso, file, { upsert: false, contentType: file.type || "application/octet-stream" });
    if (error) {
      throw new Error(/exists|duplicate/i.test(error.message) ? "Lo stesso documento è già caricato" : "Caricamento non riuscito");
    }

    const r = await registraDocumento({
      gara,
      percorso,
      nome: file.name.slice(0, 180),
      mime: file.type || "application/octet-stream",
      byte: file.size,
      sha256,
    });
    if (!r.ok) throw new Error(r.errore);
    aggiorna(r.dati.esito, { sha256 });
    return r.dati.esito;
  } catch (e) {
    aggiorna("errore", { errore: e instanceof Error ? e.message : "Errore" });
    return "errore";
  }
}
