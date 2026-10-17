// Click-to-chat links (R9): https://wa.me/<number>?text=<URL-encoded message>
// The number is digits only with the country code (no +, spaces or leading 0).
// We always encode the text ourselves with encodeURIComponent.
// Format confirmed by WhatsApp-partner docs (WATI, Bird); WhatsApp's own help
// page did not load: unverified against the primary source.

export type WhatsAppVars = Partial<Record<"page" | "service" | "niche" | "country", string>>;

/** Fill {page}, {service}, {niche}, {country}; drop unknown or empty variables cleanly. */
export function fillTemplate(template: string, vars: WhatsAppVars): string {
  return template
    .replace(/\{(page|service|niche|country)\}/g, (_, k: keyof WhatsAppVars) => vars[k]?.trim() ?? "")
    .replace(/\{[^}]*\}/g, "")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([,.!?])/g, "$1")
    .trim();
}

export function whatsappLink(number: string, message: string): string {
  const digits = number.replace(/\D/g, "").replace(/^0+/, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
