"use client";

import { UserPlus } from "lucide-react";
import { useState, useTransition } from "react";
import { invitaFornitori, togliInvito } from "@/app/admin/e-procurement/actions";
import { formatoData } from "@/lib/e-procurement/formato";
import type { FornitoreAlbo, Gara, Invito } from "@/lib/e-procurement/tipi";
import { SceltaFornitori } from "../scelta-fornitori";
import { Finestra, InvitoBadge, stile } from "../ui";

export function Inviti({ gara, inviti, albo, nomi }: { gara: Gara; inviti: Invito[]; albo: FornitoreAlbo[]; nomi: Record<string, string> }) {
  const [scelta, setScelta] = useState(false);
  const [scelti, setScelti] = useState<string[]>([]);
  const [errore, setErrore] = useState<string | null>(null);
  const [attesa, avvia] = useTransition();

  const puoInvitare = gara.stato === "bozza" || gara.stato === "pubblicata";
  const puoTogliere = gara.stato === "bozza";
  const giaDentro = new Set(inviti.map((i) => i.fornitore));
  const disponibili = albo.filter((f) => !giaDentro.has(f.id));

  const aggiungi = () =>
    avvia(async () => {
      const r = await invitaFornitori(gara.id, scelti);
      if (!r.ok) setErrore(r.errore);
      else {
        setScelti([]);
        setScelta(false);
      }
    });

  const togli = (fornitore: string) =>
    avvia(async () => {
      const r = await togliInvito(gara.id, fornitore);
      if (!r.ok) setErrore(r.errore);
    });

  return (
    <section className="rounded-2xl bg-white ring-1 ring-[#EFE3D8]" aria-labelledby="titolo-inviti">
      <header className="flex items-center justify-between gap-2 border-b border-[#EFE3D8] px-4 py-3">
        <h2 id="titolo-inviti" className="text-lg font-semibold text-[#1A2432]">
          {gara.visibilita === "aperta" ? "Partecipanti e invitati" : "Fornitori invitati"}{" "}
          <span className="font-normal text-[#8A97A8]">{inviti.length}</span>
        </h2>
        {puoInvitare ? (
          <button type="button" className={stile.piccolo} disabled={attesa} onClick={() => setScelta(true)}>
            <UserPlus size={14} aria-hidden="true" /> Invita dall&apos;Albo
          </button>
        ) : null}
      </header>
      {errore ? (
        <p role="alert" className="px-4 pt-3 text-sm text-[#9B2C1F]">
          {errore}
        </p>
      ) : null}
      {inviti.length === 0 ? (
        <p className="px-4 py-8 text-center text-base text-[#2A3C54]">
          {gara.visibilita === "aperta"
            ? "Gara aperta: chi presenta un'offerta compare qui."
            : "Nessun fornitore invitato. Per pubblicare ne serve almeno uno."}
        </p>
      ) : (
        <ul className="divide-y divide-[#EFE3D8]">
          {inviti.map((i) => (
            <li key={i.fornitore} className="flex min-h-11 items-center gap-3 px-4 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-[#1A2432]">{nomi[i.fornitore] ?? "Fornitore"}</p>
                <p className="text-xs text-[#2A3C54]">dal {formatoData(i.creato)}</p>
              </div>
              <InvitoBadge stato={i.stato} />
              {puoTogliere ? (
                <button type="button" onClick={() => togli(i.fornitore)} disabled={attesa} className="min-h-9 px-2 text-sm text-[#2A3C54] hover:text-[#9B2C1F]">
                  Togli
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      <Finestra
        aperta={scelta}
        chiudi={() => setScelta(false)}
        bloccata={attesa}
        larga
        titolo="Invita fornitori dall'Albo"
        sottotitolo={gara.stato === "pubblicata" ? "La gara è già aperta: gli invitati ricevono subito la notifica." : undefined}
        piede={
          <>
            <button type="button" className={stile.secondario} onClick={() => setScelta(false)} disabled={attesa}>
              Annulla
            </button>
            <button type="button" className={stile.primario} onClick={aggiungi} disabled={attesa || scelti.length === 0}>
              {attesa ? "Invio…" : `Invita${scelti.length ? ` ${scelti.length}` : ""}`}
            </button>
          </>
        }
      >
        <SceltaFornitori albo={disponibili} scelti={scelti} cambia={setScelti} />
      </Finestra>
    </section>
  );
}
