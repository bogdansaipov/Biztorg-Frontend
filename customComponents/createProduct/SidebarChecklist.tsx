"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Item {
  label: string;
  done: boolean;
}

export default function SidebarChecklist({ items }: { items: Item[] }) {
  return (
    <div className="sticky top-24 bg-white border border-gray-100 rounded-2xl p-6">
      <ul className="space-y-3 text-base font-medium">
        {items.map((item) => (
          <li key={item.label} className="flex items-center gap-2">
            <span
              className={cn(
                "w-5 h-5 flex items-center justify-center rounded-full",
                item.done
                  ? "bg-green-500 text-white"
                  : "bg-gray-300 text-transparent",
              )}
            >
              {item.done && <Check className="w-3 h-3" />}
            </span>

            <span
              className={cn(
                item.done ? "text-gray-700" : "text-gray-400",
              )}
            >
              {item.label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}