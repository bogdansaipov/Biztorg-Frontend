"use client"

import {
  Heart,
  MessageCircle,
  User,
  Plus,
  Search,
  List,
  Megaphone,
} from "lucide-react";
import { useState } from "react";
import LoginModal from "../Modals/LoginModal";
import { useAuthModal } from "@/context/AuthModalContext";

export default function MainHeader() {

  const { open } = useAuthModal()

  return (
    <div
      className="
        sticky top-0 z-9999
        bg-white/70 backdrop-blur-md
        supports-backdrop-filter:bg-white/60
      "
    >
      <div className="max-w-7xl mx-auto py-3 flex items-center gap-2">
        <button className="flex items-center gap-2 bg-primary text-white px-6 py-4 rounded-xl text-base font-medium cursor-pointer hover:opacity-95 transition">
          <List className="w-5.5 h-5.5" />
          Категории
        </button>

        <div className="flex-1 relative">
          <input
            placeholder="Найти iPhone 15 Pro"
            className="w-full bg-gray-100/80 rounded-xl pl-5 pr-14 py-4 text-base outline-none placeholder-gray-500"
          />
          <button className="absolute right-2 top-1/2 -translate-y-1/2 bg-primary text-white p-3 rounded-lg cursor-pointer hover:opacity-95 transition">
            <Search className="w-5.5 h-5.5" />
          </button>
        </div>

        <div className="flex items-center gap-10 text-black/80 ml-4">
          <button className="flex flex-col items-center font-medium cursor-pointer hover:text-black transition">
            <Heart className="w-5.5 h-5.5 mb-0.5" />
            Избранное
          </button>

          <button className="flex flex-col items-center font-medium cursor-pointer hover:text-black transition">
            <Megaphone className="w-5.5 h-5.5 mb-0.5" />
            Объявления
          </button>

          <button className="flex flex-col items-center font-medium cursor-pointer hover:text-black transition">
            <MessageCircle className="w-5.5 h-5.5 mb-0.5" />
            Сообщения
          </button>

          <button onClick= {open} className="flex flex-col items-center font-medium cursor-pointer hover:text-black transition">
            <User className="w-5.5 h-5.5 mb-0.5" />
            Войти
          </button>

          <button className="flex items-center gap-3 bg-gray-900 text-white px-6 py-3 rounded-3xl text-base font-medium cursor-pointer hover:bg-gray-800 transition">
            Продать
            <span className="flex items-center justify-center w-6 h-6 bg-white rounded-full">
              <Plus className="w-4.5 h-4.5 text-gray-900" />
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}