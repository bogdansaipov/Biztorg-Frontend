// lib/formatDate.ts
export function formatProductDate(dateInput: string | Date, locale: string): string {
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  // Uzbek and Russian both conventionally use day.month.year for this kind
  // of short listing date — same separator, same order, in both locales.
  // Deliberately NOT using toLocaleDateString here: Node's server-side
  // Intl and the browser's Intl disagree on "uz-UZ" formatting specifically
  // (one produces "2026-08-04", the other "04/08/2026"), which caused a
  // hydration mismatch. Doing it by hand guarantees identical output on
  // both server and client, regardless of ICU data differences.
  return `${day}.${month}.${year}`;
}