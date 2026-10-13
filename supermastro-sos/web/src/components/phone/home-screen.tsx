"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { IconBell, IconMenu, IconPin } from "@/components/phone/icons";
import { HomeEntry } from "@/components/supermastro/home-entry";
import { acquireDevicePosition } from "@/lib/sos/location";
import { loadPhonePos, savePhonePos, type PhonePos } from "@/lib/sos/phone-session";

function tradeQuery(trade: string) {
  return trade === "Tutti" ? "Idraulico" : trade;
}

function faultSummary(trade: string) {
  return trade === "Tutti" ? "Serve un artigiano in zona" : `Serve un ${trade.toLowerCase()} in zona`;
}

function ricercaHref(pos: PhonePos, trade: string) {
  const params = new URLSearchParams({
    mestiere: tradeQuery(trade),
    lat: pos.lat.toFixed(6),
    lng: pos.lng.toFixed(6),
    guasto: faultSummary(trade),
  });
  return `/m/ricerca?${params.toString()}`;
}

export function HomeScreen() {
  const [pos, setPos] = useState<PhonePos | null>(null);
  const [cap, setCap] = useState("");
  const [sheet, setSheet] = useState<"menu" | "luogo" | null>(null);
  const [placeNote, setPlaceNote] = useState<string | null>(null);

  useEffect(() => {
    const saved = loadPhonePos();
    let dead = false;
    let gotLive = false;
    if (saved) {
      queueMicrotask(() => {
        if (!dead && !gotLive) setPos(saved);
      });
    }

    acquireDevicePosition()
      .then(async (position) => {
        const res = await fetch(`/api/sos/citta?lat=${position.lat}&lng=${position.lng}`);
        const data = (await res.json().catch(() => null)) as { place?: string } | null;
        if (dead) return;
        gotLive = true;
        const next = {
          lat: position.lat,
          lng: position.lng,
          place: data?.place || "Posizione attuale",
        };
        savePhonePos(next);
        setPos(next);
        setPlaceNote(null);
      })
      .catch(() => {
        if (!dead && !saved) setPlaceNote("Inserisci il CAP. Su iPhone la posizione live chiede un collegamento sicuro.");
      });
    return () => {
      dead = true;
    };
  }, []);

  async function applyCap(event: React.FormEvent) {
    event.preventDefault();
    const clean = cap.replace(/\D/g, "");
    if (clean.length !== 5) {
      setPlaceNote("Il CAP italiano ha 5 cifre.");
      return;
    }
    setPlaceNote("Cerco il CAP");
    const res = await fetch(`/api/sos/cap?cap=${clean}`);
    const data = (await res.json().catch(() => null)) as { lat?: number; lng?: number; place?: string; error?: string } | null;
    if (!res.ok || data?.lat == null || data.lng == null) {
      setPlaceNote(data?.error || "CAP non trovato.");
      return;
    }
    const next = { lat: data.lat, lng: data.lng, place: data.place || `CAP ${clean}` };
    savePhonePos(next);
    setPos(next);
    setPlaceNote(null);
    setSheet(null);
  }

  const ricerca = pos ? ricercaHref(pos, "Idraulico") : null;

  return (
    <div className="min-h-full bg-[#FBF8F3] pb-6 text-[#1A2432]">
      <header className="flex items-center gap-3 px-4 pt-3">
        <button
          type="button"
          aria-label="Apri il menu"
          onClick={() => setSheet("menu")}
          className="grid h-11 w-11 place-items-center rounded-full bg-white text-[#1A2432] shadow-sm"
        >
          <IconMenu className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={() => setSheet("luogo")}
          className="mx-auto flex h-11 max-w-[220px] items-center gap-1 rounded-full bg-white px-3 text-sm font-semibold shadow-sm"
        >
          <IconPin className="h-4 w-4 shrink-0 text-[#E56B10]" />
          <span className="truncate">{pos?.place ?? "La tua zona"}</span>
        </button>
        <Link
          href="/m/interventi"
          aria-label="Interventi"
          className="grid h-11 w-11 place-items-center rounded-full bg-white text-[#1A2432] shadow-sm"
        >
          <IconBell className="h-5 w-5" />
        </Link>
      </header>

      {sheet && (
        <div className="mx-4 mt-4 rounded-[28px] bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <p className="font-semibold">{sheet === "menu" ? "Menu" : "Zona del guasto"}</p>
            <button type="button" onClick={() => setSheet(null)} className="text-sm font-semibold text-[#E56B10]">
              Chiudi
            </button>
          </div>
          {sheet === "menu" ? (
            <div className="grid gap-2">
              <Link href="/m/video" className="rounded-2xl bg-[#FBF8F3] px-4 py-3 text-sm font-semibold">
                Fai il video
              </Link>
              {ricerca ? (
                <Link href={ricerca} className="rounded-2xl bg-[#FBF8F3] px-4 py-3 text-sm font-semibold">
                  Cerca in zona
                </Link>
              ) : (
                <button type="button" onClick={() => setSheet("luogo")} className="rounded-2xl bg-[#FBF8F3] px-4 py-3 text-left text-sm font-semibold">
                  Inserisci il CAP e cerca
                </button>
              )}
              <Link href="/m/iscrizione" className="rounded-2xl bg-[#FBF8F3] px-4 py-3 text-sm font-semibold">
                Iscrizione privato
              </Link>
              <Link href="/m/artigiano" className="rounded-2xl bg-[#FBF8F3] px-4 py-3 text-sm font-semibold">
                Iscrizione artigiano
              </Link>
            </div>
          ) : (
            <form onSubmit={applyCap} className="grid gap-3">
              <p className="text-sm text-[#2A3C54]">
                {placeNote || "Il CAP centra la ricerca. Se il telefono concede la posizione, la uso da sola."}
              </p>
              <input
                value={cap}
                onChange={(event) => setCap(event.target.value)}
                inputMode="numeric"
                autoComplete="postal-code"
                placeholder="CAP, 5 cifre"
                className="h-12 rounded-2xl border border-[#2A3C54]/15 bg-[#FBF8F3] px-4 text-base outline-none"
              />
              <button type="submit" className="h-12 rounded-full bg-[#E56B10] text-sm font-semibold text-white">
                Usa questo CAP
              </button>
            </form>
          )}
        </div>
      )}

      <div className="px-4 pt-5">
        <HomeEntry base="/m" />
      </div>
    </div>
  );
}
