export type AccountRole = "privato" | "artigiano";
export type SocialProvider = "google" | "facebook" | "apple" | "email";

export type Account = {
  role: AccountRole;
  name: string;
  email: string;
  provider: SocialProvider;
};

const KEY = "supermastro-account";

export function saveAccount(account: Account): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(account));
}

export function loadAccount(): Account | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Account;
    if (parsed.role !== "privato" && parsed.role !== "artigiano") return null;
    if (!parsed.name || !parsed.provider) return null;
    return {
      role: parsed.role,
      name: parsed.name,
      email: parsed.email ?? "",
      provider: parsed.provider,
    };
  } catch {
    return null;
  }
}
