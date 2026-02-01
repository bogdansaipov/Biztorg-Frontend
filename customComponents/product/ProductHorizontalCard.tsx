import Link from "next/link";
import Image from "next/image";
// import { ChevronRight, Store } from "lucide-react";
import defaultPng from "@/public/images/default.png";
import { Product } from "@/types/Product";
import { Currency } from "@/enums/CurrencyEnum";

export function ProductHorizontalCard({ product }: { product: Product }) {
  const image = `http://localhost:3001/public/${product.images[0].imageUrl}`;
     

  return (
    <Link
      href={`/obyavlenie/${product.slug}`}
      className="inline-block w-[300px] shrink-0 hover:bg-gray-100 rounded-xl p-2 transition"
    >
      <div className="flex flex-col rounded-lg h-[450px]">
        <div className="overflow-hidden rounded-2xl h-[310px] relative">
          <Image
            src={image}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-300 hover:scale-105"
            unoptimized
          />

          {/* {product.isFromShop && (
            <span className="absolute top-2 left-2 flex items-center text-white bg-green-600/80 px-3 py-1 rounded-full text-sm font-semibold">
              <Store className="w-4 h-4 mr-1" /> Магазин
            </span>
          )} */}
        </div>

        <p className="text-xl mt-4 font-bold text-gray-800">
          {new Intl.NumberFormat("ru-RU").format(Number(product.price))}{" "}
          {product.currency === Currency.USD ? "у.е" : "сум"}
        </p>

        <div className="h-14 mb-2 overflow-hidden">
          <p className="text-gray-700 text-xl font-semibold line-clamp-2">
            {product.name}
          </p>
        </div>

        <div className="mt-auto text-gray-700">
          <p>{product.region?.name ?? "Ташкент"}</p>
          <p className="mt-1">
            {new Date(product.createdAt).toLocaleDateString("ru-RU", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
      </div>
    </Link>
  );
}