"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToastStore } from "@/stores/toast.store";
import {
  verifyShop,
  rejectShop,
  getShopDocuments,
  type AdminShopDocument,
} from "@/services/admin/shop.service";

const DOCUMENT_LABELS: Record<string, string> = {
  PASSPORT: "Паспорт",
  REGISTRATION_CERTIFICATE: "Свидетельство о регистрации",
};

export default function ShopVerificationActions({
  shopId,
  onDone,
}: {
  shopId: string;
  onDone: () => void;
}) {
  const showToast = useToastStore((s) => s.show);
  const [loading, setLoading] = useState<"verify" | "reject" | null>(null);
  const [documents, setDocuments] = useState<AdminShopDocument[] | null>(null);

  const handleVerify = async () => {
    setLoading("verify");
    try {
      await verifyShop(shopId);
      showToast({ title: "Магазин верифицирован", type: "success" });
      onDone();
    } catch (err) {
      console.error("Failed to verify shop", err);
      showToast({ title: "Не удалось верифицировать магазин", type: "error" });
    } finally {
      setLoading(null);
    }
  };

  const handleReject = async () => {
    const reason = window.prompt("Причина отклонения:");
    if (!reason || !reason.trim()) return;

    setLoading("reject");
    try {
      await rejectShop(shopId, reason.trim());
      showToast({ title: "Магазин отклонён", type: "success" });
      onDone();
    } catch (err) {
      console.error("Failed to reject shop", err);
      showToast({ title: "Не удалось отклонить магазин", type: "error" });
    } finally {
      setLoading(null);
    }
  };

  const loadDocuments = async () => {
    if (documents) return;
    try {
      setDocuments(await getShopDocuments(shopId));
    } catch (err) {
      console.error("Failed to load shop documents", err);
    }
  };

  return (
    <div className="flex justify-end gap-2">
      <DropdownMenu onOpenChange={(open) => open && loadDocuments()}>
        <DropdownMenuTrigger asChild>
          <Button size="sm" variant="outline">
            Документы
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Документы магазина</DropdownMenuLabel>
          {documents === null && <DropdownMenuItem disabled>Загрузка…</DropdownMenuItem>}
          {documents?.length === 0 && <DropdownMenuItem disabled>Нет документов</DropdownMenuItem>}
          {documents?.map((doc) => (
            <DropdownMenuItem key={doc.id} asChild>
              <a
                href={`${process.env.NEXT_PUBLIC_MEDIA_URL ?? ""}/public${doc.fileUrl}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {DOCUMENT_LABELS[doc.documentType] ?? doc.documentType}
              </a>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      <Button size="sm" variant="outline" onClick={handleReject} disabled={loading !== null}>
        Отклонить
      </Button>
      <Button size="sm" variant="secondary" onClick={handleVerify} disabled={loading !== null}>
        Верифицировать
      </Button>
    </div>
  );
}