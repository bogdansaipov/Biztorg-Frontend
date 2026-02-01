"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { api } from "@/helpers/api";
import { useAuthStore } from "@/stores/auth.store";
import OtpInput from "../Inputs/OtpInput";
import { LoginStep } from "@/enums/LoginStepEnum";

export default function LoginModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [step, setStep] = useState<LoginStep>(LoginStep.PHONE);
  const [digits, setDigits] = useState("");
  const [requestId, setRequestId] = useState("");
  const [loading, setLoading] = useState(false);

  const setAuth = useAuthStore((s) => s.setAuth);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  const formatPhone = (value: string) => {
    const cleaned = value.replace(/\D/g, "").slice(0, 9);

    const parts: string[] = [];
    if (cleaned.length > 0) parts.push(cleaned.slice(0, 2));
    if (cleaned.length > 2) parts.push(cleaned.slice(2, 5));
    if (cleaned.length > 5) parts.push(cleaned.slice(5, 7));
    if (cleaned.length > 7) parts.push(cleaned.slice(7, 9));

    return "+998 " + parts.join(" ");
  };

  const rawPhone = `+998${digits}`;

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace("+998", "").trim();
    setDigits(value.replace(/\D/g, ""));
  };

  const sendCode = async () => {
    if (digits.length !== 9) return;

    console.log('Raw phone string is: ', rawPhone)

    setLoading(true);
    try {
      const res = await api.post("/auth/phone/send-code", {
        phone: rawPhone,
      });


      setRequestId(res.data.data.requestId);
      setStep(LoginStep.CODE);
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async (code: string) => {
    setLoading(true);
    try {
      const res = await api.post("/auth/phone/verify", {
        phone: rawPhone,
        requestId,
        code,
      });

      setAuth({
        user: res.data.data.user,
      });

      onClose();
    } finally {
      setLoading(false);
      setStep(LoginStep.PHONE)
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="relative bg-white rounded-2xl w-[420px] p-8 z-10">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 cursor-pointer"
        >
          <X />
        </button>

        {step === LoginStep.PHONE && (
          <>
            <h2 className="text-2xl font-bold mb-6">
              Войти или создать профиль
            </h2>

            <input
              value={formatPhone(digits)}
              onChange={handlePhoneChange}
              inputMode="numeric"
              className="w-full bg-gray-100 rounded-xl px-4 py-3 text-lg outline-none"
              placeholder="+998 90 123 45 67"
            />

            <p className="text-sm text-gray-400 mt-3">
              Авторизуясь вы соглашаетесь с политикой обработки персональных данных
            </p>

            <button
              onClick={sendCode}
              disabled={loading || digits.length !== 9}
              className="w-full mt-6 cursor-pointer bg-primary text-white py-3 disabled:cursor-default rounded-xl disabled:opacity-50"
            >
              Получить код
            </button>
          </>
        )}
        
        {step === LoginStep.CODE && (
          <>
            <h2 className="text-2xl font-bold mb-2">
              Введите код из Telegram
            </h2>

            <p className="text-gray-500 mb-6">
              Отправили на {formatPhone(digits)}
            </p>

            <OtpInput length={6} onComplete={verifyCode} />

            <p className="text-sm text-gray-400 mt-6 text-center">
              Запросить код повторно через 117 сек
            </p>
          </>
        )}
      </div>
    </div>
  );
}