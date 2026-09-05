// Shared phone normalization — strips everything but digits so numbers
// entered with spaces/dashes/country-code formatting still match. Used by
// both portal login and the WhatsApp webhook's customer lookup.
export function normalizePhone(s: string): string {
  return s.replace(/\D/g, "");
}
