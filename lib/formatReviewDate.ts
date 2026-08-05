const RU_MONTHS = [
  "января", "февраля", "марта", "апреля", "мая", "июня",
  "июля", "августа", "сентября", "октября", "ноября", "декабря",
];

const UZ_MONTHS = [
  "yanvar", "fevral", "mart", "aprel", "may", "iyun",
  "iyul", "avgust", "sentabr", "oktabr", "noyabr", "dekabr",
];

/**
 * "12 марта" / "12 mart" — deliberately NOT using toLocaleDateString here.
 * Month-name formatting via Intl varies far more between server and
 * browser ICU implementations than numeric date formats do (this is the
 * same class of bug that broke the product-card date under "uz-UZ" —
 * see formatProductDate), so a static lookup table guarantees identical
 * output everywhere regardless of environment.
 */
export function formatReviewDate(dateInput: string | Date, locale: string): string {
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  const day = date.getDate();
  const months = locale === "uz" ? UZ_MONTHS : RU_MONTHS;
  return `${day} ${months[date.getMonth()]}`;
}