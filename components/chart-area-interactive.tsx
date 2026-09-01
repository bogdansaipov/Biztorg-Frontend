"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"

import { api } from "@/helpers/api"
import { useIsMobile } from "@/hooks/use-mobile"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"

interface SeriesPoint {
  bucket: string;
  count: number;
}

interface ChartRow {
  date: string;
  views: number;
  products: number;
}

const RANGE_LABELS: Record<string, string> = {
  "90": "Последние 3 месяца",
  "30": "Последние 30 дней",
  "7": "Последние 7 дней",
};

const chartConfig = {
  activity: {
    label: "Активность",
  },
  views: {
    label: "Просмотры",
    color: "hsl(var(--chart-1))",
  },
  products: {
    label: "Новые объявления",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig

// Merges the two independent time-series endpoints (views/products don't
// come from one combined endpoint on the backend) into one row per date,
// keyed on the union of dates either series actually returned. A day with
// zero activity in BOTH series simply won't appear as a row — a small,
// honest simplification rather than fabricating zero-filled gaps for the
// entire requested range.
function mergeSeries(viewsPoints: SeriesPoint[], productsPoints: SeriesPoint[]): ChartRow[] {
  const map = new Map<string, ChartRow>();

  for (const p of viewsPoints) {
    const date = p.bucket.slice(0, 10);
    const existing = map.get(date);
    map.set(date, { date, views: p.count, products: existing?.products ?? 0 });
  }
  for (const p of productsPoints) {
    const date = p.bucket.slice(0, 10);
    const existing = map.get(date);
    map.set(date, { date, views: existing?.views ?? 0, products: p.count });
  }

  return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
}

export function ChartAreaInteractive() {
  const isMobile = useIsMobile()
  const [timeRange, setTimeRange] = React.useState("30")
  const [chartData, setChartData] = React.useState<ChartRow[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    if (isMobile) {
      setTimeRange("7")
    }
  }, [isMobile])

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);

    Promise.all([
      api.get<{ data: { points: SeriesPoint[] } }>("/admin/analytics/views", {
        params: { granularity: "day", days: timeRange },
      }),
      api.get<{ data: { points: SeriesPoint[] } }>("/admin/analytics/products", {
        params: { granularity: "day", days: timeRange },
      }),
    ])
      .then(([viewsRes, productsRes]) => {
        if (cancelled) return;
        setChartData(mergeSeries(viewsRes.data.data.points, productsRes.data.data.points));
      })
      .catch((err) => console.error("Failed to load analytics time series", err))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [timeRange]);

  return (
    <Card className="@container/card">
      <CardHeader className="relative">
        <CardTitle>Активность</CardTitle>
        <CardDescription>
          <span className="@[540px]/card:block hidden">
            Просмотры и новые объявления — {RANGE_LABELS[timeRange].toLowerCase()}
          </span>
          <span className="@[540px]/card:hidden">{RANGE_LABELS[timeRange]}</span>
        </CardDescription>
        <div className="absolute right-4 top-4">
          <ToggleGroup
            type="single"
            value={timeRange}
            onValueChange={(value) => value && setTimeRange(value)}
            variant="outline"
            className="@[767px]/card:flex hidden"
          >
            <ToggleGroupItem value="90" className="h-8 px-2.5">
              Последние 3 месяца
            </ToggleGroupItem>
            <ToggleGroupItem value="30" className="h-8 px-2.5">
              Последние 30 дней
            </ToggleGroupItem>
            <ToggleGroupItem value="7" className="h-8 px-2.5">
              Последние 7 дней
            </ToggleGroupItem>
          </ToggleGroup>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger
              className="@[767px]/card:hidden flex w-40"
              aria-label="Выберите период"
            >
              <SelectValue placeholder="Последние 30 дней" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="90" className="rounded-lg">
                Последние 3 месяца
              </SelectItem>
              <SelectItem value="30" className="rounded-lg">
                Последние 30 дней
              </SelectItem>
              <SelectItem value="7" className="rounded-lg">
                Последние 7 дней
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        {loading ? (
          <Skeleton className="h-[250px] w-full rounded-lg" />
        ) : (
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-[250px] w-full"
          >
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="fillViews" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-views)"
                    stopOpacity={1.0}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-views)"
                    stopOpacity={0.1}
                  />
                </linearGradient>
                <linearGradient id="fillProducts" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-products)"
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-products)"
                    stopOpacity={0.1}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                tickFormatter={(value) => {
                  const date = new Date(value)
                  return date.toLocaleDateString("ru-RU", {
                    month: "short",
                    day: "numeric",
                  })
                }}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    labelFormatter={(value) => {
                      return new Date(value).toLocaleDateString("ru-RU", {
                        month: "short",
                        day: "numeric",
                      })
                    }}
                    indicator="dot"
                  />
                }
              />
              <Area
                dataKey="products"
                type="natural"
                fill="url(#fillProducts)"
                stroke="var(--color-products)"
                stackId="a"
              />
              <Area
                dataKey="views"
                type="natural"
                fill="url(#fillViews)"
                stroke="var(--color-views)"
                stackId="a"
              />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}