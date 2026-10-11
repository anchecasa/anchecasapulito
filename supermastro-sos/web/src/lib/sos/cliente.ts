export type Cliente = {
  name: string;
  phone: string;
  email: string;
  cardLast4: string;
};

const KEY = "supermastro-privato";

export function saveCliente(cliente: Cliente): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(cliente));
}

export function loadCliente(): Cliente | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Cliente;
    if (!parsed.name || !/^\d{4}$/.test(parsed.cardLast4)) return null;
    return {
      name: parsed.name,
      phone: parsed.phone ?? "",
      email: parsed.email ?? "",
      cardLast4: parsed.cardLast4,
    };
  } catch {
    return null;
  }
}
