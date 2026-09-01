"use client";

import { useEffect, useState } from "react";
import { api } from "@/helpers/api";
import { SectionCards } from "@/components/section-cards";
import { ChartAreaInteractive } from "@/components/chart-area-interactive";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

interface TopProduct {
  id: string;
  name: string;
  slug: string;
  value: number;
}

const METRIC_LABELS: Record<string, string> = {
  views: "Просмотры",
  favorites: "Избранное",
  ratings: "Оценки",
};

function TopProductsCard() {
  const [metric, setMetric] = useState<"views" | "favorites" | "ratings">("views");
  const [products, setProducts] = useState<TopProduct[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    setProducts(null);

    api
      .get<{ data: { products: TopProduct[] } }>("/admin/analytics/top-products", {
        params: { metric, limit: 10 },
      })
      .then((res) => {
        if (!cancelled) setProducts(res.data.data.products);
      })
      .catch((err) => console.error("Failed to load top products", err));

    return () => {
      cancelled = true;
    };
  }, [metric]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Топ объявлений</CardTitle>
        <Select value={metric} onValueChange={(v) => setMetric(v as typeof metric)}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="views">Просмотры</SelectItem>
            <SelectItem value="favorites">Избранное</SelectItem>
            <SelectItem value="ratings">Оценки</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead>Название</TableHead>
              <TableHead className="text-right">{METRIC_LABELS[metric]}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products === null && (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground py-10">
                  Загрузка…
                </TableCell>
              </TableRow>
            )}
            {products?.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground py-10">
                  Нет данных
                </TableCell>
              </TableRow>
            )}
            {products?.map((product, i) => (
              <TableRow key={product.id}>
                <TableCell className="text-sm text-muted-foreground">{i + 1}</TableCell>
                <TableCell className="font-medium">{product.name}</TableCell>
                <TableCell className="text-right tabular-nums">{product.value}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export default function AdminAnalyticsPage() {
  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="px-4 lg:px-6">
        <h1 className="text-2xl font-semibold">Аналитика</h1>
      </div>

      <SectionCards />

      <div className="px-4 lg:px-6">
        <ChartAreaInteractive />
      </div>

      <div className="px-4 lg:px-6">
        <TopProductsCard />
      </div>
    </div>
  );
}