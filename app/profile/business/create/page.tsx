"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import CreateShopForm from "@/customComponents/profile/CreateShopForm";

export default function CreateAnotherShopPage() {
  const router = useRouter();

  return (
    <div>
      <Link
        href="/profile/business"
        className="flex items-center gap-1 text-gray-500 hover:text-gray-700 mb-4 -ml-1"
      >
        <ChevronLeft className="w-5 h-5" />
        <span className="text-sm">Мои магазины</span>
      </Link>

      <h1 className="text-2xl font-bold text-gray-800 mb-6">Создать магазин</h1>

      <CreateShopForm onSuccess={() => router.push("/profile/business")} />
    </div>
  );
}