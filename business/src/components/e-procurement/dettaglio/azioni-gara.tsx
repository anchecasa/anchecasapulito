"use client";

import { CalendarPlus, Pencil, Send, Square, Trash2, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { cambiaStato, eliminaBozza, modificaBozza, prorogaScadenza } from "@/app/admin/e-procurement/actions";
import { valoreDataLocale } from "@/lib/e-procurement/formato";
import { erroriCampi, schemaGara } from "@/lib/e-procurement/schemi";
import type { Gara } from "@/lib/e-procurement/tipi";
import { Avviso, Finestra, stile } from "../ui";

type R = { ok: boolean; errore?: string };

export function AzioniGara({ gara }: { gara: Gara }) {
  const router = useRouter();
  const [attesa, avvia] = useTransition();
  const [errore, setErrore] = useState<string | null>(null);
  const [modifica, setModifica] = useState(false);
  const [proroga, setProroga] = useState(false);

  const esegui = (fn: () => Promise<R>, conferma?: string, dopo?: () => void) => {
    if (conferma && !window.confirm(conferma)) return;
    setErrore(null);
    avvia(async () => {
      const r = await fn();
      if (!r.ok) setErrore(r.errore ?? "Operazione non riuscita");
      else dopo?.();
    });
  };

  return (
    <div className="flex flex-col gap-2 sm:items-end">
      <div className="flex flex-wrap gap-2">
        {gara.stato === "bozza" ? (
          <>
            <button type="button" className={stile.secondario} disabled={attesa} onClick={() => setModifica(true)}>
              <Pencil size={16} aria-hidden="true" /> Modifica
            </button>
            <button
              type="button"
              className={stile.pericolo}
              disabled={attesa}
              onClick={() =>
                esegui(() => eliminaBozza(gara.id), "Eliminare la bozza e i suoi documenti?", () => router.push("/admin/e-procurement"))
              }
            >
              <Trash2 size={16} aria-hidden="true" /> Elimina
            </button>
            <button
              type="button"
              className={stile.primario}
              disabled={attesa}
              onClick={() =>
                esegui(
                  () => cambiaStato(gara.id, "pubblicata"),
                  "Pubblicare la gara? Dopo non si può più modificare, solo prorogare. I fornitori invitati ricevono una notifica.",
                )
              }
            >
              <Send size={16} aria-hidden="true" /> Pubblica
            </button>
          </>
        ) : null}

        {gara.stato === "pubblicata" ? (
          <>
            <button type="button" className={stile.secondario} disabled={attesa} onClick={() => setProroga(true)}>
              <CalendarPlus size={16} aria-hidden="true" /> Proroga
            </button>
            <button
              type="button"
              className={stile.pericolo}
              disabled={attesa}
              onClick={() => esegui(() => cambiaStato(gara.id, "annullata"), "Annullare la gara? È definitivo e i fornitori vengono avvisati.")}
            >
              <XCircle size={16} aria-hidden="true" /> Annulla
            </button>
            <button
              type="button"
              className={stile.primario}
              disabled={attesa}
              onClick={() =>
                esegui(() => cambiaStato(gara.id, "chiusa"), "Chiudere adesso? Le offerte si fermano e le buste si aprono.")
              }
            >
              <Square size={16} aria-hidden="true" /> Chiudi e apri le buste
            </button>
          </>
        ) : null}

        {gara.stato === "chiusa" ? (
          <button
            type="button"
            className={stile.pericolo}
            disabled={attesa}
            onClick={() => esegui(() => cambiaStato(gara.id, "annullata"), "Annullare la gara senza aggiudicarla?")}
          >
            <XCircle size={16} aria-hidden="true" /> Annulla senza aggiudicare
          </button>
        ) : null}
      </div>
      {errore ? <Avviso tono="errore">{errore}</Avviso> : null}

      {gara.stato === "bozza" ? <ModificaBozza gara={gara} aperta={modifica} chiudi={() => setModifica(false)} /> : null}
      {gara.stato === "pubblicata" ? <Proroga gara={gara} aperta={proroga} chiudi={() => setProroga(false)} /> : null}
    </div>
  );
}

function ModificaBozza({ gara, aperta, chiudi }: { gara: Gara; aperta: boolean; chiudi: () => void }) {
  const [form, setForm] = useState({
    titolo: gara.titolo,
    descrizione: gara.descrizione,
    capitolato: gara.capitolato,
    budget: gara.budget == null ? "" : String(gara.budget),
    scadenza: gara.scadenza ? valoreDataLocale(new Date(gara.scadenza)) : "",
    visibilita: gara.visibilita,
  });
  const [campi, setCampi] = useState<Record<string, string | undefined>>({});
  const [avviso, setAvviso] = useState<string | null>(null);
  const [attesa, avvia] = useTransition();

  const imposta = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
    setCampi((c) => ({ ...c, [k]: undefined }));
  };

  const salva = () => {
    const dati = { org: gara.org, ...form, fornitori: [] };
    const c = schemaGara.safeParse(dati);
    if (!c.success) {
      setCampi(erroriCampi(c.error.issues));
      return;
    }
    avvia(async () => {
      const r = await modificaBozza(gara.id, dati);
      if (!r.ok) {
        setAvviso(r.errore);
        if (r.campi) setCampi(r.campi);
      } else chiudi();
    });
  };

  const err = (k: string) => (campi[k] ? <span className="mt-1 block text-sm font-normal text-[#9B2C1F]">{campi[k]}</span> : null);

  return (
    <Finestra
      aperta={aperta}
      chiudi={chiudi}
      bloccata={attesa}
      larga
      titolo="Modifica bozza"
      sottotitolo={gara.codice}
      piede={
        <>
          <button type="button" className={stile.secondario} onClick={chiudi} disabled={attesa}>
            Annulla
          </button>
          <button type="button" className={stile.primario} onClick={salva} disabled={attesa}>
            {attesa ? "Salvo…" : "Salva"}
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {avviso ? <Avviso tono="errore">{avviso}</Avviso> : null}
        <label className={stile.etichetta}>
          Titolo
          <input value={form.titolo} onChange={(e) => imposta("titolo", e.target.value)} className={stile.campo(Boolean(campi.titolo))} />
          {err("titolo")}
        </label>
        <label className={stile.etichetta}>
          Descrizione
          <textarea rows={3} value={form.descrizione} onChange={(e) => imposta("descrizione", e.target.value)} className={stile.campo(Boolean(campi.descrizione))} />
          {err("descrizione")}
        </label>
        <label className={stile.etichetta}>
          Capitolato
          <textarea rows={6} value={form.capitolato} onChange={(e) => imposta("capitolato", e.target.value)} className={`${stile.campo()} font-mono text-sm`} />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className={stile.etichetta}>
            Budget stimato (€)
            <input type="number" min={1} step="0.01" value={form.budget} onChange={(e) => imposta("budget", e.target.value)} className={stile.campo(Boolean(campi.budget))} />
            {err("budget")}
          </label>
          <label className={stile.etichetta}>
            Scadenza offerte
            <input type="datetime-local" value={form.scadenza} onChange={(e) => imposta("scadenza", e.target.value)} className={stile.campo(Boolean(campi.scadenza))} />
            {err("scadenza")}
          </label>
        </div>
        <label className={stile.etichetta}>
          Chi partecipa
          <select value={form.visibilita} onChange={(e) => imposta("visibilita", e.target.value as typeof form.visibilita)} className={stile.campo()}>
            <option value="inviti">Solo su invito</option>
            <option value="aperta">Invito aperto ai fornitori attivi dell&apos;Albo</option>
          </select>
        </label>
      </div>
    </Finestra>
  );
}

function Proroga({ gara, aperta, chiudi }: { gara: Gara; aperta: boolean; chiudi: () => void }) {
  const attuale = gara.scadenza ? new Date(gara.scadenza) : new Date();
  const [valore, setValore] = useState(valoreDataLocale(new Date(attuale.getTime() + 7 * 86_400_000)));
  const [errore, setErrore] = useState<string | null>(null);
  const [attesa, avvia] = useTransition();

  const salva = () => {
    const d = new Date(valore);
    if (Number.isNaN(d.getTime()) || d <= attuale) {
      setErrore("La nuova scadenza deve venire dopo quella attuale.");
      return;
    }
    avvia(async () => {
      const r = await prorogaScadenza(gara.id, d.toISOString());
      if (!r.ok) setErrore(r.errore);
      else chiudi();
    });
  };

  return (
    <Finestra
      aperta={aperta}
      chiudi={chiudi}
      bloccata={attesa}
      titolo="Proroga la scadenza"
      sottotitolo="I fornitori ricevono una notifica. La scadenza non si può anticipare."
      piede={
        <>
          <button type="button" className={stile.secondario} onClick={chiudi} disabled={attesa}>
            Annulla
          </button>
          <button type="button" className={stile.primario} onClick={salva} disabled={attesa}>
            {attesa ? "Salvo…" : "Conferma proroga"}
          </button>
        </>
      }
    >
      <label className={stile.etichetta}>
        Nuova scadenza
        <input
          type="datetime-local"
          min={valoreDataLocale(attuale)}
          value={valore}
          onChange={(e) => {
            setValore(e.target.value);
            setErrore(null);
          }}
          className={stile.campo(Boolean(errore))}
        />
      </label>
      {errore ? (
        <p role="alert" className="mt-2 text-sm text-[#9B2C1F]">
          {errore}
        </p>
      ) : null}
    </Finestra>
  );
}
