"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/helpers/api";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import UserActions from "@/components/admin/UserActions";
import TableSkeleton from "@/components/admin/TableSkeleton";
import type { AdminUsersResponse } from "@/services/admin/user.service";

const ROLE_LABELS: Record<string, string> = {
  USER: "Пользователь",
  SHOP_OWNER: "Владелец магазина",
  ADMIN: "Администратор",
};

export default function AdminUsersPage() {
  const [data, setData] = useState<AdminUsersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<string>("ALL");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<{ data: AdminUsersResponse }>("/admin/users", {
        params: {
          limit: 50,
          search: search.trim() || undefined,
          role: role === "ALL" ? undefined : role,
        },
      });
      setData(res.data.data);
    } catch (err) {
      console.error("Failed to load users", err);
    } finally {
      setLoading(false);
    }
  }, [search, role]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="px-4 lg:px-6">
        <h1 className="text-2xl font-semibold">Пользователи</h1>
        <p className="text-sm text-muted-foreground">
          {data ? `Всего пользователей: ${data.pagination.total}` : "\u00A0"}
        </p>
      </div>

      <div className="px-4 lg:px-6 flex flex-col sm:flex-row gap-2">
        <Input
          placeholder="Поиск по имени или телефону"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && load()}
          className="sm:max-w-xs"
        />
        <Select value={role} onValueChange={setRole}>
          <SelectTrigger className="sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Все роли</SelectItem>
            <SelectItem value="USER">Пользователь</SelectItem>
            <SelectItem value="SHOP_OWNER">Владелец магазина</SelectItem>
            <SelectItem value="ADMIN">Администратор</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="px-4 lg:px-6">
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Имя</TableHead>
                  <TableHead>Телефон</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Роль</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>Регистрация</TableHead>
                  <TableHead className="text-right">Действия</TableHead>
                </TableRow>
              </TableHeader>
              {loading || !data ? (
                <TableSkeleton rows={6} columns={7} />
              ) : (
                <TableBody>
                  {data.users.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-10">
                        Пользователи не найдены
                      </TableCell>
                    </TableRow>
                  )}
                  {data.users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name ?? "—"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {user.phone ?? "—"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {user.email ?? "—"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {ROLE_LABELS[user.role] ?? user.role}
                      </TableCell>
                      <TableCell>
                        {user.isSuspended ? (
                          <Badge variant="outline" className="bg-red-100 text-red-700 border-red-200">
                            Заблокирован
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-emerald-100 text-emerald-700 border-emerald-200">
                            Активен
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(user.createdAt).toLocaleDateString("ru-RU")}
                      </TableCell>
                      <TableCell className="text-right">
                        <UserActions
                          userId={user.id}
                          role={user.role}
                          isSuspended={user.isSuspended}
                          onDone={load}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              )}
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}