"use client";

import { FileUp, Globe2, Lock, Plus, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { cambiaStato, creaGara } from "@/app/admin/e-procurement/actions";
import { caricaDocumentoGara, type StatoCaricamento } from "@/lib/e-procurement/caricamento";
import { adesso, formatoByte, valoreDataLocale } from "@/lib/e-procurement/formato";
import { ESTENSIONI, controllaFile, schemaGara, erroriCampi } from "@/lib/e-procurement/schemi";
import type { FornitoreAlbo, OrgGestita, Visibilita } from "@/lib/e-procurement/tipi";
import { SceltaFornitori } from "./scelta-fornitori";
import { Avviso, EsitoBadge, Finestra, stile } from "./ui";

type InCoda = { chiave: string; file: File; stato: StatoCaricamento; sha256?: string; errore?: string };

const vuoto = {
  titolo: "",
  descrizione: "",
  capitolato: "",
  budget: "",
  scadenza: "",
  visibilita: "inviti" as Visibilita,
};

export function NuovaGara({ orgs, albo, apriSubito }: { orgs: OrgGestita[]; albo: FornitoreAlbo[]; apriSubito?: boolean }) {
  const router = useRouter();
  const inputFile = useRef<HTMLInputElement>(null);
  const [aperta, setAperta] = useState(Boolean(apriSubito));
  const [org, setOrg] = useState(orgs[0]?.id ?? "");
  const [form, setForm] = useState(vuoto);
  const [fornitori, setFornitori] = useState<string[]>([]);
  const [file, setFile] = useState<InCoda[]>([]);
  const [campi, setCampi] = useState<Record<string, string | undefined>>({});
  const [avviso, setAvviso] = useState<string | null>(null);
  const [attesa, setAttesa] = useState<"bozza" | "pubblica" | null>(null);
  const [minimo] = useState(() => valoreDataLocale(new Date(adesso() + 2 * 3600_000)));

  const imposta = <K extends keyof typeof vuoto>(k: K, v: (typeof vuoto)[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
    setCampi((c) => ({ ...c, [k]: undefined }));
  };

  const azzera = () => {
    setForm(vuoto);
    setFornitori([]);
    setFile([]);
    setCampi({});
    setAvviso(null);
  };

  const chiudi = () => {
    if (attesa) return;
    setAperta(false);
    if (apriSubito) router.replace("/admin/e-procurement");
  };

  const aggiungiFile = (lista: FileList | null) => {
    if (!lista) return;
    const scarti: string[] = [];
    const nuovi: InCoda[] = [];
    for (const f of Array.from(lista)) {
      const problema = controllaFile(f);
      if (problema) scarti.push(problema);
      else nuovi.push({ chiave: `${f.name}-${f.size}-${f.lastModified}`, file: f, stato: "in_coda" });
    }
    setFile((l) => [...l, ...nuovi.filter((n) => !l.some((x) => x.chiave === n.chiave))]);
    setAvviso(scarti.length ? scarti.join(" · ") : null);
    if (inputFile.current) inputFile.current.value = "";
  };

  async function invia(modo: "bozza" | "pubblica") {
    setAvviso(null);
    const dati = { org, ...form, fornitori };
    const controllo = schemaGara.safeParse(dati);
    if (!controllo.success) {
      setCampi(erroriCampi(controllo.error.issues));
      setAvviso("Controlla i campi evidenziati.");
      return;
    }
    if (modo === "pubblica") {
      const mancano: Record<string, string> = {};
      if (!form.scadenza) mancano.scadenza = "Per pubblicare serve la scadenza";
      if (form.visibilita === "inviti" && fornitori.length === 0) mancano.fornitori = "Scegli almeno un fornitore dall'Albo";
      if (Object.keys(mancano).length) {
        setCampi(mancano);
        setAvviso("Per pubblicare mancano alcune informazioni. Puoi anche salvare in bozza.");
        return;
      }
    }

    setAttesa(modo);
    try {
      const creata = await creaGara(dati);
      if (!creata.ok) {
        if (creata.campi) setCampi(creata.campi);
        setAvviso(creata.errore);
        return;
      }
      const gara = creata.dati.gara;

      let falliti = 0;
      for (const voce of file) {
        const esito = await caricaDocumentoGara(gara, voce.file, (stato, extra) =>
          setFile((l) => l.map((x) => (x.chiave === voce.chiave ? { ...x, stato, sha256: extra?.sha256 ?? x.sha256, errore: extra?.errore } : x))),
        );
        if (esito === "errore" || esito === "respinto") falliti += 1;
      }

      let nota = "";
      if (falliti > 0) nota = `Bozza salvata, ma ${falliti} documento/i non è stato accettato: toglilo e ricaricalo.`;
      else if (modo === "pubblica") {
        const pub = await cambiaStato(gara, "pubblicata");
        if (!pub.ok) nota = `Bozza salvata. Pubblicazione non riuscita: ${pub.errore}`;
      }

      setAperta(false);
      azzera();
      router.push(nota ? `/admin/e-procurement/${gara}?nota=${encodeURIComponent(nota)}` : `/admin/e-procurement/${gara}`);
    } finally {
      setAttesa(null);
    }
  }

  const err = (k: string) =>
    campi[k] ? (
      <span id={`${k}-errore`} className="mt-1 block text-sm font-normal text-[#9B2C1F]">
        {campi[k]}
      </span>
    ) : null;

  return (
    <>
      <button type="button" onClick={() => setAperta(true)} disabled={orgs.length === 0} className={stile.primario}>
        <Plus size={18} aria-hidden="true" />
        Pubblica nuova gara / RFP
      </button>

      <Finestra
        aperta={aperta}
        chiudi={chiudi}
        bloccata={Boolean(attesa)}
        larga
        titolo="Nuova gara privata / RFP"
        sottotitolo="Finché è in bozza puoi cambiare tutto."
        piede={
          <>
            <button type="button" onClick={chiudi} disabled={Boolean(attesa)} className={stile.secondario}>
              Annulla
            </button>
            <button type="button" onClick={() => invia("bozza")} disabled={Boolean(attesa)} className={stile.secondario}>
              {attesa === "bozza" ? "Salvo…" : "Salva bozza"}
            </button>
            <button type="button" onClick={() => invia("pubblica")} disabled={Boolean(attesa)} className={stile.primario}>
              {attesa === "pubblica" ? "Pubblico…" : "Pubblica gara"}
            </button>
          </>
        }
      >
        <div className="flex flex-col gap-6">
          {avviso ? <Avviso tono="errore">{avviso}</Avviso> : null}

          <fieldset className="flex flex-col gap-4">
            <legend className="mb-2 text-base font-semibold text-[#1A2432]">Oggetto dell&apos;appalto</legend>
            {orgs.length > 1 ? (
              <label className={stile.etichetta}>
                Azienda committente
                <select value={org} onChange={(e) => setOrg(e.target.value)} className={stile.campo()}>
                  {orgs.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.nome}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
            <label className={stile.etichetta}>
              Titolo
              <input
                value={form.titolo}
                onChange={(e) => imposta("titolo", e.target.value)}
                maxLength={180}
                placeholder="Es. Rifacimento facciate – Via Toledo 12"
                aria-invalid={Boolean(campi.titolo)}
                className={stile.campo(Boolean(campi.titolo))}
              />
              {err("titolo")}
            </label>
            <label className={stile.etichetta}>
              Descrizione
              <textarea
                value={form.descrizione}
                onChange={(e) => imposta("descrizione", e.target.value)}
                rows={3}
                maxLength={4000}
                placeholder="Luogo, lavorazioni, requisiti per partecipare"
                className={stile.campo(Boolean(campi.descrizione))}
              />
              {err("descrizione")}
            </label>
            <label className={stile.etichetta}>
              Capitolato <span className="font-normal text-[#2A3C54]">(facoltativo, oltre agli allegati)</span>
              <textarea
                value={form.capitolato}
                onChange={(e) => imposta("capitolato", e.target.value)}
                rows={5}
                placeholder="Quantità, standard, criteri di aggiudicazione"
                className={`${stile.campo(Boolean(campi.capitolato))} font-mono text-sm`}
              />
              {err("capitolato")}
            </label>
          </fieldset>

          <fieldset className="grid gap-4 sm:grid-cols-2">
            <legend className="mb-2 text-base font-semibold text-[#1A2432]">Budget e scadenza</legend>
            <label className={stile.etichetta}>
              Budget stimato (€)
              <input
                type="number"
                inputMode="decimal"
                min={1}
                step="0.01"
                value={form.budget}
                onChange={(e) => imposta("budget", e.target.value)}
                placeholder="250000"
                className={`${stile.campo(Boolean(campi.budget))} tabular-nums`}
              />
              {err("budget")}
            </label>
            <label className={stile.etichetta}>
              Scadenza offerte
              <input
                type="datetime-local"
                min={minimo}
                value={form.scadenza}
                onChange={(e) => imposta("scadenza", e.target.value)}
                className={stile.campo(Boolean(campi.scadenza))}
              />
              {err("scadenza")}
            </label>
          </fieldset>

          <fieldset className="flex flex-col gap-3">
            <legend className="mb-2 text-base font-semibold text-[#1A2432]">Chi partecipa</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {(
                [
                  { v: "inviti", Icona: Lock, t: "Solo su invito", d: "Scegli i fornitori dall'Albo" },
                  { v: "aperta", Icona: Globe2, t: "Invito aperto", d: "La vedono tutti i fornitori attivi dell'Albo" },
                ] as const
              ).map(({ v, Icona, t, d }) => (
                <label
                  key={v}
                  className={`flex min-h-11 cursor-pointer items-start gap-3 rounded-2xl p-3 ring-1 ${
                    form.visibilita === v ? "bg-blue-50 ring-2 ring-blue-800" : "bg-white ring-[#E7D3C3]"
                  }`}
                >
                  <input
                    type="radio"
                    name="visibilita"
                    value={v}
                    checked={form.visibilita === v}
                    onChange={() => imposta("visibilita", v)}
                    className="sr-only"
                  />
                  <Icona size={18} className="mt-0.5 shrink-0 text-blue-800" aria-hidden="true" />
                  <span>
                    <span className="block font-semibold text-[#1A2432]">{t}</span>
                    <span className="block text-sm text-[#2A3C54]">{d}</span>
                  </span>
                </label>
              ))}
            </div>
            <p className="text-sm font-semibold text-[#1A2432]">
              {form.visibilita === "inviti" ? "Fornitori invitati" : "Inviti diretti (facoltativi)"}
            </p>
            <SceltaFornitori
              albo={albo}
              scelti={fornitori}
              cambia={(ids) => {
                setFornitori(ids);
                setCampi((c) => ({ ...c, fornitori: undefined }));
              }}
              errore={Boolean(campi.fornitori)}
            />
            {err("fornitori")}
          </fieldset>

          <fieldset className="flex flex-col gap-3">
            <legend className="mb-2 flex items-center gap-2 text-base font-semibold text-[#1A2432]">
              <ShieldCheck size={18} className="text-blue-800" aria-hidden="true" />
              Documenti tecnici · controllo AncheBIM
            </legend>
            <label
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                aggiungiFile(e.dataTransfer.files);
              }}
              className="flex min-h-28 cursor-pointer flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed border-[#E7D3C3] bg-white px-4 py-5 text-center hover:border-blue-700"
            >
              <FileUp size={24} className="text-[#8A97A8]" aria-hidden="true" />
              <span className="font-semibold text-[#1A2432]">Trascina qui i file o tocca per sceglierli</span>
              <span className="text-sm text-[#2A3C54]">{ESTENSIONI.join(" ")} · fino a 30 MB l&apos;uno</span>
              <input ref={inputFile} type="file" multiple accept={ESTENSIONI.join(",")} onChange={(e) => aggiungiFile(e.target.files)} className="sr-only" />
            </label>
            <p className="text-sm text-[#2A3C54]">
              Di ogni file si calcola l&apos;impronta SHA-256, il server la ricontrolla e AncheBIM legge il documento: se qualcuno lo
              altera dopo, si vede.
            </p>
            {file.length > 0 ? (
              <ul className="divide-y divide-[#EFE3D8] rounded-2xl bg-white ring-1 ring-[#E7D3C3]">
                {file.map((f) => (
                  <li key={f.chiave} className="flex min-h-11 items-center gap-3 px-3 py-2">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold text-[#1A2432]">{f.file.name}</span>
                      <span className="block truncate font-mono text-xs text-[#2A3C54]">
                        {formatoByte(f.file.size)}
                        {f.sha256 ? ` · sha256:${f.sha256.slice(0, 16)}…` : ""}
                        {f.errore ? <span className="font-sans text-[#9B2C1F]"> · {f.errore}</span> : null}
                      </span>
                    </span>
                    {f.stato === "in_coda" ? (
                      <button
                        type="button"
                        disabled={Boolean(attesa)}
                        onClick={() => setFile((l) => l.filter((x) => x.chiave !== f.chiave))}
                        className="min-h-9 px-2 text-sm font-semibold text-[#2A3C54] hover:text-[#9B2C1F]"
                      >
                        Togli
                      </button>
                    ) : (
                      <EsitoBadge esito={f.stato} />
                    )}
                  </li>
                ))}
              </ul>
            ) : null}
          </fieldset>
        </div>
      </Finestra>
    </>
  );
}
