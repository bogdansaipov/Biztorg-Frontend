import { api } from "@/helpers/api";
import { Category } from "@/types/category";
import { CategoiesResponse } from "@/types/responses/category.response";
import { AttributeGroupedValues } from "@/types/attribute/attribute";

export async function getParentCategories(): Promise<Category[]> {
    const res = await api.get<CategoiesResponse>("/categories/root");

    return res.data.data;
}

export async function getCategories(): Promise<Category[]> {
    const res = await api.get<CategoiesResponse>("/categories");

    return res.data.data;
}

// GET /categories/{id}/attributes — attributes (with their possible
// values) applicable to this specific category, e.g. "Марка" with
// [Chevrolet, LADA, Daewoo, ...] for "Автомобили". Used to build the
// dynamic filter pills on the catalog page.
export async function getCategoryAttributes(categoryId: string): Promise<AttributeGroupedValues[]> {
  const res = await api.get(`/categories/${categoryId}/attributes`);
  return res.data.data;
}
