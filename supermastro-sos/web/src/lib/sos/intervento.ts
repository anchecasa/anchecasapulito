export type Intervento = {
  id: string;
  fault: string;
  trade: string;
  artisanName: string;
  description: string;
  totalEuro: number;
  depositEuro: number;
  arrivalTime: string;
  signature: string | null;
  signedAt: string | null;
  depositPaidAt: string | null;
  balancePaidAt: string | null;
  stars: number | null;
  review?: string | null;
  photos: string[];
  updatedAt: string;
};

export type ArtisanReview = {
  id: string;
  fault: string;
  stars: number;
  text: string;
};

export type ArtisanProfileReviews = {
  average: number | null;
  count: number;
  items: ArtisanReview[];
};

const KEY = "supermastro-interventi";
export const INTERVENTO_EVENT = "supermastro-interventi";

export function interventoId(artisanName: string, fault: string): string {
  return `${artisanName}|${fault}`.trim().toLowerCase();
}

export function loadInterventi(): Intervento[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as Intervento[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function findIntervento(id: string): Intervento | null {
  return loadInterventi().find((item) => item.id === id) ?? null;
}

export function reviewsForArtisan(name: string): ArtisanProfileReviews {
  const key = name.trim().toLowerCase();
  const items = loadInterventi()
    .filter((item) => item.artisanName.trim().toLowerCase() === key && (item.stars ?? 0) >= 1)
    .map((item) => ({
      id: item.id,
      fault: item.fault,
      stars: item.stars ?? 0,
      text: (item.review ?? "").trim(),
    }));
  if (items.length === 0) return { average: null, count: 0, items: [] };
  const average = items.reduce((sum, item) => sum + item.stars, 0) / items.length;
  return { average: Math.round(average * 10) / 10, count: items.length, items };
}

export function saveIntervento(item: Intervento): void {
  if (typeof window === "undefined") return;
  const next = loadInterventi().filter((current) => current.id !== item.id);
  next.unshift({ ...item, photos: item.photos.slice(0, 5), updatedAt: new Date().toISOString() });
  localStorage.setItem(KEY, JSON.stringify(next));
  window.dispatchEvent(new Event(INTERVENTO_EVENT));
}

export function euro(amount: number): string {
  return `${amount.toLocaleString("it-IT")} euro`;
}
