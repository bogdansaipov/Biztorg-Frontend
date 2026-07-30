"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getShopForEdit } from "@/services/shop.service";
import { ShopEditData } from "@/types/responses/shop.response";
import CreateShopForm from "@/customComponents/profile/CreateShopForm";

export default function EditShopPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const shopId = params.id;

  const [data, setData] = useState<ShopEditData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!shopId) return;
    getShopForEdit(shopId)
      .then(setData)
      .catch((err) => {
        console.error("Failed to load shop for edit", err);
        setError("Не удалось загрузить данные магазина.");
      });
  }, [shopId]);

  return (
    <div>
      <Link
        href="/profile/business"
        className="flex items-center gap-1 text-gray-500 hover:text-gray-700 mb-4 -ml-1"
      >
        <ChevronLeft className="w-5 h-5" />
        <span className="text-sm">Мои магазины</span>
      </Link>

      <h1 className="text-2xl font-bold text-gray-800 mb-6">Редактировать магазин</h1>

      {error ? (
        <p className="text-red-400 text-sm py-6">{error}</p>
      ) : data === null ? (
        <p className="text-gray-400 text-sm py-6">Загрузка…</p>
      ) : (
        <CreateShopForm
          mode="edit"
          shopId={shopId}
          initialData={data}
          onSuccess={() => router.push("/profile/business")}
        />
      )}
    </div>
  );
}