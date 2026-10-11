import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

const SCRIPT = path.join(process.cwd(), "services", "anchebim", "analizza_ingresso.py");

export type EsitoAncheBim = {
  ok: boolean;
  errore?: string;
  sha256?: string;
  nome?: string;
  stato?: string;
  [chiave: string]: unknown;
};

function esegui(file: string): Promise<{ codice: number; testo: string }> {
  return new Promise((resolve, reject) => {
    const processo = spawn("python", [SCRIPT, "--file", file], {
      cwd: path.dirname(SCRIPT),
      windowsHide: true,
    });
    let testo = "";
    let errore = "";
    processo.stdout.setEncoding("utf8");
    processo.stderr.setEncoding("utf8");
    processo.stdout.on("data", (pezzo) => {
      testo += pezzo;
    });
    processo.stderr.on("data", (pezzo) => {
      errore += pezzo;
    });
    processo.on("error", reject);
    processo.on("close", (codice) => {
      resolve({ codice: codice ?? 1, testo: testo || errore });
    });
  });
}

/** Stesso motore della pagina AncheBIM: script locale, impronta SHA-256, niente API esterna. */
export async function analizzaByte(nome: string, bytes: Uint8Array): Promise<EsitoAncheBim> {
  const pulito = path.basename(nome).replace(/[^\w.\- ()]/g, "_") || "documento";
  const cartella = path.join(tmpdir(), `anchebim-${randomUUID()}`);
  const destinazione = path.join(cartella, pulito);
  await mkdir(cartella, { recursive: true });
  try {
    await writeFile(destinazione, bytes);
    const risultato = await esegui(destinazione);
    const inizio = risultato.testo.indexOf("{");
    const json = inizio >= 0 ? risultato.testo.slice(inizio) : "";
    if (!json) {
      return { ok: false, errore: "Analisi senza risposta." };
    }
    const dati = JSON.parse(json) as EsitoAncheBim;
    return dati;
  } catch (errore) {
    const messaggio = errore instanceof Error ? errore.message : "Analisi non riuscita.";
    return { ok: false, errore: messaggio };
  } finally {
    await rm(cartella, { recursive: true, force: true });
  }
}
