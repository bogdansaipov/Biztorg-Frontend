"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToastStore } from "@/stores/toast.store";
import { approveProduct, rejectProduct } from "@/services/admin/product.service";

export default function ProductModerationActions({ productId }: { productId: string }) {
  const router = useRouter();
  const showToast = useToastStore((s) => s.show);
  const [loading, setLoading] = useState<"approve" | "reject" | null>(null);

  const handleApprove = async () => {
    setLoading("approve");
    try {
      await approveProduct(productId);
      showToast({ title: "Объявление одобрено", type: "success" });
      router.refresh();
    } catch (err) {
      console.error("Failed to approve product", err);
      showToast({ title: "Не удалось одобрить объявление", type: "error" });
    } finally {
      setLoading(null);
    }
  };

  const handleReject = async () => {
    // Placeholder: a native prompt for the rejection reason. Fine for a
    // first working version, but worth swapping for a proper shadcn
    // Dialog + Textarea once that primitive is added — flagging rather
    // than silently shipping this as the final UX.
    const reason = window.prompt("Причина отклонения:");
    if (!reason || !reason.trim()) return;

    setLoading("reject");
    try {
      await rejectProduct(productId, reason.trim());
      showToast({ title: "Объявление отклонено", type: "success" });
      router.refresh();
    } catch (err) {
      console.error("Failed to reject product", err);
      showToast({ title: "Не удалось отклонить объявление", type: "error" });
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="flex justify-end gap-2">
      <Button size="sm" variant="outline" onClick={handleReject} disabled={loading !== null}>
        Отклонить
      </Button>
      <Button size="sm" variant="secondary" onClick={handleApprove} disabled={loading !== null}>
        Одобрить
      </Button>
    </div>
  );
}