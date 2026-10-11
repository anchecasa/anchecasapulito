"use client";

import { CheckCircle2, LockKeyhole } from "lucide-react";
import { useState, useTransition } from "react";
import { inviaOfferta, rinuncia } from "@/app/fornitore/gare/actions";
import { formatoData, formatoEuro } from "@/lib/e-procurement/formato";
import { stile } from "../ui";

type Props = {
  gara: string;
  fornitore: string;
  aperta: boolean;
  firma: boolean;
  rinunciato: boolean;
  invitato: boolean;
  scadenza: string | null;
  esistente: { importo: number; note: string; inviata_il: string } | null;
};

export function ModuloOfferta({ gara, fornitore, aperta, firma, rinunciato, invitato, scadenza, esistente }: Props) {
  const [importo, setImporto] = useState(esistente ? String(esistente.importo) : "");
  const [note, setNote] = useState(esistente?.note ?? "");
  const [errore, setErrore] = useState<string | null>(null);
  const [salvata, setSalvata] = useState(false);
  const [attesa, avvia] = useTransition();

  const riquadro = "flex flex-col gap-3 rounded-2xl bg-white px-4 py-4 ring-1 ring-[#EFE3D8]";

  if (!aperta) {
    return (
      <section className={riquadro}>
        <h2 className="flex items-center gap-2 text-lg font-semibold text-[#1A2432]">
          <LockKeyhole size={18} className="text-[#8A97A8]" aria-hidden="true" /> Offerte chiuse
        </h2>
        <p className="text-base text-[#2A3C54]">
          {esistente
            ? `Hai offerto ${formatoEuro(esistente.importo)} il ${formatoData(esistente.inviata_il)}.`
            : "Non si possono più presentare offerte."}
        </p>
      </section>
    );
  }

  if (rinunciato && !esistente) {
    return (
      <section className={riquadro}>
        <h2 className="text-lg font-semibold text-[#1A2432]">Hai rinunciato a questa gara</h2>
        <p className="text-base text-[#2A3C54]">Se vuoi partecipare comunque, contatta il committente.</p>
      </section>
    );
  }

  if (!firma) {
    return (
      <section className={riquadro}>
        <h2 className="text-lg font-semibold text-[#1A2432]">Offerta</h2>
        <p className="text-base text-[#2A3C54]">
          {esistente ? `La tua azienda ha offerto ${formatoEuro(esistente.importo)}. ` : ""}
          Solo il titolare o un responsabile può inviare o cambiare l&apos;offerta.
        </p>
      </section>
    );
  }

  const invia = (e: React.FormEvent) => {
    e.preventDefault();
    setErrore(null);
    setSalvata(false);
    const pulito = importo.trim().replace(/\s|€/g, "");
    const valore = Number(pulito.includes(",") ? pulito.replace(/\./g, "").replace(",", ".") : pulito);
    if (!Number.isFinite(valore) || valore <= 0) {
      setErrore("Scrivi un importo valido.");
      return;
    }
    if (!window.confirm(`Confermi l'offerta di ${formatoEuro(valore)}? Puoi cambiarla fino alla scadenza.`)) return;
    avvia(async () => {
      const r = await inviaOfferta({ gara, fornitore, importo: valore, note });
      if (!r.ok) setErrore(r.errore);
      else setSalvata(true);
    });
  };

  const rinuncio = () => {
    if (!window.confirm("Confermi che non parteciperai a questa gara?")) return;
    avvia(async () => {
      const r = await rinuncia(gara, fornitore);
      if (!r.ok) setErrore(r.errore);
    });
  };

  return (
    <form onSubmit={invia} noValidate className={riquadro}>
      <div>
        <h2 className="text-lg font-semibold text-[#1A2432]">{esistente ? "La tua offerta" : "Presenta l'offerta"}</h2>
        <p className="text-sm text-[#2A3C54]">Busta chiusa: il committente vede l&apos;importo solo dopo il {formatoData(scadenza)}.</p>
      </div>
      {(salvata || esistente) && !errore ? (
        <p className="flex items-start gap-2 rounded-xl bg-[#E5F2E8] px-3 py-2 text-base text-[#1A2432]">
          <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-700" aria-hidden="true" />
          {salvata ? "Offerta registrata." : `Inviata il ${formatoData(esistente!.inviata_il)}. Puoi cambiarla fino alla scadenza.`}
        </p>
      ) : null}
      <label className={stile.etichetta}>
        Importo offerto (€, IVA esclusa)
        <input inputMode="decimal" value={importo} onChange={(e) => setImporto(e.target.value)} placeholder="Es. 238500" className={`${stile.campo(Boolean(errore))} tabular-nums`} />
      </label>
      <label className={stile.etichetta}>
        Note <span className="font-normal text-[#2A3C54]">(tempi, condizioni, varianti)</span>
        <textarea rows={4} maxLength={5000} value={note} onChange={(e) => setNote(e.target.value)} className={stile.campo()} />
      </label>
      {errore ? (
        <p role="alert" className="text-sm text-[#9B2C1F]">
          {errore}
        </p>
      ) : null}
      <button type="submit" disabled={attesa} className={`${stile.primario} w-full`}>
        {attesa ? "Invio…" : esistente ? "Aggiorna l'offerta" : "Invia l'offerta"}
      </button>
      {invitato && !esistente ? (
        <button type="button" onClick={rinuncio} disabled={attesa} className={`${stile.secondario} w-full`}>
          Non partecipo
        </button>
      ) : null}
    </form>
  );
}
