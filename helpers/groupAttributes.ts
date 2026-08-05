import { Attribute } from "@/types/attribute/attribute";

export function groupAttributes(attributes: Attribute[]) {
  const map = new Map<
    string,
    { name: string; nameUz: string; values: string[]; valuesUz: string[] }
  >();

  for (const attr of attributes) {
    if (!map.has(attr.attributeName)) {
      map.set(attr.attributeName, {
        name: attr.attributeName,
        nameUz: attr.attributeNameUz,
        values: [],
        valuesUz: [],
      });
    }
    const entry = map.get(attr.attributeName)!;
    entry.values.push(attr.value);
    entry.valuesUz.push(attr.valueUz);
  }

  return Array.from(map.values());
}