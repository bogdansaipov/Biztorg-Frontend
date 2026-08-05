// Heuristic Russian prepositional-case ("где?") declension for city/region
// names — good enough for "в Ташкенте", "в Андижане", "в Бухаре", "в
// Янгиюле" etc. Not linguistically complete (a handful of foreign-origin
// names like "Навои" are indeclinable and this will incorrectly try to
// decline them), but covers the standard pattern that the large majority
// of Uzbek region/city names in Russian follow. The real fix would be a
// dedicated `namePrepositional` column on the backend's regions table;
// this is the pragmatic frontend stand-in until that exists.

// Region names in this app come as compound strings like "Ташкентская
// область, Ташкент" — for a page title we want the specific place (the
// part after the comma), not the whole administrative label.
export function extractRegionDisplayName(fullName: string): string {
  const parts = fullName.split(",").map((p) => p.trim());
  return parts[parts.length - 1] || fullName;
}

const CONSONANTS = /[бвгджзйклмнпрстфхцчшщ]$/i;

// "Adjective + область/район" pattern (e.g. "Ташкентская область",
// "Бекабадский район") needs its own rule, checked BEFORE the generic
// per-character heuristic below — that heuristic treats any word ending
// in "ь" as 2nd-declension masculine ("Кремль" -> "Кремле"), but
// "область" is a 3rd-declension feminine soft-sign noun, whose
// prepositional case ends in "-и" ("области"), not "-е". Left
// unhandled, that mismatch is exactly what produced "в Ташкентская
// областе" instead of "в Ташкентской области" — neither the adjective
// nor the noun were declined correctly.
//
// The adjective itself also needs its own ending swapped: hard-stem
// feminine "-ая" -> "-ой" (Ташкентская -> Ташкентской), hard-stem
// masculine "-ий"/"-ый" -> "-ом"/"-ем" (Бекабадский -> Бекабадском).
// Every current oblast name in this app's data follows the "-ая
// область" shape, so that's the one implemented for certain; "-ий
// район" is included too since it's the same reasoning and cheap to
// cover, even though no district names in the current dataset actually
// carry a literal "район" suffix.
const OBLAST_PATTERN = /^(.+?)ая\s+область$/i;
const RAYON_PATTERN = /^(.+?)(ий|ый)\s+район$/i;

export function toRussianPrepositional(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return trimmed;

  const oblastMatch = trimmed.match(OBLAST_PATTERN);
  if (oblastMatch) {
    return `${oblastMatch[1]}ой области`; // Ташкентская область -> Ташкентской области
  }

  const rayonMatch = trimmed.match(RAYON_PATTERN);
  if (rayonMatch) {
    return `${rayonMatch[1]}ом районе`; // Бекабадский район -> Бекабадском районе
  }

  if (trimmed.endsWith("ь")) return trimmed.slice(0, -1) + "е"; // Янгиюль -> Янгиюле
  if (trimmed.endsWith("а")) return trimmed.slice(0, -1) + "е"; // Бухара -> Бухаре
  if (trimmed.endsWith("я")) return trimmed.slice(0, -1) + "е"; // Кашкадарья -> Кашкадарье
  if (CONSONANTS.test(trimmed)) return trimmed + "е"; // Ташкент -> Ташкенте

  // Ends in a vowel this heuristic doesn't cover (о/е/и/у/ы/э) — most
  // likely an indeclinable foreign-origin name (e.g. "Навои"). Leave as
  // written rather than guess wrong.
  return trimmed;
}

// Convenience wrapper for the common case: full region.name -> ready to
// drop into "Категория в {result}".
export function regionInPrepositional(fullName: string): string {
  return toRussianPrepositional(extractRegionDisplayName(fullName));
}