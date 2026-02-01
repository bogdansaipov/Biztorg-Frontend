import { MapPin, ChevronDown } from "lucide-react";

export default function TopBar() {
  return (
    <div className="bg-white border-b border-gray-100">
      <div className="max-w-7xl mx-auto py-2 flex items-center justify-between">
        <span className="font-semibold text-3xl text-black/80">
          BizTorgUz
        </span>

        <div className="flex items-center gap-6 text-black/80">
          <button className="flex items-center gap-1 hover:text-black transition">
            <MapPin className="w-5 h-5" />
            Все регионы
          </button>

          <button className="flex items-center gap-1 hover:text-black transition">
            RU
            <ChevronDown className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
