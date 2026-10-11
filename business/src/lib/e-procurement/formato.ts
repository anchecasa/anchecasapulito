const euro = new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR", maximumFractionDigits: 2 });
const dataOra = new Intl.DateTimeFormat("it-IT", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Rome",
});

export const formatoEuro = (n: number | null | undefined) => (n == null ? "—" : euro.format(Number(n)));
export const formatoData = (iso: string | null | undefined) => (iso ? dataOra.format(new Date(iso)) : "—");
export const formatoByte = (n: number) =>
  n < 1024 * 1024 ? `${Math.max(1, Math.ceil(n / 1024))} KB` : `${(n / 1024 / 1024).toFixed(1)} MB`;

/** Valore per <input type="datetime-local"> nel fuso del browser */
export function valoreDataLocale(d: Date) {
  const c = new Date(d);
  c.setMinutes(c.getMinutes() - c.getTimezoneOffset());
  return c.toISOString().slice(0, 16);
}

const EVENTI: Record<string, string> = {
  creata: "Bozza creata",
  bozza_modificata: "Bozza modificata",
  stato_pubblicata: "Gara pubblicata",
  stato_chiusa: "Gara chiusa · buste aperte",
  stato_aggiudicata: "Gara aggiudicata",
  stato_annullata: "Gara annullata",
  scadenza_prorogata: "Scadenza prorogata",
  fornitore_invitato: "Fornitore invitato",
  fornitore_partecipa: "Fornitore partecipa (gara aperta)",
  invito_tolto: "Invito tolto",
  invito_visto: "Invito visto",
  invito_rinuncia: "Il fornitore ha rinunciato",
  invito_offerta: "Offerta presentata",
  documento_caricato: "Documento caricato",
  documento_verificato: "Documento verificato da AncheBIM",
  documento_avvisi: "Documento letto con avvisi",
  documento_respinto: "Documento respinto",
  documento_in_verifica: "Documento in verifica",
  documento_tolto: "Documento tolto",
  offerta_ricevuta: "Offerta ricevuta",
  offerta_aggiornata: "Offerta aggiornata",
};

export const nomeEvento = (e: string) => EVENTI[e] ?? e;

/** Ora corrente (le pagine sono dinamiche: ogni richiesta la rilegge). */
export function adesso() {
  return Date.now();
}

export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
