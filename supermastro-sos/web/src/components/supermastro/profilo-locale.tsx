"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { loadAccount, saveAccount, type Account } from "@/lib/sos/account";
import { loadSubscriber, saveSubscriber } from "@/lib/sos/subscriber";

const TRADES = ["Idraulico", "Elettricista", "Fabbro"];

const PROVIDER_LABEL: Record<Account["provider"], string> = {
  google: "Google",
  facebook: "Facebook",
  apple: "Apple",
  email: "Email",
};

export function ProfiloLocale() {
  const [account, setAccount] = useState<Account | null | undefined>(undefined);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [trade, setTrade] = useState(TRADES[0]);
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [vat, setVat] = useState("");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const current = loadAccount();
    const subscriber = loadSubscriber();
    let dead = false;
    queueMicrotask(() => {
      if (dead) return;
      setAccount(current);
      if (current) setName(current.name);
      if (!subscriber) return;
      setName(subscriber.name);
      setPhone(subscriber.phone);
      setTrade(subscriber.trade || TRADES[0]);
      setAddress(subscriber.address);
      setCity(subscriber.city);
      setVat(subscriber.vat);
      if (subscriber.vat) setSaved(true);
    });
    return () => {
      dead = true;
    };
  }, []);

  if (account === undefined) return null;

  if (!account) {
    return (
      <section className="mx-auto w-full max-w-lg px-1 py-6 text-[#1A2432]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#E56B10]">Profilo</p>
        <h1 className="mt-2 text-2xl font-semibold">Entra con un social</h1>
        <p className="mt-3 text-sm leading-relaxed text-[#2A3C54]">
          Google, Facebook o Apple. L&apos;artigiano completa la P.IVA dopo, qui dentro.
        </p>
        <Link
          href="/supermastro/iscrizione"
          className="mt-6 inline-flex h-12 items-center rounded-full bg-[#E56B10] px-5 text-sm font-semibold text-white"
        >
          Iscriviti
        </Link>
      </section>
    );
  }

  if (account.role === "privato") {
    return (
      <section className="mx-auto w-full max-w-lg px-1 py-6 text-[#1A2432]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#E56B10]">Profilo privato</p>
        <h1 className="mt-2 text-2xl font-semibold">{account.name}</h1>
        <p className="mt-2 text-sm text-[#2A3C54]">
          Accesso con {PROVIDER_LABEL[account.provider]}
          {account.email ? ` · ${account.email}` : ""}
        </p>
        <Link
          href="/supermastro/privato"
          className="mt-6 inline-flex h-12 items-center rounded-full bg-[#E56B10] px-5 text-sm font-semibold text-white"
        >
          Carta per acconto e saldo
        </Link>
      </section>
    );
  }

  if (saved) {
    return (
      <section className="mx-auto w-full max-w-lg px-1 py-6 text-[#1A2432]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#E56B10]">Profilo artigiano</p>
        <h1 className="mt-2 text-2xl font-semibold">{name}</h1>
        <p className="mt-2 text-sm text-[#2A3C54]">
          Accesso con {PROVIDER_LABEL[account.provider]}. Attività completa.
        </p>
        <dl className="mt-6 space-y-3 rounded-3xl bg-white p-5 text-sm shadow-sm">
          <Row label="P.IVA" value={vat} />
          <Row label="Mestiere" value={trade} />
          <Row label="Cellulare" value={phone} />
          <Row label="Sede" value={[address, city].filter(Boolean).join(", ")} />
        </dl>
        <button
          type="button"
          onClick={() => setSaved(false)}
          className="mt-5 text-sm font-semibold text-[#E56B10]"
        >
          Modifica i dati
        </button>
      </section>
    );
  }

  return (
    <form
      className="mx-auto w-full max-w-lg px-1 py-6 text-[#1A2432]"
      onSubmit={(event) => {
        event.preventDefault();
        const cleanName = name.trim();
        const cleanPhone = phone.trim();
        const cleanAddress = address.trim();
        const cleanCity = city.trim();
        const cleanVat = vat.replace(/\D/g, "");
        if (!cleanName || !cleanPhone || !cleanAddress || !cleanCity || !/^\d{11}$/.test(cleanVat)) {
          setError("Servono nome, cellulare, indirizzo, città e una P.IVA di 11 cifre.");
          return;
        }
        setError(null);
        saveSubscriber({
          name: cleanName,
          phone: cleanPhone,
          trade,
          address: cleanAddress,
          city: cleanCity,
          vat: cleanVat,
        });
        saveAccount({ ...account, name: cleanName });
        setAccount({ ...account, name: cleanName });
        setVat(cleanVat);
        setSaved(true);
      }}
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#E56B10]">Profilo artigiano</p>
      <h1 className="mt-2 text-2xl font-semibold">Completa l&apos;attività</h1>
      <p className="mt-2 text-sm leading-relaxed text-[#2A3C54]">
        Sei entrato con {PROVIDER_LABEL[account.provider]}. Qui restano P.IVA, mestiere e sede.
      </p>
      <div className="mt-5 space-y-3 rounded-3xl bg-white p-4 shadow-sm">
        <TextField label="Nome" value={name} onChange={setName} autoComplete="name" />
        <TextField
          label="P.IVA"
          value={vat}
          onChange={(value) => setVat(value.replace(/\D/g, "").slice(0, 11))}
          inputMode="numeric"
          autoComplete="off"
        />
        <label className="block text-sm font-medium">
          Mestiere
          <select
            value={trade}
            onChange={(event) => setTrade(event.target.value)}
            className="mt-1 h-12 w-full rounded-2xl border border-[#2A3C54]/15 bg-[#FBF8F3] px-3 text-sm"
          >
            {TRADES.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
        <TextField label="Cellulare" value={phone} onChange={setPhone} inputMode="tel" autoComplete="tel" />
        <TextField label="Indirizzo" value={address} onChange={setAddress} autoComplete="street-address" />
        <TextField label="Città" value={city} onChange={setCity} autoComplete="address-level2" />
      </div>
      {error && <p className="mt-3 text-sm text-[#E56B10]">{error}</p>}
      <button type="submit" className="mt-5 h-12 w-full rounded-full bg-[#E56B10] text-sm font-semibold text-white">
        Salva nel profilo
      </button>
    </form>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[#2A3C54]">{label}</dt>
      <dd className="font-semibold">{value}</dd>
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  inputMode,
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  inputMode?: "tel" | "numeric" | "text";
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
        className="mt-1 h-12 w-full rounded-2xl border border-[#2A3C54]/15 bg-[#FBF8F3] px-3 text-sm"
      />
    </label>
  );
}
