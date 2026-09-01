"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToastStore } from "@/stores/toast.store";
import { suspendUser, unsuspendUser, updateUserRole } from "@/services/admin/user.service";

const ROLE_LABELS: Record<string, string> = {
  USER: "Пользователь",
  SHOP_OWNER: "Владелец магазина",
  ADMIN: "Администратор",
};

export default function UserActions({
  userId,
  role,
  isSuspended,
  onDone,
}: {
  userId: string;
  role: string;
  isSuspended: boolean;
  onDone: () => void;
}) {
  const showToast = useToastStore((s) => s.show);
  const [loading, setLoading] = useState(false);

  const run = async (action: () => Promise<void>, successMessage: string, errorMessage: string) => {
    setLoading(true);
    try {
      await action();
      showToast({ title: successMessage, type: "success" });
      onDone();
    } catch (err) {
      console.error(errorMessage, err);
      // Backend guards (can't suspend an admin, can't change your own role)
      // surface here as a generic failure — the toast can't easily show
      // the server's specific message without touching the shared api
      // client's error shape, so this stays generic rather than guessing.
      showToast({ title: errorMessage, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const roleOptions = (["USER", "SHOP_OWNER", "ADMIN"] as const).filter((r) => r !== role);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" variant="outline" disabled={loading}>
          Действие
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {isSuspended ? (
          <DropdownMenuItem
            onClick={() =>
              run(
                () => unsuspendUser(userId),
                "Пользователь восстановлен",
                "Не удалось восстановить пользователя",
              )
            }
          >
            Восстановить
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem
            onClick={() =>
              run(
                () => suspendUser(userId),
                "Пользователь заблокирован",
                "Не удалось заблокировать пользователя",
              )
            }
          >
            Заблокировать
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Изменить роль</DropdownMenuLabel>
        {roleOptions.map((r) => (
          <DropdownMenuItem
            key={r}
            onClick={() =>
              run(
                () => updateUserRole(userId, r),
                `Роль изменена на «${ROLE_LABELS[r]}»`,
                "Не удалось изменить роль",
              )
            }
          >
            {ROLE_LABELS[r]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}