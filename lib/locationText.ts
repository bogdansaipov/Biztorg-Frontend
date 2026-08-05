import { regionInPrepositional } from "./ruDeclension";

// Uzbek locative case: append -da to the noun. Unlike Russian's prepositional
// case, this doesn't change the noun's ending or require lookup tables — it's
// a fixed suffix regardless of how the name ends (vowel or consonant), e.g.
// "Toshkent" -> "Toshkentda", "Farg'ona" -> "Farg'onada", "Buxoro" -> "Buxoroda".
function uzLocative(nameUz: string): string {
  return `${nameUz}da`;
}

type RegionLike = {
  name: string;
  nameUz?: string | null;
};

/**
 * Returns the region name in whatever grammatical form is natural for
 * "ads IN <location>" in the given locale — prepositional case for Russian,
 * locative (-da suffix) for Uzbek. Falls back to the country-wide default
 * ("Узбекистане" / "O'zbekistonda") when no region is selected.
 */
export function getLocationText(region: RegionLike | undefined, locale: string): string {
  if (!region) {
    return locale === "uz" ? "O'zbekistonda" : "Узбекистане";
  }

  if (locale === "uz" && region.nameUz) {
    return uzLocative(region.nameUz);
  }

  return regionInPrepositional(region.name);
}