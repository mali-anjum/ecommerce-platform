"use client";

import { useEffect, useState } from "react";
import { UserPlus, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/hooks/use-toast";
import { formatDateTime } from "@/components/common/utils/formatDates";
import {
  useLeadsStore,
  type LeadSourceFilter,
} from "@/components/super-admin/leads/state/useLeadsStore";

export default function SuperAdminLeadsPage() {
  const { toast } = useToast();
  const { leads, counts, isLoading, error, fetchLeads, createLead } =
    useLeadsStore();
  const [sourceFilter, setSourceFilter] = useState<LeadSourceFilter>("all");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    email: "",
    phone: "",
    message: "",
  });

  useEffect(() => {
    void fetchLeads(sourceFilter);
  }, [fetchLeads, sourceFilter]);

  useEffect(() => {
    if (error) {
      toast({ title: "Error", description: error, variant: "destructive" });
    }
  }, [error, toast]);

  const handleCreate = async () => {
    if (!form.email.trim() || !form.message.trim()) {
      toast({
        title: "Validation",
        description: "Email and message are required.",
        variant: "destructive",
      });
      return;
    }

    const ok = await createLead({
      email: form.email.trim(),
      phone: form.phone.trim() || null,
      message: form.message.trim(),
      source: "MANUAL",
    });

    if (ok) {
      toast({ title: "Lead saved", description: "Manual lead added." });
      setForm({ email: "", phone: "", message: "" });
      setShowForm(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Users className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Leads</h1>
            <p className="text-muted-foreground">
              CRM leads from the AI assistant and manual entries.
            </p>
          </div>
        </div>
        <Button onClick={() => setShowForm((v) => !v)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Add manual lead
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{counts.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">AI assistant</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{counts.ai}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Manual</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{counts.manual}</p>
          </CardContent>
        </Card>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add manual lead</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="lead-email">Email</Label>
              <Input
                id="lead-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="lead-phone">Phone</Label>
              <Input
                id="lead-phone"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="lead-message">Requirement</Label>
              <Textarea
                id="lead-message"
                rows={3}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
              />
            </div>
            <Button onClick={() => void handleCreate()} disabled={isLoading}>
              Save lead
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>All leads</CardTitle>
          <Select
            value={sourceFilter}
            onValueChange={(value) =>
              setSourceFilter(value as LeadSourceFilter)
            }
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Filter source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All sources</SelectItem>
              <SelectItem value="AI">AI assistant</SelectItem>
              <SelectItem value="MANUAL">Manual</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Message</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leads.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-muted-foreground">
                    No leads yet.
                  </TableCell>
                </TableRow>
              ) : (
                leads.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell className="font-medium">{lead.email}</TableCell>
                    <TableCell>{lead.phone ?? "—"}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      {lead.message}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{lead.source}</Badge>
                    </TableCell>
                    <TableCell>{formatDateTime(lead.createdAt)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
