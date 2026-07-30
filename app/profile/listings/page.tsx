"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import MyListingsTab from "@/customComponents/profile/MyListingsTab";

export default function MyListingsPage() {
  return (
    <div>
      <Link
        href="/profile"
        className="lg:hidden flex items-center gap-1 text-gray-500 hover:text-gray-700 mb-4 -ml-1"
      >
        <ChevronLeft className="w-5 h-5" />
        <span className="text-sm">Профиль</span>
      </Link>

      <MyListingsTab />
    </div>
  );
}