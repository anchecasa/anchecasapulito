export type PhoneRole = "privato" | "artigiano";
export type PhoneProvider = "google" | "facebook" | "apple" | "email";

export type PhoneSession = {
  name: string;
  email: string;
  remember: boolean;
  role: PhoneRole;
  provider: PhoneProvider;
};

export type PhonePos = {
  lat: number;
  lng: number;
  place: string;
};

const SESSION_KEY = "sm-phone-session";
const POS_KEY = "sm-phone-pos";

export function loadPhoneSession(): PhoneSession | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(SESSION_KEY) || sessionStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    const data = JSON.parse(raw) as PhoneSession;
    if (!data.name) return null;
    const provider = data.provider ?? "email";
    return {
      name: data.name,
      email: data.email ?? "",
      remember: Boolean(data.remember),
      role: data.role === "artigiano" ? "artigiano" : "privato",
      provider: provider === "google" || provider === "facebook" || provider === "apple" ? provider : "email",
    };
  } catch {
    return null;
  }
}

export function savePhoneSession(session: PhoneSession) {
  const raw = JSON.stringify(session);
  if (session.remember) {
    localStorage.setItem(SESSION_KEY, raw);
    sessionStorage.removeItem(SESSION_KEY);
    return;
  }
  sessionStorage.setItem(SESSION_KEY, raw);
  localStorage.removeItem(SESSION_KEY);
}

export function loadPhonePos(): PhonePos | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(POS_KEY);
  if (!raw) return null;
  try {
    const data = JSON.parse(raw) as PhonePos;
    if (!Number.isFinite(data.lat) || !Number.isFinite(data.lng)) return null;
    return data;
  } catch {
    return null;
  }
}

export function savePhonePos(pos: PhonePos) {
  sessionStorage.setItem(POS_KEY, JSON.stringify(pos));
}
