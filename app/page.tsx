import CategorySlider from "@/customComponents/category/CategorySlider";
import ProductGrid from "@/customComponents/product/ProductGrid";
import { getParentCategories } from "@/services/category.service";
import { getProducts } from "@/services/product.service";
export default async function Home() {


  const categories = await getParentCategories();

  const {products, pagination} = await getProducts(1, 4);

  return (
    <>
      <main>
        <h1 className="text-[40px] font-bold max-w-7xl mx-auto mt-4 text-black/80">
            Объявления в Узбекистане
        </h1>
         <CategorySlider categories={categories.filter((category) => category.parentId == null)}/>
        <ProductGrid initialProducts={products} totalPages={pagination.pages} initialPage={pagination.page}/>
      </main>
    </>
  )
}
