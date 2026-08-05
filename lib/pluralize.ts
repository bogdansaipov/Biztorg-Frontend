function pluralizeRu(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && !(mod100 >= 12 && mod100 <= 14)) return few;
  return many;
}

/**
 * Uzbek nouns don't inflect for count the way Russian does — "5 e'lon",
 * not "5 e'lonlar" — the noun stays fixed regardless of the number in
 * front of it. So unlike Russian's three-way plural split, Uzbek always
 * returns the same word.
 */
export function announcementWord(n: number, locale: string): string {
  if (locale === "uz") return "e'lon";
  return pluralizeRu(n, "объявление", "объявления", "объявлений");
}