"use client";

import { useEffect } from "react";
import {
  Bot,
  Mail,
  Percent,
  Sparkles,
  Target,
  TrendingUp,
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
import { formatNumber } from "@/components/super-admin/analytics/utils/formatters";
import { formatOrderStatus, formatTimelineDate } from "@/components/common/utils/formatDates";
import {
  useSalesAgentAdminStore,
  type SalesAgentPeriod,
} from "@/components/super-admin/ai/state/useSalesAgentAdminStore";
import { formatSegmentLabel } from "@/lib/sales-agent/types";

const PERIOD_OPTIONS: Array<{ value: SalesAgentPeriod; label: string }> = [
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
];

export function SalesAgentAdminPanel() {
  const { period, dashboard, isLoading, error, setPeriod, fetchDashboard } =
    useSalesAgentAdminStore();

  useEffect(() => {
    void fetchDashboard(period);
  }, [period, fetchDashboard]);

  const summary = dashboard?.summary;

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-linear-to-r from-primary to-secondary">
            <Bot className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">AI Sales Agent</h1>
            <p className="text-sm text-muted-foreground">
              Intent scoring, segments, offers, and email automation queue
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={period}
            onValueChange={(value) => setPeriod(value as SalesAgentPeriod)}
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
            Refresh
          </Button>
        </div>
      </div>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      {isLoading && !dashboard ? (
        <p className="text-muted-foreground">Loading sales agent data…</p>
      ) : null}

      {summary ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard
              title="Offers generated"
              value={formatNumber(summary.offersGenerated)}
              changePercent={summary.offersChangePercent}
              icon={Sparkles}
            />
            <KpiCard
              title="Avg intent score"
              value={String(summary.avgIntentScore)}
              hint="0–100 purchase intent"
              icon={Target}
              accent="secondary"
            />
            <KpiCard
              title="Offer conversion"
              value={`${summary.offerConversionRate}%`}
              hint={`${summary.offersConverted} converted`}
              icon={Percent}
              accent="success"
            />
            <KpiCard
              title="Emails sent"
              value={formatNumber(summary.emailsSent)}
              hint={`${summary.emailsQueued} queued · ${summary.emailsFailed} failed`}
              icon={Mail}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Users className="h-4 w-4" />
                  Customer segments
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {dashboard.segmentBreakdown.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No profiles yet.</p>
                ) : (
                  dashboard.segmentBreakdown.map((row) => (
                    <div
                      key={row.segment}
                      className="flex items-center justify-between rounded-lg border border-border/70 px-3 py-2"
                    >
                      <span className="text-sm">{row.label}</span>
                      <Badge variant="secondary">{row.count}</Badge>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <TrendingUp className="h-4 w-4" />
                  Intent score distribution
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {dashboard.scoreDistribution.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No offers yet.</p>
                ) : (
                  dashboard.scoreDistribution.map((row) => (
                    <div
                      key={row.bucket}
                      className="flex items-center justify-between rounded-lg border border-border/70 px-3 py-2"
                    >
                      <span className="text-sm">{row.bucket}</span>
                      <Badge variant="outline">{row.count}</Badge>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Trigger breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {dashboard.triggerBreakdown.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No triggers fired.</p>
                ) : (
                  dashboard.triggerBreakdown.map((row) => (
                    <div
                      key={row.trigger}
                      className="flex items-center justify-between rounded-lg border border-border/70 px-3 py-2"
                    >
                      <span className="text-sm">{formatOrderStatus(row.trigger)}</span>
                      <Badge variant="secondary">{row.count}</Badge>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent offers</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Intent</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Segment</TableHead>
                    <TableHead>Trigger</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>When</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dashboard.recentOffers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-muted-foreground">
                        No offers in this period.
                      </TableCell>
                    </TableRow>
                  ) : (
                    dashboard.recentOffers.map((offer) => (
                      <TableRow key={offer.id}>
                        <TableCell className="max-w-[200px] truncate font-medium">
                          {offer.intentSummary}
                        </TableCell>
                        <TableCell>{offer.intentScore}</TableCell>
                        <TableCell>{formatSegmentLabel(offer.segment)}</TableCell>
                        <TableCell>{formatOrderStatus(offer.triggerReason)}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{formatOrderStatus(offer.status)}</Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {offer.email ?? "—"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatTimelineDate(offer.createdAt)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Email automation queue</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>To</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Scheduled</TableHead>
                    <TableHead>Sent</TableHead>
                    <TableHead>Attempts</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dashboard.recentEmailJobs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-muted-foreground">
                        No email jobs in this period.
                      </TableCell>
                    </TableRow>
                  ) : (
                    dashboard.recentEmailJobs.map((job) => (
                      <TableRow key={job.id}>
                        <TableCell>{job.toEmail}</TableCell>
                        <TableCell>{formatOrderStatus(job.jobType)}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{formatOrderStatus(job.status)}</Badge>
                        </TableCell>
                        <TableCell>{formatTimelineDate(job.scheduledAt)}</TableCell>
                        <TableCell>
                          {job.sentAt ? formatTimelineDate(job.sentAt) : "—"}
                        </TableCell>
                        <TableCell>{job.attempts}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}
