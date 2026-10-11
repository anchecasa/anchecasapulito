"use client";

import { useState } from "react";
import { saveSubscriber } from "@/lib/sos/subscriber";

const TRADES = ["Idraulico", "Elettricista", "Fabbro"];

const PERKS = [
  "Esci per primo quando un cliente cerca il tuo mestiere",
  "Il cliente ti scrive nella chat dell'app",
  "Vede solo la distanza, non il suo indirizzo nel messaggio",
  "Sulla scheda restano indirizzo, città, stelle e recensioni",
  "Compili il preventivo in tempo reale, con orario di arrivo",
];

export function IscrizioneArtigiano({ homeHref = "/supermastro" }: { homeHref?: string }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [trade, setTrade] = useState(TRADES[0]);
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <section className="mx-auto flex min-h-[calc(100dvh-66px)] max-w-lg flex-col bg-[#FBF8F3] px-5 py-8 text-[#1A2432]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#E56B10]">Abbonamento attivo</p>
        <h1 className="mt-3 text-3xl font-semibold leading-tight">I primi tre mesi sono tuoi</h1>
        <p className="mt-3 text-sm leading-relaxed text-[#2A3C54]">
          {name}, {trade.toLowerCase()} a {city}. Quando un cliente cerca, la tua scheda esce prima, con {address}.
        </p>
        <div className="mt-6 rounded-3xl bg-[#1A2432] px-5 py-5 text-[#FBF8F3]">
          <p className="text-sm text-[#FBF8F3]/70">Poi</p>
          <p className="mt-1 text-4xl font-semibold">19 euro</p>
          <p className="text-sm text-[#FBF8F3]/70">al mese, dal quarto mese</p>
        </div>
        <a
          href={homeHref}
          className="mt-auto inline-flex justify-center rounded-full bg-[#E56B10] px-5 py-4 text-sm font-semibold text-white"
        >
          Torna alla home
        </a>
      </section>
    );
  }

  return (
    <form
      className="mx-auto flex min-h-[calc(100dvh-66px)] max-w-lg flex-col bg-[#FBF8F3] text-[#1A2432]"
      onSubmit={(event) => {
        event.preventDefault();
        const cleanName = name.trim();
        const cleanPhone = phone.trim();
        const cleanAddress = address.trim();
        const cleanCity = city.trim();
        if (!cleanName || !cleanPhone || !cleanAddress || !cleanCity) return;
        saveSubscriber({
          name: cleanName,
          phone: cleanPhone,
          trade,
          address: cleanAddress,
          city: cleanCity,
          vat: "",
        });
        setDone(true);
      }}
    >
      <div className="flex-1 space-y-5 px-5 pb-6 pt-6">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#E56B10]">Offerta artigiano</p>
          <h1 className="mt-2 text-3xl font-semibold leading-tight">Tre mesi gratis nell&apos;app</h1>
          <p className="mt-2 text-sm leading-relaxed text-[#2A3C54]">
            Poi 19 euro al mese. Ti cercano i privati con un guasto del tuo mestiere.
          </p>
        </div>

        <div className="rounded-3xl bg-[#1A2432] px-5 py-5 text-[#FBF8F3] shadow-[0_16px_40px_rgba(26,36,50,0.18)]">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-sm text-[#FBF8F3]/70">Dopo i 3 mesi</p>
              <p className="text-4xl font-semibold leading-none">19 euro</p>
            </div>
            <p className="rounded-full bg-[#E56B10] px-3 py-1 text-xs font-semibold uppercase tracking-wide">al mese</p>
          </div>
          <p className="mt-4 text-sm text-[#FBF8F3]/80">I primi tre mesi non si pagano.</p>
        </div>

        <ul className="space-y-2">
          {PERKS.map((perk) => (
            <li key={perk} className="flex gap-3 rounded-2xl bg-white px-3 py-3 text-sm leading-snug shadow-sm">
              <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#E56B10] text-[11px] font-bold text-white">
                +
              </span>
              {perk}
            </li>
          ))}
        </ul>

        <div className="space-y-3 rounded-3xl bg-white p-4 shadow-sm">
          <p className="text-sm font-semibold">La tua attività</p>
          <Field label="Nome" value={name} onChange={setName} autoComplete="name" />
          <Field label="Cellulare" value={phone} onChange={setPhone} inputMode="tel" autoComplete="tel" />
          <label className="block text-sm font-medium">
            Mestiere
            <select
              value={trade}
              onChange={(event) => setTrade(event.target.value)}
              className="mt-1 w-full rounded-2xl border border-[#2A3C54]/15 bg-[#FBF8F3] px-3 py-3 text-sm"
            >
              {TRADES.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          <Field label="Indirizzo" value={address} onChange={setAddress} autoComplete="street-address" />
          <Field label="Città" value={city} onChange={setCity} autoComplete="address-level2" />
        </div>
      </div>

      <div className="sticky bottom-0 border-t border-[#2A3C54]/10 bg-[#FBF8F3]/95 px-5 py-3 backdrop-blur">
        <button type="submit" className="w-full rounded-full bg-[#E56B10] px-4 py-4 text-sm font-semibold text-white">
          Inizia i 3 mesi gratis
        </button>
        <p className="mt-2 text-center text-[11px] text-[#2A3C54]">Dal quarto mese, 19 euro. Disdici quando vuoi.</p>
      </div>
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  inputMode,
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  inputMode?: "tel" | "text";
  autoComplete?: string;
}) {
  return (
    <label className="block text-sm font-medium">
      {label}
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        inputMode={inputMode}
        autoComplete={autoComplete}
        required
        className="mt-1 w-full rounded-2xl border border-[#2A3C54]/15 bg-[#FBF8F3] px-3 py-3 text-sm"
      />
    </label>
  );
}
