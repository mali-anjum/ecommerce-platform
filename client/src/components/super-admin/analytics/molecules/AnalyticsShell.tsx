"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  ANALYTICS_PERIOD_OPTIONS,
  type AnalyticsPeriod,
} from "@/components/super-admin/analytics/types/analytics";
import {
  BarChart3,
  Globe2,
  Megaphone,
  Package,
  RefreshCw,
  Settings2,
  ShoppingCart,
  TrendingUp,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const analyticsNav = [
  { href: "/super-admin", label: "Overview", icon: BarChart3, exact: true },
  { href: "/super-admin/analytics/sales", label: "Sales", icon: TrendingUp },
  { href: "/super-admin/analytics/products", label: "Products", icon: Package },
  { href: "/super-admin/analytics/customers", label: "Customers", icon: Users },
  {
    href: "/super-admin/analytics/marketing",
    label: "Marketing",
    icon: Megaphone,
  },
  {
    href: "/super-admin/analytics/operations",
    label: "Operations",
    icon: Settings2,
  },
  {
    href: "/super-admin/analytics/global",
    label: "Global",
    icon: Globe2,
  },
];

interface AnalyticsShellProps {
  title: string;
  subtitle: string;
  period: AnalyticsPeriod;
  onPeriodChange: (period: AnalyticsPeriod) => void;
  onRefresh: () => void;
  loading?: boolean;
  generatedAt?: string;
  children: React.ReactNode;
}

export function AnalyticsShell({
  title,
  subtitle,
  period,
  onPeriodChange,
  onRefresh,
  loading,
  generatedAt,
  children,
}: AnalyticsShellProps) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen p-6 md:p-8 space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-glass-border bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <ShoppingCart className="h-3.5 w-3.5" />
            Commerce Intelligence
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            {title}
          </h1>
          <p className="text-muted-foreground max-w-2xl">{subtitle}</p>
          {generatedAt && (
            <p className="text-xs text-muted-foreground">
              Last updated {new Date(generatedAt).toLocaleString()}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Select
            value={period}
            onValueChange={(value) => onPeriodChange(value as AnalyticsPeriod)}
          >
            <SelectTrigger className="w-[180px] glass-effect border-glass-border">
              <SelectValue placeholder="Period" />
            </SelectTrigger>
            <SelectContent>
              {ANALYTICS_PERIOD_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            className="border-glass-border"
            onClick={onRefresh}
            disabled={loading}
          >
            <RefreshCw
              className={cn("h-4 w-4 mr-2", loading && "animate-spin")}
            />
            Refresh
          </Button>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:thin]">
        {analyticsNav.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "inline-flex items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-all",
                "border border-glass-border",
                isActive
                  ? "bg-gradient-to-r from-primary/20 to-secondary/10 text-primary border-primary/30"
                  : "bg-card/40 text-muted-foreground hover:text-foreground hover:bg-primary/5",
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </div>

      {children}
    </div>
  );
}
