"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Loader2, X } from "lucide-react";
import OtpInput from "../Inputs/OtpInput";
import { LoginStep } from "@/enums/LoginStepEnum";
import { sendPhoneCode, verifyPhoneCode } from "@/services/auth.service";

const RESEND_SECONDS = 120;

export default function LoginModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const locale = pathname.split("/")[1] || "ru";
  const t = useTranslations("loginModal");

  const [step, setStep] = useState<LoginStep>(LoginStep.PHONE);
  const [digits, setDigits] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendIn, setResendIn] = useState(0);

 useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);
  
  useEffect(() => {
    if (!open) {
      setStep(LoginStep.PHONE);
      setDigits("");
      setResendIn(0);
    }
  }, [open]);

  useEffect(() => {
    if (step !== LoginStep.CODE || resendIn <= 0) return;

    const timer = setInterval(() => {
      setResendIn((s) => (s <= 1 ? 0 : s - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [step, resendIn]);

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

    setLoading(true);
    try {
      await sendPhoneCode(rawPhone);
      setStep(LoginStep.CODE);
      setResendIn(RESEND_SECONDS);
    } finally {
      setLoading(false);
    }
  };

  const resendCode = async () => {
    if (resendIn > 0 || loading) return;

    setLoading(true);
    try {
      await sendPhoneCode(rawPhone);
      setResendIn(RESEND_SECONDS);
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async (code: string) => {
    setLoading(true);
    try {
      await verifyPhoneCode(rawPhone, code);
      onClose();
    } finally {
      setLoading(false);
      setStep(LoginStep.PHONE);
      setResendIn(0);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="relative bg-white rounded-2xl w-full max-w-[480px] p-8 sm:p-10 z-10">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 cursor-pointer"
        >
          <X />
        </button>

        {step === LoginStep.PHONE && (
          <>
            <h2 className="text-2xl font-bold mb-6">
              {t("titlePhone")}
            </h2>

            <input
              value={formatPhone(digits)}
              onChange={handlePhoneChange}
              inputMode="numeric"
              className="w-full bg-gray-100 rounded-xl px-4 py-3.5 text-lg outline-none"
              placeholder="+998 90 123 45 67"
            />

            <p className="text-sm text-gray-400 mt-3">
              {t("privacyNotice")}
            </p>

            <button
              onClick={sendCode}
              disabled={loading || digits.length !== 9}
              className="w-full mt-6 flex items-center justify-center gap-2 cursor-pointer bg-primary text-white py-3.5 disabled:cursor-default rounded-xl disabled:opacity-50"
            >
              {loading && <Loader2 className="w-5 h-5 animate-spin" />}
              {t("getCode")}
            </button>
          </>
        )}

        {step === LoginStep.CODE && (
          <>
            <h2 className="text-2xl font-bold mb-2">
              {t("titleCode")}
            </h2>

            <p className="text-gray-500 mb-8">
              {t("sentTo", { phone: formatPhone(digits) })}
            </p>

            <OtpInput length={4} onComplete={verifyCode} />

            <p className="text-sm text-gray-400 mt-6 text-center">
              {resendIn > 0 ? (
                t("resendIn", { seconds: resendIn })
              ) : (
                <button
                  onClick={resendCode}
                  disabled={loading}
                  className="text-primary cursor-pointer disabled:opacity-50"
                >
                  {t("resendNow")}
                </button>
              )}
            </p>
          </>
        )}
      </div>
    </div>
  );
}