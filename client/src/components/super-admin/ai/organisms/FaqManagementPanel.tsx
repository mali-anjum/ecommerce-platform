"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { HelpCircle, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/components/ui/hooks/use-toast";
import {
  useFaqStore,
  type FaqRecord,
  type SaveFaqPayload,
} from "@/components/super-admin/ai/state/useFaqStore";

const emptyDraft = (): Partial<FaqRecord> => ({
  question: "",
  answer: "",
  href: "",
  sortOrder: 0,
  isActive: true,
});

type FaqManagementPanelProps = {
  /** When true, omits page title (used inside AI Knowledge hub tabs). */
  embedded?: boolean;
};

export function FaqManagementPanel({ embedded = false }: FaqManagementPanelProps) {
  const { toast } = useToast();
  const { faqs, isLoading, error, fetchFaqs, saveFaq, deleteFaq } = useFaqStore();
  const [draft, setDraft] = useState<Partial<FaqRecord> | null>(null);

  useEffect(() => {
    void fetchFaqs();
  }, [fetchFaqs]);

  useEffect(() => {
    if (error) {
      toast({ title: "Error", description: error, variant: "destructive" });
    }
  }, [error, toast]);

  const openCreate = () => {
    setDraft({ ...emptyDraft(), sortOrder: faqs.length });
  };

  const openEdit = (faq: FaqRecord) => {
    setDraft({ ...faq });
  };

  const handleSave = async () => {
    if (!draft?.question?.trim() || !draft?.answer?.trim()) {
      toast({
        title: "Validation",
        description: "Question and answer are required.",
        variant: "destructive",
      });
      return;
    }

    const payload: SaveFaqPayload = {
      id: draft.id,
      question: draft.question.trim(),
      answer: draft.answer.trim(),
      href: draft.href?.trim() || null,
      sortOrder: draft.sortOrder ?? 0,
      isActive: draft.isActive ?? true,
    };

    const ok = await saveFaq(payload);
    if (ok) {
      toast({
        title: "Saved",
        description: draft.id ? "FAQ updated." : "FAQ created.",
      });
      setDraft(null);
    }
  };

  const handleDelete = async (faq: FaqRecord) => {
    const ok = await deleteFaq(faq.id);
    if (ok) {
      toast({ title: "Deleted", description: "FAQ removed from knowledge base." });
      if (draft?.id === faq.id) {
        setDraft(null);
      }
    }
  };

  return (
    <div className={embedded ? "space-y-6" : "space-y-6 p-6"}>
      {!embedded ? (
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <HelpCircle className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">FAQ management</h1>
              <p className="text-muted-foreground">
                Manage questions and answers used by the AI assistant and Help Center.
              </p>
            </div>
          </div>
          <Button onClick={openCreate} disabled={isLoading}>
            <Plus className="mr-2 h-4 w-4" />
            Add FAQ
          </Button>
        </div>
      ) : (
        <div className="flex justify-end">
          <Button onClick={openCreate} disabled={isLoading}>
            <Plus className="mr-2 h-4 w-4" />
            Add FAQ
          </Button>
        </div>
      )}

      {draft && (
        <Card>
          <CardHeader>
            <CardTitle>{draft.id ? "Edit FAQ" : "New FAQ"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="faq-question">Question</Label>
              <Input
                id="faq-question"
                value={draft.question ?? ""}
                onChange={(e) => setDraft({ ...draft, question: e.target.value })}
                placeholder="How do I track my order?"
              />
            </div>
            <div>
              <Label htmlFor="faq-answer">Answer</Label>
              <Textarea
                id="faq-answer"
                rows={4}
                value={draft.answer ?? ""}
                onChange={(e) => setDraft({ ...draft, answer: e.target.value })}
                placeholder="Use the Track Order page and enter your order ID…"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="faq-href">Optional link</Label>
                <Input
                  id="faq-href"
                  value={draft.href ?? ""}
                  onChange={(e) => setDraft({ ...draft, href: e.target.value })}
                  placeholder="/track-order"
                />
              </div>
              <div>
                <Label htmlFor="faq-sort">Sort order</Label>
                <Input
                  id="faq-sort"
                  type="number"
                  min={0}
                  value={draft.sortOrder ?? 0}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      sortOrder: Number.parseInt(e.target.value, 10) || 0,
                    })
                  }
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="faq-active"
                checked={draft.isActive ?? true}
                onCheckedChange={(checked) =>
                  setDraft({ ...draft, isActive: checked === true })
                }
              />
              <Label htmlFor="faq-active">Visible to customers and AI</Label>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => void handleSave()} disabled={isLoading}>
                Save
              </Button>
              <Button variant="outline" onClick={() => setDraft(null)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>All FAQ entries ({faqs.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Question</TableHead>
                <TableHead>Answer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {faqs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-muted-foreground">
                    No FAQ entries yet.{" "}
                    <button
                      type="button"
                      className="text-primary underline"
                      onClick={openCreate}
                    >
                      Add your first FAQ
                    </button>
                  </TableCell>
                </TableRow>
              ) : (
                faqs.map((faq) => (
                  <TableRow key={faq.id}>
                    <TableCell className="max-w-[220px] font-medium">
                      {faq.question}
                      {faq.href && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          Link:{" "}
                          <Link href={faq.href} className="text-primary hover:underline">
                            {faq.href}
                          </Link>
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="max-w-md truncate text-muted-foreground">
                      {faq.answer}
                    </TableCell>
                    <TableCell>
                      <Badge variant={faq.isActive ? "default" : "secondary"}>
                        {faq.isActive ? "Active" : "Hidden"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEdit(faq)}
                          aria-label={`Edit ${faq.question}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => void handleDelete(faq)}
                          aria-label={`Delete ${faq.question}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
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
