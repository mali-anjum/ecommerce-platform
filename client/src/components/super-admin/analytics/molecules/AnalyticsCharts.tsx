"use client";

import type {
  AnalyticsDashboard,
  CustomerGrowthPoint,
  GeographicRow,
  HourlyDistribution,
  PaymentBreakdown,
  StatusBreakdown,
  TrendPoint,
} from "@/types/analytics";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CHART_COLORS, CHART_PALETTE, chartTooltipStyle } from "../utils/chartTheme";
import { formatCurrency, formatStatusLabel } from "../utils/formatters";

/** SVG gradient — defined outside AreaChart to avoid TS generic/JSX ambiguity on `<defs>`. */
const revenueAreaGradient = (
  <defs>
    <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
      <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.45} />
      <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0} />
    </linearGradient>
  </defs>
);

function ChartCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="glass-effect border border-glass-border rounded-2xl p-5 space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        )}
      </div>
      <div className="h-[280px] w-full">{children}</div>
    </div>
  );
}

export function RevenueTrendChart({ data }: { data: TrendPoint[] }) {
  return (
    <ChartCard
      title="Revenue & orders trend"
      description="Daily GMV and completed order volume (Alibaba-style performance curve)."
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          {revenueAreaGradient}
          <CartesianGrid stroke={CHART_COLORS.grid} strokeDasharray="4 4" />
          <XAxis
            dataKey="date"
            tick={{ fill: CHART_COLORS.muted, fontSize: 11 }}
            tickFormatter={(v: string) => v.slice(5)}
          />
          <YAxis
            yAxisId="left"
            tick={{ fill: CHART_COLORS.muted, fontSize: 11 }}
            tickFormatter={(v: number) => `$${v}`}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            tick={{ fill: CHART_COLORS.muted, fontSize: 11 }}
          />
          <Tooltip contentStyle={chartTooltipStyle} />
          <Legend />
          <Area
            yAxisId="left"
            type="monotone"
            dataKey="revenue"
            name="Revenue"
            stroke={CHART_COLORS.primary}
            fill="url(#revenueFill)"
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="orders"
            name="Orders"
            stroke={CHART_COLORS.secondary}
            strokeWidth={2}
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function OrderStatusChart({ data }: { data: StatusBreakdown[] }) {
  const chartData = data.map((row) => ({
    name: formatStatusLabel(row.status),
    count: row.count,
    revenue: row.revenue,
  }));

  return (
    <ChartCard title="Order pipeline" description="Status mix across the selected period.">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData}>
          <CartesianGrid stroke={CHART_COLORS.grid} strokeDasharray="4 4" />
          <XAxis dataKey="name" tick={{ fill: CHART_COLORS.muted, fontSize: 10 }} />
          <YAxis tick={{ fill: CHART_COLORS.muted, fontSize: 11 }} />
          <Tooltip contentStyle={chartTooltipStyle} />
          <Legend />
          <Bar dataKey="count" name="Orders" fill={CHART_COLORS.primary} radius={[6, 6, 0, 0]} />
          <Bar dataKey="revenue" name="Revenue" fill={CHART_COLORS.secondary} radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function PaymentMethodChart({ data }: { data: PaymentBreakdown[] }) {
  const chartData = data.map((row) => ({
    name: row.method.replace("_", " "),
    value: row.revenue,
    count: row.count,
  }));

  return (
    <ChartCard title="Payment mix" description="Revenue share by payment provider.">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            innerRadius={55}
            outerRadius={95}
            paddingAngle={3}
          >
            {chartData.map((_, index) => (
              <Cell key={index} fill={CHART_PALETTE[index % CHART_PALETTE.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={chartTooltipStyle}
            formatter={(value: number) => formatCurrency(value)}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function HourlyOrdersChart({ data }: { data: HourlyDistribution[] }) {
  const chartData = data.map((row) => ({
    hour: `${String(row.hour).padStart(2, "0")}:00`,
    orders: row.orders,
  }));

  return (
    <ChartCard title="Peak order hours" description="When buyers complete checkout.">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <CartesianGrid stroke={CHART_COLORS.grid} strokeDasharray="4 4" />
          <XAxis dataKey="hour" tick={{ fill: CHART_COLORS.muted, fontSize: 10 }} />
          <YAxis tick={{ fill: CHART_COLORS.muted, fontSize: 11 }} />
          <Tooltip contentStyle={chartTooltipStyle} />
          <Line
            type="monotone"
            dataKey="orders"
            stroke={CHART_COLORS.accent}
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function CustomerGrowthChart({ data }: { data: CustomerGrowthPoint[] }) {
  return (
    <ChartCard title="New customer signups" description="Daily user registrations.">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid stroke={CHART_COLORS.grid} strokeDasharray="4 4" />
          <XAxis dataKey="date" tick={{ fill: CHART_COLORS.muted, fontSize: 10 }} tickFormatter={(v: string) => v.slice(5)} />
          <YAxis tick={{ fill: CHART_COLORS.muted, fontSize: 11 }} />
          <Tooltip contentStyle={chartTooltipStyle} />
          <Bar dataKey="newUsers" name="New users" fill={CHART_COLORS.success} radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function GeographicChart({ data }: { data: GeographicRow[] }) {
  return (
    <ChartCard
      title="Cross-border sales"
      description="Revenue by shipping country (AliExpress-style regional demand)."
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 20 }}>
          <CartesianGrid stroke={CHART_COLORS.grid} strokeDasharray="4 4" />
          <XAxis type="number" tick={{ fill: CHART_COLORS.muted, fontSize: 11 }} />
          <YAxis
            type="category"
            dataKey="country"
            width={90}
            tick={{ fill: CHART_COLORS.muted, fontSize: 11 }}
          />
          <Tooltip contentStyle={chartTooltipStyle} formatter={(v: number) => formatCurrency(v)} />
          <Bar dataKey="revenue" name="Revenue" fill={CHART_COLORS.primary} radius={[0, 6, 6, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function CategoryRevenueChart({
  data,
}: {
  data: AnalyticsDashboard["topCategories"];
}) {
  return (
    <ChartCard title="Category performance" description="Top categories by revenue.">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid stroke={CHART_COLORS.grid} strokeDasharray="4 4" />
          <XAxis dataKey="category" tick={{ fill: CHART_COLORS.muted, fontSize: 10 }} />
          <YAxis tick={{ fill: CHART_COLORS.muted, fontSize: 11 }} />
          <Tooltip contentStyle={chartTooltipStyle} />
          <Bar dataKey="revenue" fill={CHART_COLORS.secondary} radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function FunnelPanel({
  stages,
}: {
  stages: AnalyticsDashboard["conversionFunnel"];
}) {
  return (
    <div className="glass-effect border border-glass-border rounded-2xl p-5 space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Conversion funnel</h3>
        <p className="text-sm text-muted-foreground">
          Visitor-to-fulfillment journey modeled from users, carts, and paid orders.
        </p>
      </div>
      <div className="space-y-3">
        {stages.map((stage, index) => (
          <div key={stage.stage} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-foreground">{stage.stage}</span>
              <span className="text-muted-foreground">
                {stage.count.toLocaleString()} · {stage.rateFromPrevious}%
              </span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary to-secondary transition-all"
                style={{
                  width: `${Math.max(
                    8,
                    (stage.count / Math.max(stages[0]?.count ?? 1, 1)) * 100,
                  )}%`,
                  opacity: 1 - index * 0.12,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function InventoryHealthPanel({
  health,
}: {
  health: AnalyticsDashboard["inventoryHealth"];
}) {
  const total = health.inStock + health.lowStock + health.outOfStock || 1;
  const rows = [
    { label: "Healthy stock", value: health.inStock, color: CHART_COLORS.success },
    { label: "Low stock", value: health.lowStock, color: CHART_COLORS.warning },
    { label: "Out of stock", value: health.outOfStock, color: CHART_COLORS.accent },
  ];

  return (
    <div className="glass-effect border border-glass-border rounded-2xl p-5 space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Inventory health</h3>
        <p className="text-sm text-muted-foreground">Operational risk across your catalog.</p>
      </div>
      <div className="space-y-4">
        {rows.map((row) => (
          <div key={row.label}>
            <div className="flex justify-between text-sm mb-1">
              <span>{row.label}</span>
              <span className="text-muted-foreground">
                {row.value} ({Math.round((row.value / total) * 100)}%)
              </span>
            </div>
            <div className="h-2 rounded-full bg-muted">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${(row.value / total) * 100}%`,
                  backgroundColor: row.color,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DataTablePanel<T extends object>({
  title,
  description,
  columns,
  rows,
}: {
  title: string;
  description?: string;
  columns: { key: keyof T; label: string; render?: (row: T) => React.ReactNode }[];
  rows: T[];
}) {
  return (
    <div className="glass-effect border border-glass-border rounded-2xl overflow-hidden">
      <div className="p-5 border-b border-glass-border">
        <h3 className="text-lg font-semibold">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-glass-border text-muted-foreground">
              {columns.map((col) => (
                <th key={String(col.key)} className="text-left px-5 py-3 font-medium">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-5 py-8 text-center text-muted-foreground"
                >
                  No data for this period
                </td>
              </tr>
            ) : (
              rows.map((row, idx) => (
                <tr
                  key={idx}
                  className="border-b border-glass-border/50 hover:bg-primary/5"
                >
                  {columns.map((col) => (
                    <td key={String(col.key)} className="px-5 py-3">
                      {col.render ? col.render(row) : String(row[col.key] ?? "")}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
