import { Category } from "@/types/category";

// Walks parentId up to the root, returning [root, ..., category] — used
// both for the breadcrumb (display) and for building the canonical URL
// path (slugs).
export function getAncestorChain(category: Category, all: Category[]): Category[] {
  const chain: Category[] = [];
  let current: Category | undefined = category;
  while (current) {
    chain.unshift(current);
    current = current.parentId ? all.find((c) => c.id === current!.parentId) : undefined;
  }
  return chain;
}

// e.g. category "Автомобили" (parent "Транспорт") -> ["transport", "avtomobili"]
export function slugPathFor(category: Category, all: Category[]): string[] {
  return getAncestorChain(category, all).map((c) => c.slug);
}

// Category slugs are globally unique (DB-enforced), so the LAST segment
// of any /a/b/c path is enough to resolve the category on its own — the
// earlier segments only matter for canonicalization (redirecting
// /c -> /a/b/c if someone links a shortened/wrong path).
export function findCategoryBySlug(slug: string, all: Category[]): Category | undefined {
  return all.find((c) => c.slug === slug);
}