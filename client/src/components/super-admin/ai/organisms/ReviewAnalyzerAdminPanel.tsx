"use client";

import { useEffect } from "react";
import {
  AlertTriangle,
  BarChart3,
  MessageSquareWarning,
  RefreshCw,
  Star,
  TrendingDown,
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
import { formatNumber } from "@/components/super-admin/analytics/utils/formatters";
import { useReviewAnalyzerStore } from "@/components/super-admin/ai/state/useReviewAnalyzerStore";
import type { ReviewAnalyzerPeriod } from "@/lib/review-analyzer/types";

const PERIOD_OPTIONS: Array<{ value: ReviewAnalyzerPeriod; label: string }> = [
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
];

function formatDelta(value: number | null): string {
  if (value == null) return "—";
  const prefix = value > 0 ? "+" : "";
  return `${prefix}${value}%`;
}

export function ReviewAnalyzerAdminPanel() {
  const {
    period,
    dashboard,
    isLoading,
    error,
    setPeriod,
    fetchDashboard,
    refreshAnalysis,
  } = useReviewAnalyzerStore();

  useEffect(() => {
    void fetchDashboard(period);
  }, [period, fetchDashboard]);

  const summary = dashboard?.summary;

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-linear-to-r from-amber-500 to-orange-600">
            <MessageSquareWarning className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">AI Review Analyzer</h1>
            <p className="text-sm text-muted-foreground">
              Groups customer feedback, surfaces top complaints, and generates seller reports
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={period}
            onValueChange={(value) => setPeriod(value as ReviewAnalyzerPeriod)}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue />
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
            Reload
          </Button>
          <Button
            onClick={() => void refreshAnalysis()}
            disabled={isLoading}
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
            />
            Re-analyze
          </Button>
        </div>
      </div>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      {dashboard?.reportNarrative ? (
        <Card className="border-amber-200/60 bg-amber-50/40 dark:bg-amber-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">AI report summary</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground whitespace-pre-wrap">
            {dashboard.reportNarrative}
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="Reviews analyzed"
          value={formatNumber(summary?.totalReviews ?? 0)}
          icon={BarChart3}
          changePercent={summary?.reviewsChangePercent ?? undefined}
        />
        <KpiCard
          title="Average rating"
          value={`${summary?.averageRating ?? 0}/5`}
          icon={Star}
          accent="success"
        />
        <KpiCard
          title="Negative sentiment"
          value={formatNumber(summary?.negativeReviews ?? 0)}
          icon={TrendingDown}
          accent="warning"
        />
        <KpiCard
          title="Themes tagged"
          value={formatNumber(summary?.analyzedCount ?? 0)}
          icon={AlertTriangle}
          accent="accent"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top complaints</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Theme</TableHead>
                <TableHead>Mentions</TableHead>
                <TableHead>Share</TableHead>
                <TableHead>vs prior period</TableHead>
                <TableHead>Sample feedback</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(dashboard?.topComplaints ?? []).map((complaint, index) => (
                <TableRow key={complaint.theme}>
                  <TableCell className="font-medium">{index + 1}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{complaint.label}</Badge>
                  </TableCell>
                  <TableCell>{complaint.count}</TableCell>
                  <TableCell>{complaint.sharePercent}%</TableCell>
                  <TableCell>{formatDelta(complaint.changePercent)}</TableCell>
                  <TableCell className="max-w-md text-sm text-muted-foreground">
                    {complaint.sampleQuotes[0] ?? "—"}
                  </TableCell>
                </TableRow>
              ))}
              {!isLoading && (dashboard?.topComplaints.length ?? 0) === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No reviews in this period. Run seed or collect customer reviews on delivered orders.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {(dashboard?.themeGroups ?? []).map((group) => (
          <Card key={group.theme}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base">{group.label}</CardTitle>
              <Badge>{group.count} reviews</Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              {group.reviews.map((review) => (
                <div
                  key={review.id}
                  className="rounded-lg border bg-muted/30 p-3 text-sm"
                >
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <span className="font-medium">{review.productName}</span>
                    <span className="text-xs text-muted-foreground">
                      {review.rating}/5
                    </span>
                  </div>
                  <p className="text-muted-foreground">{review.body}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      {dashboard?.lastAnalyzedAt ? (
        <p className="text-xs text-muted-foreground">
          Last analyzed: {new Date(dashboard.lastAnalyzedAt).toLocaleString()}
        </p>
      ) : null}
    </div>
  );
}
