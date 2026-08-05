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

    const code = inputs.current.map((el) => el?.value).join("");
    if (code.length === length) onComplete(code);
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Backspace") return;

    const current = inputs.current[i];

    // If this cell still has a digit, let the default backspace clear it
    // first — don't jump back yet, there's still something here to erase.
    if (current.value) return;

    // Cell's already empty — jump back and clear the previous one too.
    // Matches how OTP inputs behave everywhere else (SMS apps, 2FA
    // prompts): backspace on an empty box deletes back through the
    // sequence instead of just sitting inert.
    if (i > 0) {
      e.preventDefault();
      const prev = inputs.current[i - 1];
      prev.value = "";
      prev.focus();
    }
  };

  // Lets someone paste a full code (e.g. copied from an SMS notification)
  // instead of typing digit by digit — fills every cell in one go.
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    if (!pasted) return;

    e.preventDefault();

    pasted.split("").forEach((digit, idx) => {
      if (inputs.current[idx]) inputs.current[idx].value = digit;
    });

    const lastFilledIndex = Math.min(pasted.length, length) - 1;
    inputs.current[lastFilledIndex]?.focus();

    if (pasted.length === length) onComplete(pasted);
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
          inputMode="numeric"
          className="w-14 h-14 text-center text-2xl rounded-xl bg-gray-100 focus:ring-2 focus:ring-primary outline-none"
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
        />
      ))}
    </div>
  );
}