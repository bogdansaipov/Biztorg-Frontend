import CategoryGrid from "@/customComponents/category/CategoryGrid";
import ProductGrid from "@/customComponents/product/ProductGrid";
import { getParentCategories } from "@/services/category.service";
import { getProducts } from "@/services/product.service";
export default async function Home() {


  const categories = await getParentCategories();

  const {products, pagination} = await getProducts(1, 20);

  return (
    <>
      <main>
        <h1 className="text-2xl sm:text-3xl lg:text-[35px] font-bold max-w-[1400px] mx-auto px-4 lg:px-0 mt-4 text-black/80">
            Объявления в Узбекистане
        </h1>
         <CategoryGrid categories={categories} />
        <ProductGrid initialProducts={products} totalPages={pagination.pages} initialPage={pagination.page}/>
      </main>
    </>
  )
}