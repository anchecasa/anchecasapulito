"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { loadCliente, saveCliente } from "@/lib/sos/cliente";

const PERKS = [
  "Lo storico dei lavori resta tuo, con il nome di chi li ha fatti",
  "Paghi acconto e saldo nell'app, con la carta di credito",
  "Firmi il preventivo a schermo e accetti prima che parta il lavoro",
  "A fine lavoro lasci le stelle e fino a 5 foto",
];

type Props = {
  nextPath: string;
};

export function IscrizionePrivato({ nextPath }: Props) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [cardLast4, setCardLast4] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const existing = loadCliente();
    if (!existing) return;
    let dead = false;
    queueMicrotask(() => {
      if (dead) return;
      setName(existing.name);
      setPhone(existing.phone);
      setEmail(existing.email);
      setCardLast4(existing.cardLast4);
    });
    return () => {
      dead = true;
    };
  }, []);

  if (done) {
    return (
      <section className="mx-auto w-full max-w-5xl text-[#1A2432]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#E56B10]">Account</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Privato iscritto</h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-[#2A3C54]">
          {`${name}, acconto e saldo passano da SuperMastro sulla carta che finisce con ${cardLast4}. Lo storico tiene il lavoro, chi lo ha fatto e la recensione.`}
        </p>
        <button
          type="button"
          onClick={() => router.push(nextPath)}
          className="mt-8 inline-flex h-11 items-center rounded-xl bg-[#E56B10] px-5 text-sm font-semibold text-white"
        >
          Vai allo storico
        </button>
      </section>
    );
  }

  return (
    <form
      className="mx-auto grid w-full max-w-5xl gap-8 text-[#1A2432] lg:grid-cols-2 lg:items-start"
      onSubmit={(event) => {
        event.preventDefault();
        const cleanName = name.trim();
        const cleanPhone = phone.trim();
        const cleanEmail = email.trim();
        const cleanCard = cardLast4.trim();
        if (!cleanName || !cleanPhone || !/^\d{4}$/.test(cleanCard)) {
          setError("Servono nome, cellulare e le ultime 4 cifre della carta.");
          return;
        }
        setError(null);
        saveCliente({
          name: cleanName,
          phone: cleanPhone,
          email: cleanEmail,
          cardLast4: cleanCard,
        });
        setDone(true);
      }}
    >
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#E56B10]">Iscrizione</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Il privato entra in SuperMastro</h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-[#2A3C54]">
          L&apos;account tutela il pagamento. L&apos;acconto parte alla firma del preventivo, il saldo a lavoro finito, entrambi con carta.
        </p>
        <ul className="mt-6 space-y-3">
          {PERKS.map((perk) => (
            <li key={perk} className="flex gap-3 text-sm leading-snug text-[#1A2432]">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#E56B10]" />
              {perk}
            </li>
          ))}
        </ul>
      </div>

      <div className="min-w-0 rounded-2xl border border-[#2A3C54]/10 bg-white p-5 shadow-[0_12px_32px_rgba(26,36,50,0.06)]">
        <p className="text-sm font-semibold">Dati account</p>
        <div className="mt-4 space-y-3">
          <Field label="Nome" value={name} onChange={setName} autoComplete="name" />
          <Field label="Cellulare" value={phone} onChange={setPhone} inputMode="tel" autoComplete="tel" />
          <Field label="Email" value={email} onChange={setEmail} inputMode="email" autoComplete="email" />
          <Field
            label="Carta di credito, ultime 4 cifre"
            value={cardLast4}
            onChange={(value) => setCardLast4(value.replace(/\D/g, "").slice(0, 4))}
            inputMode="numeric"
            autoComplete="cc-number"
          />
        </div>
        {error && <p className="mt-3 text-sm text-[#E56B10]">{error}</p>}
        <p className="mt-3 text-xs leading-relaxed text-[#2A3C54]">
          SuperMastro addebita solo acconto e saldo. Il numero intero della carta non resta su questo dispositivo.
        </p>
        <button type="submit" className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-xl bg-[#E56B10] px-4 text-sm font-semibold text-white">
          Iscriviti e tutela il pagamento
        </button>
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
  inputMode?: "tel" | "text" | "email" | "numeric";
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
        required={label !== "Email"}
        className="mt-1 w-full rounded-xl border border-[#2A3C54]/15 bg-[#FBF8F3] px-3 py-2.5 text-sm"
      />
    </label>
  );
}
