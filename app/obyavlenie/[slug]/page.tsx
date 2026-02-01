import { HorizontalProductSection } from "@/customComponents/product/HorizontalProductSection";
import ProductDetails from "@/customComponents/product/ProductDetails";
import { getRecommendationProducts, getSingleProduct } from "@/services/product.service";

interface Props {
  params: { slug: string };
}

export default async function ProductPage({params}: Props) {


    const {slug} = await params;
    
    console.log("The slugName is: ", slug);

    const product = await getSingleProduct(slug);

    const { userProducts, similarProducts } =
  await getRecommendationProducts(product.id);

    return (
        <>
            <ProductDetails product={product}/>;

            <HorizontalProductSection
      title="Объявления продавца"
      products={userProducts}
    />

    <HorizontalProductSection
      title="Похожие объявления"
      products={similarProducts}
    />
        </>
    ) 


}