import "server-only";
import { analizzaByte, type EsitoAncheBim } from "@/lib/anchebim/analizza";

/** Usa il motore già presente nel cruscotto, non una chiamata HTTP generica. */
export async function analizzaDocumentoGara(nome: string, bytes: Uint8Array): Promise<EsitoAncheBim> {
  return analizzaByte(nome, bytes);
}
