"use client";

import { useEffect, useState } from "react";
import { Headphones } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/hooks/use-toast";
import { useSupportTicketsStore } from "@/components/super-admin/ai/state/useSupportTicketsStore";

function formatDate(value: string): string {
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function SuperAdminSupportTicketsPage() {
  const { toast } = useToast();
  const { tickets, isLoading, error, fetchTickets, closeTicket, replyToTicket } =
    useSupportTicketsStore();
  const [statusFilter, setStatusFilter] = useState<"all" | "OPEN" | "CLOSED">(
    "OPEN",
  );
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});

  useEffect(() => {
    void fetchTickets(statusFilter);
  }, [fetchTickets, statusFilter]);

  useEffect(() => {
    if (error) {
      toast({ title: "Error", description: error, variant: "destructive" });
    }
  }, [error, toast]);

  const openCount = tickets.filter((ticket) => ticket.status === "OPEN").length;

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Headphones className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Support Tickets</h1>
            <p className="text-muted-foreground">
              Human handoffs from the AI assistant.
            </p>
          </div>
        </div>
        <Select
          value={statusFilter}
          onValueChange={(value) =>
            setStatusFilter(value as "all" | "OPEN" | "CLOSED")
          }
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Filter status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="OPEN">Open</SelectItem>
            <SelectItem value="CLOSED">Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Open tickets: {openCount}</CardTitle>
        </CardHeader>
      </Card>

      <div className="space-y-4">
        {tickets.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-muted-foreground">
              No support tickets in this view.
            </CardContent>
          </Card>
        ) : (
          tickets.map((ticket) => (
            <Card key={ticket.id}>
              <CardHeader className="flex flex-row items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-base">
                    Ticket {ticket.id.slice(0, 8)}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Updated {formatDate(ticket.updatedAt)}
                  </p>
                </div>
                <Badge variant={ticket.status === "OPEN" ? "default" : "outline"}>
                  {ticket.status}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="max-h-56 space-y-2 overflow-y-auto rounded-lg border p-3">
                  {ticket.messages.map((message, index) => (
                    <div key={`${ticket.id}-${index}`} className="text-sm">
                      <span className="font-medium capitalize">{message.role}: </span>
                      <span>{message.content}</span>
                    </div>
                  ))}
                </div>
                {ticket.status === "OPEN" && (
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Input
                      value={replyDrafts[ticket.id] ?? ""}
                      onChange={(e) =>
                        setReplyDrafts((prev) => ({
                          ...prev,
                          [ticket.id]: e.target.value,
                        }))
                      }
                      placeholder="Agent reply…"
                    />
                    <Button
                      variant="outline"
                      disabled={isLoading || !(replyDrafts[ticket.id] ?? "").trim()}
                      onClick={async () => {
                        const message = replyDrafts[ticket.id]?.trim();
                        if (!message) return;
                        const ok = await replyToTicket(ticket.id, message);
                        if (ok) {
                          setReplyDrafts((prev) => ({ ...prev, [ticket.id]: "" }));
                          toast({ title: "Reply sent" });
                        }
                      }}
                    >
                      Reply
                    </Button>
                    <Button
                      variant="secondary"
                      disabled={isLoading}
                      onClick={async () => {
                        const ok = await closeTicket(ticket.id);
                        if (ok) toast({ title: "Ticket closed" });
                      }}
                    >
                      Close
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
