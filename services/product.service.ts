import { api } from "@/helpers/api";
import { Product } from "@/types/Product";
import { ProductsResponse, ProductsResponseInterface, RecommendationProductsInterface, RecommendationProductsResponse, SingleProductResponse } from "@/types/responses/product.response";

export async function getProducts(page = 1, limit: 4): Promise<ProductsResponseInterface> {
 const response = await api.get<ProductsResponse>(`/products`, {params: {page, limit}});

 return response.data.data
}

 export async function getSingleProduct(slug: string): Promise<Product> {

console.log("The slugName in function received is: ", slug);

    const res = await api.get<SingleProductResponse>("/products/single", {params: {productSlug: slug}});

    return res.data.data;
 }

export async function getRecommendationProducts(
  productId: string
): Promise<RecommendationProductsInterface> {

  const res = await api.get<RecommendationProductsResponse>(
    `/products/recommendations/${productId}`
  );

  return res.data.data;
}