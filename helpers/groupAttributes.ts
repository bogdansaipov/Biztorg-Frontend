import { Attribute } from "@/types/attribute/attribute";

export function groupAttributes(attributes: Attribute[]) {
  const map = new Map<string, string[]>();

  for (const attr of attributes) {
    if (!map.has(attr.attributeName)) {
      map.set(attr.attributeName, []);
    }
    map.get(attr.attributeName)!.push(attr.value);
  }

  return Array.from(map.entries()).map(([name, values]) => ({
    name,
    values,
  }));
}
