const RU_MONTHS = [
  "января", "февраля", "марта", "апреля", "мая", "июня",
  "июля", "августа", "сентября", "октября", "ноября", "декабря",
];

const UZ_MONTHS = [
  "yanvar", "fevral", "mart", "aprel", "may", "iyun",
  "iyul", "avgust", "sentabr", "oktabr", "noyabr", "dekabr",
];

/**
 * "12 марта 2024" / "12 mart 2024" — same reasoning as formatReviewDate:
 * a static month lookup instead of toLocaleDateString, since Node's
 * server-side Intl and the browser's disagree on month-name formatting
 * for "uz-UZ" specifically (this already broke once on a numeric date;
 * month names are even more inconsistent across ICU implementations).
 */
export function formatJoinDate(dateInput: string | Date, locale: string): string {
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  const day = date.getDate();
  const months = locale === "uz" ? UZ_MONTHS : RU_MONTHS;
  return `${day} ${months[date.getMonth()]} ${date.getFullYear()}`;
}