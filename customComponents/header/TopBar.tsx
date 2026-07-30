import { MapPin, ChevronDown } from "lucide-react";

export default function TopBar() {
  return (
    <div className="bg-white border-b border-gray-100">
      <div className="max-w-[1400px] mx-auto px-4 lg:px-0 py-2 flex items-center justify-between">
        <span className="font-semibold text-xl sm:text-2xl lg:text-3xl text-black/80">
          BizTorgUz
        </span>

        <div className="flex items-center gap-3 sm:gap-6 text-black/80">
          <button className="flex items-center gap-1 hover:text-black transition">
            <MapPin className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline text-sm sm:text-base">
              Все регионы
            </span>
          </button>

          <button className="flex items-center gap-1 hover:text-black transition">
            <span className="text-sm sm:text-base">RU</span>
            <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}