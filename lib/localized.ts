export function localized<T extends { name: string; nameUz?: string | null }>(
  entity: T,
  locale: string,
): string {
  if (locale === "uz" && entity.nameUz) return entity.nameUz;
  return entity.name;
}

// Same idea but for value/valueUz pairs (attribute values), which use a
// different field name than name/nameUz.
export function localizedValue<T extends { value: string; valueUz?: string | null }>(
  entity: T,
  locale: string,
): string {
  if (locale === "uz" && entity.valueUz) return entity.valueUz;
  return entity.value;
}