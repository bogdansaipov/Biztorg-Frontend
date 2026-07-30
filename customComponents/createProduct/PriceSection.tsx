"use client";

import { Switch } from "@/components/ui/switch";
import { Currency } from "@/enums/CurrencyEnum";
import { cn } from "@/lib/utils";

interface Props {
  isFree: boolean;
  setIsFree: (v: boolean) => void;

  price: number | null;
  setPrice: (v: number | null) => void;

  currency: Currency.USD | Currency.UZS;
  setCurrency: (v: Currency.UZS | Currency.USD) => void;

  isUrgent: boolean;
  setIsUrgent: (v: boolean) => void;
}

export default function PriceSection({
  isFree,
  setIsFree,
  price,
  setPrice,
  currency,
  setCurrency,
  isUrgent,
  setIsUrgent,
}: Props) {
  const formatPrice = (value: number) =>
    value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");

  const handlePriceChange = (val: string) => {
    const digits = val.replace(/\D/g, "");
    if (!digits) {
      setPrice(null);
      return;
    }
    setPrice(Number(digits));
  };

  return (
    <section className="bg-white border border-gray-100 rounded-2xl p-6 sm:p-9 space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">
        Условия сделки
      </h2>

      <div
        onClick={() => {
          setIsFree((prev: any) => {
            if (!prev) setPrice(null);
            return !prev;
          });
        }}
        className="
          flex items-center justify-between
          bg-gray-100 rounded-xl p-4
          cursor-pointer
          hover:bg-gray-200
          transition
        "
      >
        <div className="flex items-center gap-4">
          <span className="text-lg font-medium text-black/80">
            Отдам даром
          </span>
        </div>

        <div onClick={(e) => e.stopPropagation()}>
          <Switch
            className="scale-140 cursor-pointer"
            checked={isFree}
            onCheckedChange={(v: boolean) => {
              setIsFree(v);
              if (v) setPrice(null);
            }}
          />
        </div>
      </div>

      <div
        className={cn(
          "transition-all duration-300 overflow-hidden",
          isFree ? "max-h-0 opacity-0" : "max-h-[500px] opacity-100",
        )}
      >
        <div className="pt-4 space-y-4">
          <h3 className="text-xl font-semibold text-gray-800">
            Цена
          </h3>

          {/* flex-wrap so on narrow phones the currency buttons drop to
              their own line instead of squeezing/overflowing next to the
              price input. min-w-0 on the input lets it actually shrink
              inside the flex row instead of forcing overflow itself. */}
          <div className="flex flex-wrap items-center gap-3">
            <input
              inputMode="numeric"
              placeholder="Укажите цену"
              value={price ? formatPrice(price) : ""}
              onChange={(e) => handlePriceChange(e.target.value)}
              className="flex-1 min-w-[160px] bg-gray-100 rounded-xl px-4 py-3 text-lg outline-none"
            />

            <div className="flex gap-2">
              {([Currency.USD, Currency.UZS] as const).map((c) => (
                <button
                  key={c}
                  onClick={() => setCurrency(c)}
                  className={cn(
                    "px-4 py-3 rounded-xl font-medium cursor-pointer transition",
                    currency === c
                      ? "bg-gray-900 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300",
                  )}
                >
                  {c === Currency.UZS ? "сум" : "у.е."}
                </button>
              ))}
            </div>
          </div>

          <div
            onClick={() => {
              setIsUrgent((prev) => !prev);
            }}
            className="
              flex items-center justify-between
              bg-gray-100 rounded-xl p-4
              mt-10
              cursor-pointer
              hover:bg-gray-200
              transition
            "
          >
            <div className="flex items-center gap-4">
              <span className="text-lg font-medium text-black/80">
                Продам срочно. Есть торг
              </span>
            </div>

            <div onClick={(e) => e.stopPropagation()}>
              <Switch
                className="scale-140 cursor-pointer"
                checked={isUrgent}
                onCheckedChange={(v: boolean) => {
                  setIsUrgent(v);
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}