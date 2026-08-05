"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";
import { AttributeGroupedValues } from "@/types/attribute/attribute";
import { localized, localizedValue } from "@/lib/localized";
import { useLocaleRegion } from "@/hooks/useLocaleRegion";

interface Props {
  attribute: AttributeGroupedValues;
  value?: string;
  onChange: (valueId: string) => void;
}

export default function AttributeField({ attribute, value, onChange }: Props) {
  const { locale } = useLocaleRegion();
  const t = useTranslations("createProduct");

  const isBinary = attribute.values.length === 2;
  const selectedValue = attribute.values.find((v) => v.id === value);
  const attributeName = localized(attribute, locale);

  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  return (
    <div>
      <div className="mb-3 mt-2 text-lg font-medium text-gray-700">{attributeName}</div>

      {isBinary ? (
        <div className="flex gap-2">
          {attribute.values.map((v) => {
            const active = value === v.id;
            return (
              <button
                key={v.id}
                type="button"
                onClick={() => onChange(v.id)}
                className={`px-5 py-3 rounded-xl border text-base font-medium cursor-pointer transition whitespace-nowrap leading-tight ${
                  active
                    ? "bg-gray-900 text-white border-gray-900"
                    : "bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200"
                }`}
              >
                {localizedValue(v, locale)}
              </button>
            );
          })}
        </div>
      ) : (
        <div ref={wrapperRef} className="relative">
          <button
            type="button"
            onClick={() => setOpen((prev) => !prev)}
            className="w-full h-14 px-4 flex items-center justify-between rounded-xl border border-gray-200 bg-gray-100 hover:bg-gray-200 transition cursor-pointer text-base font-medium"
          >
            <span className={selectedValue ? "text-gray-900" : "text-gray-500"}>
              {selectedValue ? localizedValue(selectedValue, locale) : t("selectPlaceholder", { attribute: attributeName.toLowerCase() })}
            </span>
            <ChevronDown
              className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
            />
          </button>

          {open && (
            <div className="absolute top-full left-0 mt-2 z-30 w-full bg-white border border-gray-200 rounded-2xl p-4 flex flex-col gap-1.5 max-h-[340px] overflow-y-auto">
              {attribute.values.map((v) => {
                const active = v.id === value;
                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => {
                      onChange(v.id);
                      setOpen(false);
                    }}
                    className="flex items-center gap-3 px-2.5 py-2.5 rounded-lg hover:bg-gray-50 cursor-pointer text-left"
                  >
                    <span
                      className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition ${
                        active ? "bg-gray-900 border-gray-900" : "border-gray-300"
                      }`}
                    >
                      {active && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                    </span>
                    <span className="text-base text-gray-800">{localizedValue(v, locale)}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}