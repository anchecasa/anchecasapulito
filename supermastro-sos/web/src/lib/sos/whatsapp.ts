export function whatsAppDigits(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("39")) return digits;
  return `39${digits.replace(/^0/, "")}`;
}

export function artisanWhatsAppText(summary: string, distance: string): string {
  return [
    "SuperMastro",
    "App che collega un guasto in casa con un artigiano vicino.",
    `Problema: ${summary}`,
    `Distanza: ${distance}`,
  ].join("\n");
}

export function artisanWhatsAppHref(phone: string, summary: string, distance: string): string {
  const text = encodeURIComponent(artisanWhatsAppText(summary, distance));
  return `https://wa.me/${whatsAppDigits(phone)}?text=${text}`;
}
