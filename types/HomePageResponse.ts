import { Category } from "./category";
import { Product } from "./Product";

export interface HomeProducts {
    products: Product[],
    categories: Category[]
}