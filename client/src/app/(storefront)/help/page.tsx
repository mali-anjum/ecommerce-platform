"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { HelpCircle, MessageCircle, PackageSearch, ShieldCheck } from "lucide-react";

type FaqItem = {
  id: string;
  question: string;
  answer: string;
  href: string | null;
};

const FALLBACK_FAQ: FaqItem[] = [
  {
    id: "fallback-1",
    question: "How do I track my order?",
    answer:
      "Use the Track Order page and enter your order ID to see delivery status and updates.",
    href: "/track-order",
  },
  {
    id: "fallback-2",
    question: "How can I request a refund?",
    answer:
      "Open your account orders, select the item, and submit a return/refund request from the order details.",
    href: "/orders",
  },
  {
    id: "fallback-3",
    question: "How do I change my address?",
    answer:
      "Go to Addresses in your account menu to add or update shipping addresses.",
    href: "/addresses",
  },
];

export default function HelpPage() {
  const [faqItems, setFaqItems] = useState<FaqItem[]>(FALLBACK_FAQ);

  useEffect(() => {
    async function loadFaqs() {
      try {
        const res = await fetch("/api/ai/faq");
        const payload = await res.json();
        if (res.ok && payload.success && Array.isArray(payload.data?.faqs)) {
          setFaqItems(payload.data.faqs);
        }
      } catch {
        // Keep fallback FAQ
      }
    }

    void loadFaqs();
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-card/30 py-10">
      <div className="container mx-auto max-w-5xl px-4">
        <div className="mb-8 rounded-2xl border border-glass-border glass-effect p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-r from-primary to-secondary">
              <HelpCircle className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Help Center</h1>
              <p className="text-muted-foreground">
                Quick answers and support links for your shopping experience.
              </p>
            </div>
          </div>
        </div>

        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <Card className="border-border/70 bg-card/95">
            <CardContent className="flex items-center gap-3 p-4">
              <PackageSearch className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Order support</p>
                <p className="font-medium">Tracking and delivery</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/70 bg-card/95">
            <CardContent className="flex items-center gap-3 p-4">
              <ShieldCheck className="h-5 w-5 text-secondary" />
              <div>
                <p className="text-sm text-muted-foreground">Account safety</p>
                <p className="font-medium">Security and access</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/70 bg-card/95">
            <CardContent className="flex items-center gap-3 p-4">
              <MessageCircle className="h-5 w-5 text-accent" />
              <div>
                <p className="text-sm text-muted-foreground">Need more help?</p>
                <p className="font-medium">Use the shopping assistant</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-border/70 bg-card/95">
          <CardHeader>
            <CardTitle>Frequently asked questions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {faqItems.map((item) => (
              <div key={item.id} className="rounded-lg border border-border/70 p-4">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <h2 className="font-semibold text-foreground">{item.question}</h2>
                  <Badge variant="outline">Popular</Badge>
                </div>
                <p className="mb-3 text-sm text-muted-foreground">{item.answer}</p>
                {item.href && (
                  <Button asChild variant="outline" size="sm">
                    <Link href={item.href}>Open related page</Link>
                  </Button>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
