"use client";

import { useRef } from "react";

export default function OtpInput({
  length,
  onComplete,
}: {
  length: number;
  onComplete: (code: string) => void;
}) {
  const inputs = useRef<HTMLInputElement[]>([]);

  const handleChange = (i: number, value: string) => {
    if (!/^\d?$/.test(value)) return;

    inputs.current[i].value = value;

    if (value && i < length - 1) {
      inputs.current[i + 1]?.focus();
    }

    const code = inputs.current.map(i => i?.value).join("");
    if (code.length === length) onComplete(code);
  };

  return (
    <div className="flex justify-center gap-3">
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={(el) => {
  if (el) {
    inputs.current[i] = el;
  }
}}
          maxLength={1}
          className="w-12 h-12 text-center text-xl rounded-lg bg-gray-100 focus:ring-2 focus:ring-primary outline-none"
          onChange={(e) => handleChange(i, e.target.value)}
        />
      ))}
    </div>
  );
}
