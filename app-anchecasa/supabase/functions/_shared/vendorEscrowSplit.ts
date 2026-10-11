/** Split escrow amount_product / amount_service (Edge mirror). */

export type EscrowLineInput = {
  option_type?: string;
  qty?: number;
  total_eur?: number | null;
  product_unit_eur?: number | null;
  service_unit_eur?: number | null;
};

export type EscrowSplit = {
  amount_product: number;
  amount_service: number;
  amount_total: number;
};

function money(n: number): number {
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.round(n * 100) / 100;
}

export function splitEscrowLine(line: EscrowLineInput): EscrowSplit {
  const qty = Math.max(1, Math.floor(Number(line.qty) || 1));
  const total = money(Number(line.total_eur) || 0);
  const option = String(line.option_type || "product").toLowerCase();

  if (option !== "install") {
    const amount_product = total > 0 ? total : money((Number(line.product_unit_eur) || 0) * qty);
    return { amount_product, amount_service: 0, amount_total: amount_product };
  }

  const explicitProduct = line.product_unit_eur != null ? money(Number(line.product_unit_eur) * qty) : null;
  const explicitService = line.service_unit_eur != null ? money(Number(line.service_unit_eur) * qty) : null;

  if (explicitProduct != null && explicitService != null) {
    return {
      amount_product: explicitProduct,
      amount_service: explicitService,
      amount_total: money(explicitProduct + explicitService),
    };
  }
  if (explicitProduct != null && total > 0) {
    const amount_product = Math.min(explicitProduct, total);
    return { amount_product, amount_service: money(total - amount_product), amount_total: total };
  }
  if (explicitService != null && total > 0) {
    const amount_service = Math.min(explicitService, total);
    return { amount_product: money(total - amount_service), amount_service, amount_total: total };
  }
  if (total <= 0) return { amount_product: 0, amount_service: 0, amount_total: 0 };

  const amount_product = money(total * 0.7);
  const amount_service = money(total - amount_product);
  return { amount_product, amount_service, amount_total: total };
}

export function sumEscrowSplits(lines: EscrowSplit[]): EscrowSplit {
  return lines.reduce(
    (acc, s) => ({
      amount_product: money(acc.amount_product + s.amount_product),
      amount_service: money(acc.amount_service + s.amount_service),
      amount_total: money(acc.amount_total + s.amount_total),
    }),
    { amount_product: 0, amount_service: 0, amount_total: 0 },
  );
}

export function canNotifyArtisanPlanning(shippingStato: string | null | undefined): boolean {
  const s = String(shippingStato || "").toUpperCase();
  return s === "SPEDITO" || s === "IN_CONSEGNA" || s === "SHIPPED" || s === "CONSEGNATO";
}

export function generateOrderOtp4(): string {
  const n = crypto.getRandomValues(new Uint32Array(1))[0] % 10000;
  return String(n).padStart(4, "0");
}

/** OTP 4–6 cifre (default 4). */
export function generateOrderOtp(digits = 4): string {
  const d = Math.min(6, Math.max(4, Math.floor(digits) || 4));
  const mod = 10 ** d;
  const n = crypto.getRandomValues(new Uint32Array(1))[0] % mod;
  return String(n).padStart(d, "0");
}

export function isValidOtp4(code: string | null | undefined): boolean {
  return /^\d{4}$/.test(String(code || "").trim());
}

export function isValidOtpCode(code: string | null | undefined): boolean {
  return /^\d{4,6}$/.test(String(code || "").trim());
}

export async function hashOtp(code: string, salt = "anchecasa-otp-v1"): Promise<string> {
  const data = new TextEncoder().encode(`${salt}:${String(code).trim()}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}
