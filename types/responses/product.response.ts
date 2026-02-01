import { Pagination } from "../pagination/pagination";
import { Product } from "../Product";
import { ApiResponse } from "./api";

export interface ProductsResponseInterface {
    products: Product[],
    pagination: Pagination
}

export interface RecommendationProductsInterface {
    userProducts: Product[],
    similarProducts: Product[]
}

export type ProductsResponse = ApiResponse<ProductsResponseInterface>

export type SingleProductResponse = ApiResponse<Product>

export type RecommendationProductsResponse = ApiResponse<RecommendationProductsInterface>