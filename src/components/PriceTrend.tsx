import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { formatMoney, type PricePoint } from "@/lib/vendors";

export function PriceTrend({ history, title }: { history: PricePoint[]; title: string }) {
  const first = history[0]?.price ?? 0;
  const last = history[history.length - 1]?.price ?? 0;
  const falling = last <= first;

  return (
    <div className="rounded-3xl bg-card p-6 ring-1 ring-border">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-lg font-bold text-foreground">30-day price trend</h3>
          <p className="text-xs text-muted-foreground">{title} · all stores, KES</p>
        </div>
        <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-brand-deep">
          {falling ? "Good time to buy" : "Prices rising"}
        </span>
      </div>

      <div className="mt-4 h-48">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={history} margin={{ top: 8, right: 4, bottom: 0, left: 4 }}>
            <defs>
              <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.35} />
                <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="day"
              tickFormatter={(value: string) => value.slice(5)}
              tick={{ fontSize: 10 }}
              interval={9}
              stroke="var(--color-muted-foreground)"
            />
            <YAxis
              width={64}
              tick={{ fontSize: 10 }}
              stroke="var(--color-muted-foreground)"
              tickFormatter={(value: number) => `${Math.round(value / 1000)}k`}
            />
            <Tooltip
              formatter={(value: number) => formatMoney(value)}
              contentStyle={{
                borderRadius: 12,
                border: "1px solid var(--color-border)",
                background: "var(--color-card)",
                fontSize: 12,
              }}
            />
            <Area
              type="monotone"
              dataKey="price"
              stroke="var(--color-chart-1)"
              strokeWidth={2}
              fill="url(#trendFill)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-2 flex justify-between text-[10px] font-medium text-muted-foreground">
        <span>30 days ago · {formatMoney(first)}</span>
        <span>Today · {formatMoney(last)}</span>
      </div>
    </div>
  );
}
