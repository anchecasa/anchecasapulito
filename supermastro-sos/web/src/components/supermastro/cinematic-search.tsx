"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArtisanPinMap } from "@/components/supermastro/artisan-pin-map";
import { Mascot } from "@/components/supermastro/mascot";
import { isSosDemoMode } from "@/lib/sos/demo";
import { reviewsForArtisan, type ArtisanProfileReviews } from "@/lib/sos/intervento";
import { formatArtisanDistance, type NearbyArtisan } from "@/lib/sos/search-artisans";
import { loadSubscriber } from "@/lib/sos/subscriber";

type ShownArtisan = NearbyArtisan & {
  network: boolean;
  tradeLabel: string;
  reviews: ArtisanProfileReviews | null;
};

type Props = {
  trade: string;
  summary: string;
  lat: number;
  lng: number;
  network: NearbyArtisan[];
  artisans: NearbyArtisan[];
  flowBase?: string;
  diagnosisId?: string;
  contained?: boolean;
};

export function CinematicSearch({
  trade,
  summary,
  lat,
  lng,
  network,
  artisans,
  flowBase = "/supermastro",
  diagnosisId = "",
  contained = false,
}: Props) {
  const [shown, setShown] = useState<ShownArtisan[]>([]);
  const [visible, setVisible] = useState(0);
  const [ready, setReady] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const emptyNetwork = network.length === 0;
  const tradeWord = trade.toLowerCase();

  useEffect(() => {
    const level1: ShownArtisan[] = network.map((artisan) => ({
      ...artisan,
      network: true,
      tradeLabel: trade,
      reviews: null,
    }));
    const level2: ShownArtisan[] = artisans.map((artisan) => ({
      ...artisan,
      network: false,
      tradeLabel: trade,
      reviews: null,
    }));

    if (isSosDemoMode()) {
      const subscriber = loadSubscriber();
      const tradeKey = trade.toLowerCase().slice(0, 5);
      if (subscriber && subscriber.trade.toLowerCase().includes(tradeKey)) {
        level2.unshift({
          id: "abbonato-demo",
          name: subscriber.name,
          address: [subscriber.address, subscriber.city].filter(Boolean).join(", ") || "In zona",
          lat: lat + 0.003,
          lng: lng + 0.002,
          distanceKm: 0.35,
          mapsUrl: "",
          phone: subscriber.phone,
          phoneHref: subscriber.phone ? `tel:${subscriber.phone.replace(/[^\d+]/g, "")}` : null,
          network: false,
          tradeLabel: subscriber.trade,
          reviews: reviewsForArtisan(subscriber.name),
        });
      }
    }

    const ordered = [
      ...level1.sort((a, b) => a.distanceKm - b.distanceKm),
      ...level2.sort((a, b) => a.distanceKm - b.distanceKm).slice(0, 5),
    ];
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const showAll = reduce || ordered.length === 0;
    let dead = false;
    queueMicrotask(() => {
      if (dead) return;
      setShown(ordered);
      setReady(true);
      setVisible(showAll ? ordered.length : 0);
    });
    if (showAll) {
      return () => {
        dead = true;
      };
    }
    const timer = window.setInterval(() => {
      setVisible((count) => {
        if (count >= ordered.length) {
          window.clearInterval(timer);
          return count;
        }
        return count + 1;
      });
    }, 900);
    return () => {
      dead = true;
      window.clearInterval(timer);
    };
  }, [artisans, lat, lng, network, trade]);

  const revealed = shown.slice(0, visible);

  function copyPhone(id: string, phone: string) {
    const done = () => {
      setCopiedId(id);
      window.setTimeout(() => setCopiedId((current) => (current === id ? null : current)), 2000);
    };
    if (!navigator.clipboard?.writeText) return;
    void navigator.clipboard.writeText(phone).then(done).catch(() => undefined);
  }

  return (
    <section
      className={`flex min-h-0 flex-col bg-[#FBF8F3] text-[#1A2432] ${contained ? "h-full" : "h-[calc(100dvh-66px)]"}`}
    >
      <div className="relative h-[46%] min-h-0 overflow-hidden bg-[#F4F1EA]">
        <ArtisanPinMap lat={lat} lng={lng} artisans={revealed} />
        <div className="pointer-events-none absolute left-3 right-3 top-3 z-30 rounded-2xl bg-[#FBF8F3]/95 px-3 py-2 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#E56B10]">
            {visible < shown.length ? "Cerco dal più vicino" : "Professionisti in zona"}
          </p>
          <p className="truncate text-sm font-semibold">{summary}</p>
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-3 py-3">
        {emptyNetwork && (
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <Mascot
              pose="viso"
              size={72}
              alt=""
              speech={`Ancora nessun ${tradeWord} della rete qui. Ne conosci uno bravo? Invitalo`}
            />
            <Link
              href={`${flowBase}/iscrizione?ruolo=artigiano`}
              className="mt-3 inline-flex min-h-11 items-center text-base font-semibold text-[#B4500B] underline"
            >
              Invitalo
            </Link>
          </div>
        )}
        {!ready && <p className="px-1 text-sm text-[#2A3C54]">Apro la mappa e cerco, dal più vicino.</p>}
        {ready && shown.length === 0 && (
          <p className="px-1 text-sm text-[#2A3C54]">Nessuna altra attività in zona.</p>
        )}
        {revealed.map((artisan) => {
          const distance = formatArtisanDistance(artisan.distanceKm);
          return (
            <article key={artisan.id} className="rounded-2xl border border-[#2A3C54]/10 bg-white px-3 py-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold leading-snug">{artisan.name}</p>
                  <p className="mt-1 text-sm leading-snug text-[#1A2432]/70">{artisan.address}</p>
                  <p className="mt-1 text-sm text-[#1A2432]/70">{distance}</p>
                </div>
                {artisan.network ? (
                  <span className="shrink-0 rounded-full bg-[#14485B] px-2.5 py-1 text-sm font-semibold text-white">
                    Verificato
                  </span>
                ) : (
                  <span className="max-w-[9.5rem] text-right text-sm font-semibold leading-snug text-[#2A3C54]">
                    Non iscritto ad AncheCasa
                  </span>
                )}
              </div>
              {artisan.reviews && <ReviewBlock reviews={artisan.reviews} />}
              {artisan.network ? (
                <div className="mt-3">
                  {/* Il flusso reale (richiesta SOS) invia la richiesta agli artigiani verificati vicini:
                      non può scegliere un solo artigiano. Il testo lo dice in modo onesto. */}
                  <Link
                    href={networkRequestHref(artisan.id, trade)}
                    className="inline-flex min-h-11 items-center rounded-full bg-[#1A2432] px-4 text-base font-semibold text-[#FBF8F3]"
                  >
                    Chiedi a AncheCasa di contattarlo
                  </Link>
                  <p className="mt-2 text-sm leading-snug text-[#2A3C54]">
                    Mandiamo la richiesta agli artigiani verificati vicini, anche a lui.
                  </p>
                </div>
              ) : (
                <div className="mt-3 flex flex-col gap-2">
                  {artisan.leadToken && artisan.phone ? (
                    <Link
                      href={mandagliHref(flowBase, artisan, summary, lat, lng, diagnosisId)}
                      className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#B4500B] px-4 text-base font-semibold text-white"
                    >
                      Mandagli il video
                    </Link>
                  ) : null}
                  {artisan.phone ? (
                    <div className="rounded-2xl bg-[#FBF8F3] px-3 py-3">
                      <p className="select-all text-base font-semibold">{artisan.phone}</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <a
                          href={artisan.phoneHref || `tel:${artisan.phone.replace(/[^\d+]/g, "")}`}
                          className="inline-flex min-h-11 items-center justify-center rounded-full border-2 border-[#1A2432] px-4 text-base font-semibold text-[#1A2432]"
                        >
                          Chiama
                        </a>
                        <button
                          type="button"
                          className="inline-flex min-h-11 items-center justify-center rounded-full border-2 border-[#1A2432] px-4 text-base font-semibold text-[#1A2432]"
                          onClick={() => copyPhone(artisan.id, artisan.phone || "")}
                        >
                          {copiedId === artisan.id ? "Numero copiato" : "Copia il numero"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-[#2A3C54]">Numero non pubblicato</p>
                  )}
                  {artisan.mapsUrl ? (
                    <a
                      href={artisan.mapsUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex min-h-11 items-center justify-center rounded-full border-2 border-[#1A2432] px-4 text-base font-semibold text-[#1A2432]"
                    >
                      Indicazioni
                    </a>
                  ) : null}
                  <Link
                    href={`${flowBase}/iscrizione?ruolo=artigiano`}
                    className="inline-flex min-h-11 items-center text-base font-semibold text-[#B4500B] underline"
                  >
                    Sei tu? Prendi questa scheda
                  </Link>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}

/** La richiesta reale passa dal flusso SOS esistente (login + matching con gli iscritti). */
function networkRequestHref(workerId: string, trade: string) {
  const query = new URLSearchParams({ worker: workerId, mestiere: trade });
  return `/supermastro/nuova?${query}`;
}

/** Nome, telefono e posizione viaggiano solo dentro il gettone firmato dal server. */
function mandagliHref(
  flowBase: string,
  artisan: ShownArtisan,
  summary: string,
  lat: number,
  lng: number,
  diagnosisId: string,
) {
  const query = new URLSearchParams({
    t: artisan.leadToken ?? "",
    guasto: summary,
    mestiere: artisan.tradeLabel,
    lat: lat.toFixed(6),
    lng: lng.toFixed(6),
  });
  if (diagnosisId) query.set("id", diagnosisId);
  return `${flowBase}/mandagli?${query}`;
}

function ReviewBlock({ reviews }: { reviews: ArtisanProfileReviews }) {
  if (reviews.average == null) {
    return <p className="mt-3 text-sm text-[#2A3C54]">Ancora nessuna recensione.</p>;
  }

  const score = reviews.average.toFixed(1).replace(".", ",");
  const countLabel = reviews.count === 1 ? "1 recensione" : `${reviews.count} recensioni`;

  return (
    <div className="mt-3">
      <p className="flex flex-wrap items-center gap-2 text-sm">
        <StarMarks value={reviews.average} />
        <span className="font-semibold">{score}</span>
        <span className="text-[#2A3C54]">{countLabel}</span>
      </p>
      <ul className="mt-2 space-y-2">
        {reviews.items.slice(0, 3).map((item) => (
          <li key={item.id} className="rounded-xl bg-[#FBF8F3] px-3 py-2">
            <p className="text-xs font-semibold text-[#E56B10]">{item.stars} stelle</p>
            <p className="text-sm font-medium">{item.fault}</p>
            {item.text ? <p className="mt-1 text-sm leading-snug text-[#2A3C54]">{item.text}</p> : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

function StarMarks({ value }: { value: number }) {
  return (
    <span className="tracking-tight" aria-label={`${value} stelle su 5`}>
      {[1, 2, 3, 4, 5].map((mark) => (
        <span
          key={mark}
          className={mark <= value ? "text-[#E56B10]" : mark - 0.5 <= value ? "text-[#E56B10]/45" : "text-[#2A3C54]/25"}
        >
          ★
        </span>
      ))}
    </span>
  );
}
