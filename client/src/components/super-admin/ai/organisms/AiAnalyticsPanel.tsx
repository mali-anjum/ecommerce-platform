"use client";

import { useEffect } from "react";
import {
  Bot,
  MessageSquare,
  Percent,
  ShoppingCart,
  UserPlus,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { KpiCard } from "@/components/super-admin/analytics/atoms/KpiCard";
import {
  formatNumber,
} from "@/components/super-admin/analytics/utils/formatters";
import { formatOrderStatus, formatTimelineDate } from "@/components/common/utils/formatDates";
import {
  useAiAnalyticsStore,
  type AiAnalyticsPeriod,
} from "@/components/super-admin/ai/state/useAiAnalyticsStore";

const PERIOD_OPTIONS: Array<{ value: AiAnalyticsPeriod; label: string }> = [
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
];

function formatIntent(intent: string): string {
  return formatOrderStatus(intent);
}

function QueryList({
  title,
  description,
  items,
  emptyMessage,
}: {
  title: string;
  description: string;
  items: Array<{ query: string; count: number }>;
  emptyMessage: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">{emptyMessage}</p>
        ) : (
          <ol className="space-y-3">
            {items.map((item, index) => (
              <li
                key={`${item.query}-${index}`}
                className="flex items-start justify-between gap-3 rounded-lg border border-glass-border px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">#{index + 1}</p>
                  <p className="text-sm font-medium wrap-break-word">{item.query}</p>
                </div>
                <Badge variant="secondary">{item.count}</Badge>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}

export function AiAnalyticsPanel() {
  const period = useAiAnalyticsStore((s) => s.period);
  const dashboard = useAiAnalyticsStore((s) => s.dashboard);
  const isLoading = useAiAnalyticsStore((s) => s.isLoading);
  const error = useAiAnalyticsStore((s) => s.error);
  const setPeriod = useAiAnalyticsStore((s) => s.setPeriod);
  const fetchDashboard = useAiAnalyticsStore((s) => s.fetchDashboard);

  useEffect(() => {
    void fetchDashboard(period);
  }, [fetchDashboard, period]);

  const summary = dashboard?.summary;

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Bot className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Conversation Analytics</h1>
            <p className="text-muted-foreground">
              AI assistant usage, conversion, and lead insights.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Select
            value={period}
            onValueChange={(value) => setPeriod(value as AiAnalyticsPeriod)}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Period" />
            </SelectTrigger>
            <SelectContent>
              {PERIOD_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={() => void fetchDashboard(period)}
            disabled={isLoading}
          >
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {isLoading && !dashboard && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-28 rounded-xl border border-glass-border bg-card/40 animate-pulse"
            />
          ))}
        </div>
      )}

      {summary && (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <KpiCard
              title="Total conversations"
              value={formatNumber(summary.totalConversations)}
              changePercent={summary.conversationChangePercent}
              icon={MessageSquare}
            />
            <KpiCard
              title="Unique users"
              value={formatNumber(summary.uniqueUsers)}
              icon={Users}
              accent="secondary"
            />
            <KpiCard
              title="Chat to order conversion"
              value={`${summary.conversionRate}%`}
              hint={`${summary.convertedConversations} converted chats`}
              icon={Percent}
              accent="success"
            />
            <KpiCard
              title="Leads generated"
              value={formatNumber(summary.leadsGenerated)}
              changePercent={summary.leadsChangePercent}
              icon={UserPlus}
              accent="accent"
            />
            <KpiCard
              title="Sales offers"
              value={formatNumber(summary.salesOffersGenerated)}
              hint={`${summary.salesEmailsSent} follow-up emails sent`}
              icon={ShoppingCart}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <QueryList
              title="Most asked questions"
              description="Top customer questions grouped by normalized text."
              items={dashboard.mostAskedQuestions}
              emptyMessage="No conversations in this period."
            />
            <QueryList
              title="Top product queries"
              description="Product recommendation requests from the assistant."
              items={dashboard.topProductQueries}
              emptyMessage="No product recommendation queries yet."
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle>Intent breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {dashboard.intentBreakdown.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No data yet.</p>
                ) : (
                  dashboard.intentBreakdown.map((item) => (
                    <div
                      key={item.intent}
                      className="flex items-center justify-between rounded-lg border border-glass-border px-3 py-2"
                    >
                      <span className="text-sm">{formatIntent(item.intent)}</span>
                      <Badge variant="outline">{item.count}</Badge>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4" />
                  Recent conversations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Query</TableHead>
                      <TableHead>Intent</TableHead>
                      <TableHead>Converted</TableHead>
                      <TableHead>When</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dashboard.recentConversations.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-muted-foreground">
                          No conversations logged yet.
                        </TableCell>
                      </TableRow>
                    ) : (
                      dashboard.recentConversations.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="max-w-xs truncate font-medium">
                            {log.query}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {formatIntent(log.intent)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {log.convertedToOrder ? (
                              <Badge>Yes</Badge>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell>{formatTimelineDate(log.createdAt)}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
