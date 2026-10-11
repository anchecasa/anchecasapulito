"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { IconArrow, IconClock, IconPin, IconShield, IconStar } from "@/components/phone/icons";
import { Mascot } from "@/components/supermastro/mascot";

const SLIDES = [
  {
    title: "Il tuo guasto,",
    accent: "la nostra priorità.",
    body: "Un video. Un artigiano in zona.",
  },
  {
    title: "Cinque secondi",
    accent: "di video.",
    body: "SuperMastro legge il problema di casa.",
  },
  {
    title: "Poi cerca",
    accent: "dal più vicino.",
    body: "Lo contatti in chat o su WhatsApp.",
  },
] as const;

const TRUST = [
  { label: "Sicuro", icon: IconShield },
  { label: "In zona", icon: IconClock },
  { label: "Valutato", icon: IconStar },
] as const;

export function WelcomeScreen() {
  const [slide, setSlide] = useState(0);
  const current = SLIDES[slide];

  return (
    <div className="flex min-h-full flex-col bg-[#FBF8F3] px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] text-[#1A2432]">
      <div className="flex items-center gap-2 pt-2">
        <span className="grid h-10 w-10 place-items-center overflow-hidden rounded-full bg-[#E56B10]">
          <Image src="/images/supermastro-icona.png" alt="" width={40} height={40} className="h-10 w-10 object-cover" />
        </span>
        <span className="text-xl font-extrabold tracking-tight">
          <span className="text-[#1A2432]">Super</span>
          <span className="text-[#E56B10]">Mastro</span>
        </span>
      </div>

      <div className="pt-8">
        <h1 className="max-w-[16rem] text-[2rem] font-semibold leading-[1.12] tracking-tight">
          {current.title}
          <span className="mt-1 block text-[#E56B10] underline decoration-[#E56B10] decoration-4 underline-offset-4">
            {current.accent}
          </span>
        </h1>
        <p className="mt-4 max-w-[16rem] text-sm leading-relaxed text-[#2A3C54]">{current.body}</p>
      </div>

      <div className="relative mt-2 min-h-[280px] flex-1">
        <span className="absolute right-6 top-6 text-[#E56B10]">
          <IconPin className="h-10 w-10" />
        </span>
        <div className="absolute -bottom-2 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full bg-[#E56B10]/15" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2">
          <Mascot pose="saluta" size={280} alt="" />
        </div>
      </div>

      <div className="relative z-10 mb-4 flex justify-center gap-2">
        {SLIDES.map((item, index) => (
          <button
            key={item.accent}
            type="button"
            aria-label={`Schermata ${index + 1}`}
            onClick={() => setSlide(index)}
            className={`h-2 rounded-full ${index === slide ? "w-6 bg-[#E56B10]" : "w-2 bg-[#2A3C54]/25"}`}
          />
        ))}
      </div>

      <div className="relative z-10 grid gap-3">
        <Link
          href="/m/accesso"
          className="flex h-14 items-center justify-center rounded-full bg-[#2A3C54] text-base font-semibold text-white"
        >
          Entra
        </Link>
        <Link
          href="/m/iscrizione"
          className="flex h-14 items-center justify-between rounded-full bg-[#E56B10] pl-6 pr-2 text-base font-semibold text-white shadow-[0_10px_28px_rgba(229,107,16,0.35)]"
        >
          Iscriviti
          <span className="grid h-10 w-10 place-items-center rounded-full bg-[#1A2432]">
            <IconArrow className="h-5 w-5" />
          </span>
        </Link>
      </div>

      <div className="relative z-10 mt-5 grid grid-cols-3 gap-2 pb-1">
        {TRUST.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="flex flex-col items-center gap-1 text-center">
              <Icon className="h-5 w-5 text-[#2A3C54]" />
              <span className="text-[11px] font-semibold text-[#2A3C54]">{item.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
