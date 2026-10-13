import { redirect } from "next/navigation";

/**
 * La vecchia richiesta SOS con la foto non esiste più: in SuperMastro nessuno
 * allega foto o file. Ogni richiesta parte dal video di 5 secondi registrato dal vivo.
 */
export default function NuovaRichiestaPage() {
  redirect("/supermastro/video");
}
