import { artisanTradeLabel } from "@/lib/sos/artisan-maps";

export type FaultQuery = {
  trade: string;
  summary: string;
  lat: number;
  lng: number;
};

function one(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

function coord(value: string, min: number, max: number): number | null {
  const n = Number(value);
  if (!Number.isFinite(n) || n < min || n > max) return null;
  return n;
}

export function readFaultQuery(params: {
  mestiere?: string | string[];
  lat?: string | string[];
  lng?: string | string[];
  guasto?: string | string[];
}): FaultQuery | null {
  const lat = coord(one(params.lat), -90, 90);
  const lng = coord(one(params.lng), -180, 180);
  if (lat == null || lng == null) return null;
  const trade = artisanTradeLabel(one(params.mestiere).trim() || "Artigiano");
  const summary = one(params.guasto).trim() || `Serve un ${trade.toLowerCase()}`;
  return { trade, summary, lat, lng };
}
