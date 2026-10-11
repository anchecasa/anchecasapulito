"use client";

import { useEffect, useState } from "react";

type Message = {
  id: string;
  from: "app" | "cliente" | "artigiano";
  text: string;
};

type Props = {
  nome: string;
  distanza: string;
  guasto: string;
  mestiere: string;
  contained?: boolean;
  preventivoBase?: string;
};

export function ArtisanChat({
  nome,
  distanza,
  guasto,
  mestiere,
  contained = false,
  preventivoBase = "/supermastro/preventivo",
}: Props) {
  const storageKey = `supermastro-chat:${nome}:${guasto}`;
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    const opening: Message = {
      id: "apertura",
      from: "app",
      text: `SuperMastro\nProblema: ${guasto}\nDistanza: ${distanza}`,
    };
    const raw = sessionStorage.getItem(storageKey);
    let next = [opening];
    if (raw) {
      try {
        const saved = JSON.parse(raw) as Message[];
        if (saved.length > 0) next = saved;
      } catch {
        next = [opening];
      }
    }
    let dead = false;
    queueMicrotask(() => {
      if (!dead) setMessages(next);
    });
    return () => {
      dead = true;
    };
  }, [storageKey, guasto, distanza]);

  useEffect(() => {
    if (messages.length === 0) return;
    sessionStorage.setItem(storageKey, JSON.stringify(messages));
  }, [messages, storageKey]);

  function send(from: "cliente" | "artigiano") {
    const text = draft.trim();
    if (!text) return;
    setMessages((current) => [...current, { id: crypto.randomUUID(), from, text }]);
    setDraft("");
  }

  return (
    <section
      className={`mx-auto flex w-full max-w-lg flex-col bg-[#FBF8F3] text-[#1A2432] ${contained ? "h-full" : "h-[calc(100dvh-66px)]"}`}
    >
      <header className="border-b border-[#2A3C54]/10 px-4 py-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#E56B10]">{mestiere}</p>
        <h1 className="text-lg font-semibold">{nome}</h1>
        <p className="text-sm text-[#2A3C54]">{distanza}</p>
        <a
          href={`${preventivoBase}?nome=${encodeURIComponent(nome)}&mestiere=${encodeURIComponent(mestiere)}&guasto=${encodeURIComponent(guasto)}`}
          className="mt-2 inline-flex rounded-full bg-[#E56B10] px-3 py-1.5 text-xs font-semibold text-white"
        >
          Modulo preventivo
        </a>
      </header>
      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-4 py-4">
        {messages.map((message) => (
          <p
            key={message.id}
            className={`max-w-[85%] whitespace-pre-line rounded-2xl px-3 py-2 text-sm leading-snug ${
              message.from === "cliente"
                ? "ml-auto bg-[#E56B10] text-white"
                : message.from === "artigiano"
                  ? "bg-[#2A3C54] text-[#FBF8F3]"
                  : "bg-white text-[#1A2432] shadow-sm"
            }`}
          >
            {message.text}
          </p>
        ))}
      </div>
      <form
        className="flex gap-2 border-t border-[#2A3C54]/10 px-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
        onSubmit={(event) => {
          event.preventDefault();
          send("cliente");
        }}
      >
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Scrivi al professionista"
          className="min-w-0 flex-1 rounded-full border border-[#2A3C54]/15 bg-white px-4 py-3 text-base"
        />
        <button type="submit" className="rounded-full bg-[#2A3C54] px-4 text-sm font-semibold text-[#FBF8F3]">
          Invia
        </button>
      </form>
    </section>
  );
}
