export type SubscriberPlan = "base" | "pro";

export const PRO_PRICE_EUR = 19;

export type Subscriber = {
  name: string;
  phone: string;
  trade: string;
  address: string;
  city: string;
  vat: string;
  plan?: SubscriberPlan;
};

const KEY = "supermastro-abbonato";

export function saveSubscriber(subscriber: Subscriber): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(subscriber));
}

export function loadSubscriber(): Subscriber | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Subscriber;
    if (!parsed.name || !parsed.phone || !parsed.trade) return null;
    return {
      name: parsed.name,
      phone: parsed.phone,
      trade: parsed.trade,
      address: parsed.address ?? "",
      city: parsed.city ?? "",
      vat: parsed.vat ?? "",
    };
  } catch {
    return null;
  }
}
