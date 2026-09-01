"use client"

import { useEffect, useState } from "react"
import { AlertCircleIcon, CheckCircle2Icon } from "lucide-react"

import { api } from "@/helpers/api"
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

interface AdminOverview {
  today: { newUsers: number; newProducts: number; views: number };
  last7Days: { newUsers: number; newProducts: number; views: number };
  last30Days: { newUsers: number; newProducts: number; views: number };
  pending: {
    productsAwaitingModeration: number;
    reportsAwaitingReview: number;
    shopsAwaitingVerification: number;
  };
  totals: { users: number; products: number; shops: number };
}

export function SectionCards() {
  const [data, setData] = useState<AdminOverview | null>(null);

  useEffect(() => {
    api
      .get<{ data: AdminOverview }>("/admin/analytics/overview")
      .then((res) => setData(res.data.data))
      .catch((err) => console.error("Failed to load overview", err));
  }, []);

  const pendingProducts = data?.pending.productsAwaitingModeration ?? 0;
  const pendingReports = data?.pending.reportsAwaitingReview ?? 0;

  return (
    <div className="*:data-[slot=card]:shadow-xs @xl/main:grid-cols-2 @5xl/main:grid-cols-4 grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card lg:px-6">
      <Card className="@container/card">
        <CardHeader className="relative">
          <CardDescription>На модерации</CardDescription>
          <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
            {data ? pendingProducts : <Skeleton className="h-8 w-12" />}
          </CardTitle>
          <div className="absolute right-4 top-4">
            {data ? (
              pendingProducts > 0 ? (
                <AlertCircleIcon className="size-4 text-amber-500" />
              ) : (
                <CheckCircle2Icon className="size-4 text-emerald-500" />
              )
            ) : (
              <Skeleton className="size-4 rounded-full" />
            )}
          </div>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 text-sm">
          <div className="text-muted-foreground">
            {data ? (pendingProducts > 0 ? "Ожидают проверки" : "Очередь пуста") : <Skeleton className="h-4 w-24" />}
          </div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader className="relative">
          <CardDescription>Жалобы</CardDescription>
          <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
            {data ? pendingReports : <Skeleton className="h-8 w-12" />}
          </CardTitle>
          <div className="absolute right-4 top-4">
            {data ? (
              pendingReports > 0 ? (
                <AlertCircleIcon className="size-4 text-amber-500" />
              ) : (
                <CheckCircle2Icon className="size-4 text-emerald-500" />
              )
            ) : (
              <Skeleton className="size-4 rounded-full" />
            )}
          </div>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 text-sm">
          <div className="text-muted-foreground">
            {data ? (pendingReports > 0 ? "Требуют рассмотрения" : "Нет новых жалоб") : <Skeleton className="h-4 w-24" />}
          </div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader className="relative">
          <CardDescription>Новые пользователи</CardDescription>
          <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
            {data ? data.last7Days.newUsers : <Skeleton className="h-8 w-12" />}
          </CardTitle>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 text-sm">
          <div className="text-muted-foreground">
            {data ? "За последние 7 дней" : <Skeleton className="h-4 w-24" />}
          </div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader className="relative">
          <CardDescription>Просмотры</CardDescription>
          <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
            {data ? data.last7Days.views : <Skeleton className="h-8 w-12" />}
          </CardTitle>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 text-sm">
          <div className="text-muted-foreground">
            {data ? "За последние 7 дней" : <Skeleton className="h-4 w-24" />}
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}