"use client";

import { ChevronDown } from "lucide-react";
import { AttributeGroupedValues } from "@/types/attribute/attribute";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Props {
  attribute: AttributeGroupedValues;
  value?: string;
  onChange: (valueId: string) => void;
}

export default function AttributeField({
  attribute,
  value,
  onChange,
}: Props) {
  const isBinary = attribute.values.length === 2;

  const selectedValue = attribute.values.find(v => v.id === value);

  return (
    <div>
      <div className="mb-3 mt-2 text-lg font-medium text-gray-700">
        {attribute.name}
      </div>

      {isBinary ? (
        <div className="flex gap-2">
          {attribute.values.map(v => {
            const active = value === v.id;

            return (
              <button
                key={v.id}
                onClick={() => onChange(v.id)}
                className={`
                  px-5 py-3 rounded-3xl
                  text-base font-medium
                  cursor-pointer transition
                  whitespace-nowrap leading-tight
                  ${
                    active
                      ? "bg-black/90 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }
                `}
              >
                {v.value}
              </button>
            );
          })}
        </div>
      ) : (

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="
                w-full h-14 px-4
                justify-between
                rounded-xl
                text-base font-medium
                bg-white border border-gray-300
              "
            >
              <span className={selectedValue ? "text-gray-900" : "text-gray-400"}>
                {selectedValue
                  ? selectedValue.value
                  : `Выберите ${attribute.name.toLowerCase()}`}
              </span>

              <ChevronDown className="w-4 h-4 text-gray-500" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="start" className="w-full min-w-[var(--radix-dropdown-menu-trigger-width)]">
            {attribute.values.map(v => (
              <DropdownMenuItem
                key={v.id}
                onClick={() => onChange(v.id)}
                className="cursor-pointer text-base"
              >
                {v.value}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}