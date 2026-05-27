import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import { formatPercent } from "./formatters";

interface KpiCardProps {
  title: string;
  value: string;
  changePercent?: number;
  hint?: string;
  icon: LucideIcon;
  accent?: "primary" | "secondary" | "accent" | "success" | "warning";
}

const accentMap = {
  primary: "from-primary/20 to-primary/5 text-primary",
  secondary: "from-secondary/20 to-secondary/5 text-secondary",
  accent: "from-accent/20 to-accent/5 text-accent",
  success: "from-success/20 to-success/5 text-success",
  warning: "from-warning/20 to-warning/5 text-warning",
};

export function KpiCard({
  title,
  value,
  changePercent,
  hint,
  icon: Icon,
  accent = "primary",
}: KpiCardProps) {
  const isPositive = (changePercent ?? 0) >= 0;

  return (
    <Card className="glass-effect border-glass-border overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              {title}
            </p>
            <p className="text-2xl font-bold text-foreground">{value}</p>
            {changePercent !== undefined && (
              <p
                className={cn(
                  "text-xs font-medium",
                  isPositive ? "text-success" : "text-destructive",
                )}
              >
                {formatPercent(changePercent)} vs previous period
              </p>
            )}
            {hint && (
              <p className="text-xs text-muted-foreground">{hint}</p>
            )}
          </div>
          <div
            className={cn(
              "h-11 w-11 rounded-xl bg-gradient-to-br flex items-center justify-center shrink-0",
              accentMap[accent],
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
