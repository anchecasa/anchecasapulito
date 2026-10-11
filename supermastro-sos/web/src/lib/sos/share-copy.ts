export const ASK_LABEL = {
  altro_video: "Un altro video",
  foto_vicino: "Una foto da vicino",
  misure: "Le misure",
  marca_modello: "Marca o modello",
  domanda: "Una domanda",
} as const;

export type AskKind = keyof typeof ASK_LABEL;
export type ShareReply = "posso_venire" | "info" | "non_posso";

export type ChiediItem = {
  id: string;
  tipo: AskKind;
  messaggio: string;
  risposta_testo: string;
  risposta_path: string;
  created_at: string;
};

/** Domanda dell'artigiano con la risposta del privato, come la vede l'artigiano (URL firmati brevi). */
export type PublicAnswer = {
  id: string;
  tipo: AskKind;
  messaggio: string;
  risposta_testo: string;
  file: { url: string; kind: "video" | "foto" } | null;
};

/** Stato di una richiesta visto dal privato: dell'attività solo il nome pubblico. */
export type RequestShare = {
  id: string;
  nome: string;
  createdAt: string;
  risposta: ShareReply | null;
  accettato: boolean;
  chiedi: { id: string; tipo: AskKind; messaggio: string; risposto: boolean; risposta_testo: string }[];
};

export function shareMessage(input: { titolo: string; zona: string; distanza: string; url: string }) {
  return ["SuperMastro", "Richiesta di lavoro.", input.titolo, `Zona: ${input.zona}. Distanza: ${input.distanza}.`, input.url].join(
    "\n",
  );
}

export function minutesLabel(iso: string) {
  const minutes = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (minutes < 1) return "inviata adesso";
  if (minutes === 1) return "inviata 1 minuto fa";
  return `inviata ${minutes} minuti fa`;
}

/**
 * Numero in formato internazionale (+39…). I fissi italiani tengono lo 0
 * (06…, 02…); i cellulari iniziano con 3. Vuoto se il numero non è valido.
 */
export function toE164(phone: string) {
  const raw = phone.trim();
  let digits = raw.replace(/\D/g, "");
  if (raw.startsWith("+") || digits.startsWith("00")) {
    if (!raw.startsWith("+")) digits = digits.slice(2);
    return digits.length >= 8 && digits.length <= 15 ? `+${digits}` : "";
  }
  if (digits.startsWith("39") && digits.length >= 11 && digits.length <= 13) return `+${digits}`;
  if (/^[03]/.test(digits) && digits.length >= 6 && digits.length <= 11) return `+39${digits}`;
  return "";
}

/** Chiave per confrontare i numeri (opt-out, lead). */
export function normalizePhone(phone: string | null | undefined) {
  return phone ? toE164(phone) : "";
}

export const REPLY_LABEL: Record<ShareReply, string> = {
  posso_venire: "Può venire",
  info: "Gli serve un'informazione",
  non_posso: "Non può",
};
