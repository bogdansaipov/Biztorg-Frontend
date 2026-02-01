/* eslint-disable react-hooks/static-components */
"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronRight, CircleUser, Copy, Heart, MapPin, Navigation, User } from "lucide-react";

import { Product } from "@/types/Product";
import { groupAttributes } from "@/helpers/groupAttributes";
import { Currency } from "@/enums/CurrencyEnum";
import ProductMap from "../map/productMap";

export default function ProductDetails({ product }: { product: Product }) {
  const [mainApi, setMainApi] = useState<CarouselApi | null>(null);
  const [thumbApi, setThumbApi] = useState<CarouselApi | null>(null);
  const [selected, setSelected] = useState(0);
  const [phoneOpen, setPhoneOpen] = useState(false);

  const images =
    product.images.length > 0
      ? product.images.map(i => `http://localhost:3001/public${i.imageUrl}`)
      : ["/images/default.png"];

  const attributes = groupAttributes(product.attributes);

  useEffect(() => {
  if (phoneOpen) {
    document.body.style.overflow = "hidden";
  } else {
    document.body.style.overflow = "";
  }

  return () => {
    document.body.style.overflow = "";
  };
}, [phoneOpen]);

  useEffect(() => {
    if (!mainApi || !thumbApi) return;

    const sync = () => {
      const index = mainApi.selectedScrollSnap();
      setSelected(index);
      thumbApi.scrollTo(index);
    };

    mainApi.on("select", sync);
    mainApi.on("reInit", sync);

    return () => {
      mainApi.off("select", sync);
    };
  }, [mainApi, thumbApi]);

  function PhoneModal({
  open,
  onClose,
  name,
  phone,
}: {
  open: boolean;
  onClose: () => void;
  name: string;
  phone: string;
}) {
  if (!open) return null;

  const copyPhone = async () => {
    await navigator.clipboard.writeText(phone);
  };

  return (
    <div className="fixed inset-0 z-9999 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl w-[420px] p-8 z-10">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute cursor-pointer top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>

        <h2 className="text-2xl font-bold text-center mb-6">
          Номер продавца
        </h2>

        {/* Avatar */}
        <div className="flex justify-center mb-4">
          <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center text-3xl">
            <CircleUser className="w-12 h-12 text-black/70"/>
          </div>
        </div>

        {/* Name */}
        <div className="text-center font-medium text-lg mb-1">
          {name}
        </div>

        {/* Phone */}
        <div className="flex items-center justify-center gap-2 mt-4">
          <span className="text-xl font-semibold">{phone}</span>

          <button
            onClick={copyPhone}
            className="text-gray-500 hover:text-gray-700 cursor-pointer"
            title="Скопировать"
          >
            <Copy/>
          </button>
        </div>
      </div>
    </div>
  );
}

  return (
    <div className="max-w-7xl mx-auto py-10 flex gap-14">
      {/* LEFT */}
      <div className="w-[630px] space-y-12">
        {/* IMAGES */}
    
<div className="flex gap-1">
  {/* THUMBNAILS */}
<Carousel
  orientation="vertical"
  className="w-[120px]"
  setApi={setThumbApi}
>
 <CarouselContent className="flex flex-col py-2 overflow-visible">
  {images.map((img, idx) => (
    <CarouselItem
      key={idx}
      className="basis-auto flex justify-center overflow-visible mb-2 last:mb-0"
    >
        <button
          onClick={() => mainApi?.scrollTo(idx)}
          className="cursor-pointer"
        >
          {/* Ring wrapper */}
          <div
            className={`rounded-md transition ${
              idx === selected
                ? "ring-2 ring-primary"
                : "opacity-60 hover:opacity-100"
            }`}
          >
            {/* Image NEVER changes size */}
            <div className="relative w-[88px] aspect-square rounded-md overflow-hidden">
              <Image
                src={img}
                alt=""
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          </div>
        </button>
      </CarouselItem>
    ))}
  </CarouselContent>
</Carousel>

 {/* MAIN IMAGE */}
<Carousel className="flex-1" setApi={setMainApi}>
  <CarouselContent>
    {images.map((img, idx) => (
      <CarouselItem key={idx}>
        <Card className="p-0">
          <CardContent className="relative h-[520px] rounded-xl overflow-hidden">

            {/* BLURRED BACKGROUND */}
            <Image
              src={img}
              alt=""
              fill
              className="object-cover scale-110 blur-2xl"
              unoptimized
              aria-hidden
            />

            <div className="absolute inset-0 bg-black/10" />

            {/* FOREGROUND IMAGE (REAL IMAGE) */}
            <div className="absolute inset-0 flex items-center justify-center">
              <Image
                src={img}
                alt={product.name}
                fill
                className="object-contain"
                unoptimized
              />
            </div>

{/* LEFT CLICK ZONE */}
<div
  className="
    absolute left-0 top-0 h-full w-[18%]
    z-20 cursor-pointer group
  "
  onClick={() => mainApi?.scrollPrev()}
>
  {/* hover overlay */}
  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition pointer-events-none" />

  <CarouselPrevious
  onClick={(e) => e.stopPropagation()}
    className="
      absolute top-1/2 -translate-y-1/2 left-4
      z-30
      bg-black/50
      !border-0
      !shadow-none
      text-white
      cursor-pointer
      opacity-80
      hover:opacity-100
    "
  />
</div>



{/* RIGHT CLICK ZONE */}
<div
  className="
    absolute right-0 top-0 h-full w-[18%]
    z-20 cursor-pointer group
  "
  onClick={() => mainApi?.scrollNext()}
>
  {/* hover overlay */}
  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition pointer-events-none" />

  <CarouselNext
  onClick={(e) => e.stopPropagation()}
    className="
      absolute top-1/2 -translate-y-1/2 right-4
      z-30
      cursor-pointer
      bg-black/50
      !border-0
      !shadow-none
      text-white
      opacity-80
      hover:opacity-100
    "
  />
</div>

          </CardContent>
        </Card>
      </CarouselItem>
    ))}
  </CarouselContent>
</Carousel>

</div>
        {/* ATTRIBUTES */}
        {attributes.length > 0 && (
          <div>
            <h2 className="text-3xl text-black/80 font-bold mb-4">Характеристики</h2>
            <div className="divide-y">
              {attributes.map((attr, idx) => (
                <div key={idx} className="flex gap-8 py-2">
                  <span className="min-w-[160px] text-xl text-gray-600">
                    {attr.name}
                  </span>
                  <span className="text-xl text-gray-800">
                    {attr.values.join(", ")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* DESCRIPTION */}
    
          <div>
            <h2 className="text-3xl font-bold mb-4 text-black/80">Описание</h2>
            <p className="text-xl text-gray-700 whitespace-pre-line">
              {product.description}
            </p>
          </div>

          {product.latitude && product.longitude && (
  <div className="mt-8">
    <h3 className="text-3xl font-bold text-black/80 mb-4">
      Локация сделки
    </h3>

    <ProductMap
      latitude={product.latitude}
      longitude={product.longitude}
    />
    
      <div className="mt-6 flex items-start gap-4 flex-col rounded-lg">
            <a
                  href={`https://yandex.ru/maps/?ll=${product.longitude},${product.latitude}&pt=${product.longitude},${product.latitude}&z=17`}
                  target="_blank"
                  className="flex items-center justify-between gap-4 w-full p-4 rounded-xl border border-gray-200 hover:bg-gray-100 transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-200 rounded-xl flex items-center justify-center">
                     <MapPin className="w-5 h-5 text-gray-600"/>
                    </div>
                    <div className="text-lg font-medium text-gray-700 whitespace-normal wrap-break-word">
                      {product.region.name}
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-500" />
                </a>

                <a
                  href={`https://yandex.ru/maps/?ll=${product.longitude},${product.latitude}&pt=${product.longitude},${product.latitude}&z=17`}
                  target="_blank"
                  className="flex items-center justify-between gap-4 w-full p-4 rounded-xl border border-gray-200 hover:bg-gray-100 transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-200 rounded-xl flex items-center justify-center">
                     <Navigation className="w-5 h-5 text-gray-600"/>
                    </div>
                    <div className="text-lg font-medium text-gray-700 whitespace-normal wrap-break-word">
                      Открыть карту в Yandex maps
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-500" />
                </a>
      </div>

  </div>
)}
       
      </div>

      {/* RIGHT */}
      <div className="flex-1 top-24 self-start space-y-8 sticky">
        <div className="relative">
          <button className="absolute top-0 right-0">
            <Heart className="w-7 h-7 text-black" />
          </button>

          <h1 className="text-4xl font-bold text-gray-800">
            {Number(product.price).toLocaleString("ru-RU")}{" "}
            {product.currency === Currency.USD ? "у.е" : "сум"}
          </h1>

          <p className="text-2xl font-semibold text-gray-700 mt-2">
            {product.name}
          </p>
        </div>

        <div className="border rounded-xl p-4 space-y-4">
          
            <div className="flex items-center gap-1 cursor-pointer">
            <h2 className="font-bold text-black/80 text-xl leading-none">
                {product.contactName}
            </h2>
            <ChevronRight className="w-4.5 h-4.5 text-black/50" />
            </div>

          
          <div className="font-medium text-black/70 text-2lg">{product.contactPhone}</div>

          <div className="flex gap-3">
            <button onClick={() => setPhoneOpen(true)} className="flex-1 bg-primary cursor-pointer text-white py-2 rounded-lg">
              Телефон
            </button>
            <button className="flex-1 border cursor-pointer border-primary text-primary py-2 rounded-lg">
              Сообщение
            </button>
          </div>
        </div>
      </div>

      <PhoneModal
  open={phoneOpen}
  onClose={() => setPhoneOpen(false)}
  name={product.contactName}
  phone={product.contactPhone}
/>
    </div>
  );
}
