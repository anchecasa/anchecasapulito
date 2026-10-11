"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { loadAccount, saveAccount, type Account } from "@/lib/sos/account";
import { loadCliente, saveCliente } from "@/lib/sos/cliente";
import { loadPhoneSession, type PhoneSession } from "@/lib/sos/phone-session";
import { loadSubscriber, saveSubscriber } from "@/lib/sos/subscriber";

const TRADES = ["Idraulico", "Elettricista", "Fabbro"];

const PROVIDER_LABEL: Record<Account["provider"], string> = {
  google: "Google",
  facebook: "Facebook",
  apple: "Apple",
  email: "Email",
};

export function ProfiloScreen() {
  const [session, setSession] = useState<PhoneSession | null | undefined>(undefined);
  const [account, setAccount] = useState<Account | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [trade, setTrade] = useState(TRADES[0]);
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [vat, setVat] = useState("");
  const [card, setCard] = useState("");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const currentSession = loadPhoneSession();
    const currentAccount = loadAccount();
    const cardLast4 = loadCliente()?.cardLast4 ?? "";
    const subscriber = loadSubscriber();
    let dead = false;
    queueMicrotask(() => {
      if (dead) return;
      setSession(currentSession);
      setAccount(currentAccount);
      setName(currentAccount?.name || currentSession?.name || "");
      setCard(cardLast4);
      if (!subscriber) return;
      setName(subscriber.name);
      setPhone(subscriber.phone);
      setTrade(subscriber.trade || TRADES[0]);
      setAddress(subscriber.address);
      setCity(subscriber.city);
      setVat(subscriber.vat);
      if (/^\d{11}$/.test(subscriber.vat)) setSaved(true);
    });
    return () => {
      dead = true;
    };
  }, []);

  if (session === undefined) return null;

  const role = account?.role ?? session?.role ?? null;
  const provider = account?.provider ?? session?.provider;

  if (!session || !role) {
    return (
      <section className="min-h-full bg-[#FBF8F3] px-4 py-5 text-[#1A2432]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#E56B10]">Profilo</p>
        <h1 className="mt-2 text-2xl font-semibold">Entra con un social</h1>
        <p className="mt-2 text-sm leading-relaxed text-[#2A3C54]">
          Privato e artigiano usano Google, Facebook o Apple. La P.IVA si compila qui, dopo.
        </p>
        <Link href="/m/iscrizione" className="mt-6 flex h-12 items-center justify-center rounded-full bg-[#E56B10] text-sm font-semibold text-white">
          Iscriviti
        </Link>
      </section>
    );
  }

  if (role === "privato") {
    return (
      <section className="min-h-full bg-[#FBF8F3] px-4 py-5 text-[#1A2432]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#E56B10]">Profilo privato</p>
        <h1 className="mt-2 text-2xl font-semibold">{session.name}</h1>
        <p className="mt-1 text-sm text-[#2A3C54]">
          {provider ? `Accesso con ${PROVIDER_LABEL[provider]}` : "Accesso attivo"}
          {session.email ? ` · ${session.email}` : ""}
        </p>
        <form
          className="mt-5 rounded-3xl bg-white px-4 py-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (!/^\d{4}$/.test(card)) {
              setError("Servono le ultime 4 cifre della carta.");
              return;
            }
            setError(null);
            saveCliente({
              name: session.name,
              phone: "",
              email: session.email,
              cardLast4: card,
            });
            setSaved(true);
          }}
        >
          <p className="text-sm font-semibold">Carta per acconto e saldo</p>
          <input
            value={card}
            onChange={(event) => setCard(event.target.value.replace(/\D/g, "").slice(0, 4))}
            inputMode="numeric"
            autoComplete="cc-number"
            placeholder="Ultime 4 cifre"
            className="mt-3 h-12 w-full rounded-2xl bg-[#FBF8F3] px-3 text-sm"
          />
          {error && <p className="mt-2 text-sm text-[#E56B10]">{error}</p>}
          {saved && <p className="mt-2 text-sm text-[#2A3C54]">Carta salvata nel profilo.</p>}
          <button type="submit" className="mt-3 h-11 w-full rounded-full bg-[#E56B10] text-sm font-semibold text-white">
            Salva la carta
          </button>
        </form>
      </section>
    );
  }

  if (saved) {
    return (
      <section className="min-h-full bg-[#FBF8F3] px-4 py-5 text-[#1A2432]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#E56B10]">Profilo artigiano</p>
        <h1 className="mt-2 text-2xl font-semibold">{name}</h1>
        <p className="mt-1 text-sm text-[#2A3C54]">
          {provider ? `Accesso con ${PROVIDER_LABEL[provider]}. ` : ""}
          P.IVA {vat}
        </p>
        <dl className="mt-5 space-y-3 rounded-3xl bg-white px-4 py-4 text-sm">
          <div>
            <dt className="text-[#2A3C54]">Mestiere</dt>
            <dd className="font-semibold">{trade}</dd>
          </div>
          <div>
            <dt className="text-[#2A3C54]">Sede</dt>
            <dd className="font-semibold">{[address, city].filter(Boolean).join(", ")}</dd>
          </div>
          <div>
            <dt className="text-[#2A3C54]">Cellulare</dt>
            <dd className="font-semibold">{phone}</dd>
          </div>
        </dl>
        <button type="button" onClick={() => setSaved(false)} className="mt-4 text-sm font-semibold text-[#E56B10]">
          Modifica i dati
        </button>
      </section>
    );
  }

  return (
    <form
      className="min-h-full bg-[#FBF8F3] px-4 py-5 text-[#1A2432]"
      onSubmit={(event) => {
        event.preventDefault();
        const cleanVat = vat.replace(/\D/g, "");
        if (!name.trim() || !phone.trim() || !address.trim() || !city.trim() || !/^\d{11}$/.test(cleanVat)) {
          setError("Servono nome, cellulare, indirizzo, città e una P.IVA di 11 cifre.");
          return;
        }
        setError(null);
        saveSubscriber({
          name: name.trim(),
          phone: phone.trim(),
          trade,
          address: address.trim(),
          city: city.trim(),
          vat: cleanVat,
        });
        if (account) saveAccount({ ...account, name: name.trim() });
        setVat(cleanVat);
        setSaved(true);
      }}
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#E56B10]">Profilo artigiano</p>
      <h1 className="mt-2 text-2xl font-semibold">Completa l&apos;attività</h1>
      <p className="mt-2 text-sm leading-relaxed text-[#2A3C54]">
        L&apos;iscrizione è già fatta con il social. Qui restano P.IVA, mestiere e sede.
      </p>
      <div className="mt-4 space-y-3">
        <Field label="Nome" value={name} onChange={setName} />
        <Field label="P.IVA" value={vat} onChange={(value) => setVat(value.replace(/\D/g, "").slice(0, 11))} inputMode="numeric" />
        <label className="block text-sm font-medium">
          Mestiere
          <select
            value={trade}
            onChange={(event) => setTrade(event.target.value)}
            className="mt-1 h-12 w-full rounded-2xl bg-white px-3 text-sm"
          >
            {TRADES.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
        <Field label="Cellulare" value={phone} onChange={setPhone} inputMode="tel" />
        <Field label="Indirizzo" value={address} onChange={setAddress} />
        <Field label="Città" value={city} onChange={setCity} />
      </div>
      {error && <p className="mt-3 text-sm text-[#E56B10]">{error}</p>}
      <button type="submit" className="mt-5 h-12 w-full rounded-full bg-[#E56B10] text-sm font-semibold text-white">
        Salva nel profilo
      </button>
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  inputMode?: "tel" | "numeric";
}) {
  return (
    <label className="block text-sm font-medium">
      {label}
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        inputMode={inputMode}
        className="mt-1 h-12 w-full rounded-2xl bg-white px-3 text-sm"
      />
    </label>
  );
}
