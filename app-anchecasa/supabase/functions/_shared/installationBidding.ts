/** Dynamic bidding helpers (Edge mirror). */

export type BidOfferInput = {
  id: string;
  raw_price: number;
  final_price: number;
  available_date: string;
  rating_snapshot?: number | null;
  status?: string;
};

export type ClientOfferSlot = "fastest" | "cheapest" | "best_rated";

export type RankedClientOffer = BidOfferInput & {
  slot: ClientOfferSlot;
  label: string;
};

export function money2(n: number): number {
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.round(n * 100) / 100;
}

export function computeBidFinalPrice(
  rawPrice: number,
  marginPercentage = 0.2,
  marginFixed = 0,
): { margin_applied: number; final_price: number } {
  const raw = money2(rawPrice);
  const pct = Number.isFinite(marginPercentage) ? Math.max(0, marginPercentage) : 0.2;
  const fixed = money2(marginFixed);
  const margin_applied = money2(raw * pct + fixed);
  return { margin_applied, final_price: money2(raw + margin_applied) };
}

export function selectTopClientOffers(
  bids: BidOfferInput[],
  limit = 3,
): RankedClientOffer[] {
  const pending = bids.filter((b) => !b.status || b.status === "PENDING");
  if (!pending.length) return [];

  const byDate = [...pending].sort((a, b) => {
    const da = a.available_date.localeCompare(b.available_date);
    if (da !== 0) return da;
    return a.final_price - b.final_price;
  });
  const byPrice = [...pending].sort((a, b) => {
    const dp = a.final_price - b.final_price;
    if (dp !== 0) return dp;
    return a.available_date.localeCompare(b.available_date);
  });
  const byValue = [...pending].sort((a, b) => {
    const ra = Number(a.rating_snapshot) || 0;
    const rb = Number(b.rating_snapshot) || 0;
    const va = ra / Math.max(1, a.final_price);
    const vb = rb / Math.max(1, b.final_price);
    if (vb !== va) return vb - va;
    if (rb !== ra) return rb - ra;
    return a.final_price - b.final_price;
  });

  const slots: Array<{ slot: ClientOfferSlot; label: string; list: BidOfferInput[] }> = [
    { slot: "fastest", label: "La più Veloce", list: byDate },
    { slot: "best_rated", label: "Miglior rapporto Q/P", list: byValue },
    { slot: "cheapest", label: "La più Economica", list: byPrice },
  ];

  const used = new Set<string>();
  const out: RankedClientOffer[] = [];
  for (const s of slots) {
    const pick = s.list.find((p) => !used.has(p.id));
    if (!pick) continue;
    used.add(pick.id);
    out.push({ ...pick, slot: s.slot, label: s.label });
    if (out.length >= limit) break;
  }
  return out;
}

export function shippingDeadlineBeforeInstall(availableDateIso: string): string {
  const d = new Date(`${availableDateIso}T12:00:00Z`);
  if (Number.isNaN(d.getTime())) return availableDateIso;
  let left = 2;
  while (left > 0) {
    d.setUTCDate(d.getUTCDate() - 1);
    const wd = d.getUTCDay();
    if (wd !== 0 && wd !== 6) left--;
  }
  return d.toISOString().slice(0, 10);
}

export function randomToken(bytes = 24): string {
  const buf = crypto.getRandomValues(new Uint8Array(bytes));
  return Array.from(buf, (b) => b.toString(16).padStart(2, "0")).join("");
}
