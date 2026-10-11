/**
 * DDT / riepilogo ordine drop-ship magazzino Vendor (pdf-lib).
 */
import { PDFDocument, StandardFonts, rgb } from "https://esm.sh/pdf-lib@1.17.1";

export type VendorDdtInput = {
  orderId: string;
  createdAt: string;
  vendorNome: string;
  shipFromIndirizzo: string;
  shipFromCitta: string;
  shipFromCap: string;
  productTitolo: string;
  productSku: string | null;
  qty: number;
  optionType: string;
  destinazioneTipo: string;
  destinazioneIndirizzo: string;
  destinazioneCitta: string;
  destinazioneCap: string;
  destinazioneLabel: string;
  clienteNome: string | null;
  clienteTelefono: string | null;
  artisanCategoria: string | null;
  artisanDataIndicativa: string | null;
  note: string | null;
};

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

export async function buildVendorOrderDdtPdf(data: VendorDdtInput): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const page = pdf.addPage([595, 842]);
  const { width, height } = page.getSize();
  const M = 48;
  let y = height - M;
  const navy = rgb(0.04, 0.12, 0.23);
  const orange = rgb(1, 0.48, 0);
  const slate = rgb(0.2, 0.25, 0.3);

  const line = (text: string, opts?: { bold?: boolean; size?: number; color?: ReturnType<typeof rgb> }) => {
    page.drawText(text.slice(0, 110), {
      x: M,
      y,
      size: opts?.size ?? 10,
      font: opts?.bold ? fontBold : font,
      color: opts?.color ?? slate,
    });
    y -= (opts?.size ?? 10) + 6;
  };

  page.drawRectangle({ x: 0, y: height - 72, width, height: 72, color: navy });
  page.drawText("AncheCasa — DDT / Riepilogo spedizione", {
    x: M,
    y: height - 36,
    size: 14,
    font: fontBold,
    color: rgb(1, 1, 1),
  });
  page.drawText("Drop-shipping · Magazzino Partner (VENDOR)", {
    x: M,
    y: height - 54,
    size: 9,
    font,
    color: orange,
  });
  y = height - 96;

  line(`Documento ordine: ${data.orderId.slice(0, 8).toUpperCase()}`, { bold: true, size: 12, color: navy });
  line(`Data ordine: ${fmtDate(data.createdAt)}`);
  line(`Modalità: DROP_SHIP_VENDOR_WAREHOUSE`, { color: orange });
  y -= 6;

  line("1. Magazzino di partenza (Vendor)", { bold: true, size: 11, color: navy });
  line(data.vendorNome, { bold: true });
  line([data.shipFromIndirizzo, data.shipFromCap, data.shipFromCitta].filter(Boolean).join(" · ") || "—");
  y -= 4;

  line("2. Prodotti da imballare e spedire", { bold: true, size: 11, color: navy });
  line(`• ${data.productTitolo}${data.productSku ? ` (SKU ${data.productSku})` : ""} × ${data.qty}`);
  line(
    data.optionType === "install"
      ? "Bundle: Prodotto + Installazione certificata in zona"
      : "Solo prodotto",
  );
  y -= 4;

  line("3. Destinazione (Cliente finale / Cantiere)", { bold: true, size: 11, color: navy });
  line(`Tipo: ${data.destinazioneTipo === "cantiere" ? "Cantiere" : "Cliente finale"}`);
  if (data.destinazioneLabel) line(data.destinazioneLabel, { bold: true });
  line(
    [data.destinazioneIndirizzo, data.destinazioneCap, data.destinazioneCitta].filter(Boolean).join(" · ") ||
      data.destinazioneLabel ||
      "—",
  );
  if (data.clienteNome) line(`Rif. cliente: ${data.clienteNome}`);
  if (data.clienteTelefono) line(`Tel.: ${data.clienteTelefono}`);
  y -= 4;

  line("4. Intervento Artigiano (indicativo)", { bold: true, size: 11, color: navy });
  if (data.optionType === "install") {
    line(`Categoria: ${data.artisanCategoria || "Artigiano in zona"}`);
    line(`Data indicativa consegna/intervento: ${fmtDate(data.artisanDataIndicativa)}`);
    line("NOTA: l'ingaggio artigiano diventa ufficiale solo a spedizione SPEDITO / IN CONSEGNA.", {
      size: 9,
      color: orange,
    });
  } else {
    line("Nessun intervento artigiano richiesto su questo ordine.");
  }
  y -= 4;

  if (data.note) {
    line("5. Note", { bold: true, size: 11, color: navy });
    line(data.note.slice(0, 400));
  }

  y = Math.min(y, 80);
  page.drawText("Documento generato automaticamente da AncheCasa Multi-Vendor · non sostituisce DDT fiscale ufficiale", {
    x: M,
    y: 40,
    size: 7,
    font,
    color: rgb(0.45, 0.45, 0.45),
  });

  return pdf.save();
}

export function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}
