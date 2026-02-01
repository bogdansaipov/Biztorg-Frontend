import { api } from "@/helpers/api";
import { Category } from "@/types/category";
import { CategoiesResponse } from "@/types/responses/category.response";

export async function getParentCategories(): Promise<Category[]> {
    const res = await api.get<CategoiesResponse>("/categories");

    return res.data.data;
}

export async function getCategories(): Promise<Category[]> {
    const res = await api.get<CategoiesResponse>("/categories");

    return res.data.data;
}