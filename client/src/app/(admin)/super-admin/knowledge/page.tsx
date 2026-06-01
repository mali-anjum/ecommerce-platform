"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/hooks/use-toast";
import { useKnowledgeStore } from "@/components/super-admin/knowledge/state/useKnowledgeStore";

export default function KnowledgeAdminPage() {
  const { toast } = useToast();
  const { policies, isLoading, error, fetchPolicies, savePolicies } =
    useKnowledgeStore();

  const [policyForm, setPolicyForm] = useState({
    returnPolicy: "",
    shippingPolicy: "",
    shipsInternationally: false,
    internationalShippingDetails: "",
    supportEmail: "",
  });

  useEffect(() => {
    void fetchPolicies();
  }, [fetchPolicies]);

  useEffect(() => {
    if (policies) {
      setPolicyForm({
        returnPolicy: policies.returnPolicy,
        shippingPolicy: policies.shippingPolicy,
        shipsInternationally: policies.shipsInternationally,
        internationalShippingDetails: policies.internationalShippingDetails,
        supportEmail: policies.supportEmail ?? "",
      });
    }
  }, [policies]);

  useEffect(() => {
    if (error) {
      toast({ title: "Error", description: error, variant: "destructive" });
    }
  }, [error, toast]);

  const handleSavePolicies = async () => {
    const ok = await savePolicies({
      returnPolicy: policyForm.returnPolicy,
      shippingPolicy: policyForm.shippingPolicy,
      shipsInternationally: policyForm.shipsInternationally,
      internationalShippingDetails: policyForm.internationalShippingDetails,
      supportEmail: policyForm.supportEmail || null,
    });

    if (ok) {
      toast({ title: "Saved", description: "Store policies updated." });
    }
  };

  return (
    <div className="space-y-8 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <BookOpen className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Store policies</h1>
            <p className="text-muted-foreground">
              Shipping and return policies injected into the AI assistant context.
            </p>
          </div>
        </div>
        <Button asChild variant="outline">
          <Link href="/super-admin/ai/faq">
            Manage FAQ
            <ExternalLink className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Policy content</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="return-policy">Return policy</Label>
            <Textarea
              id="return-policy"
              rows={4}
              value={policyForm.returnPolicy}
              onChange={(e) =>
                setPolicyForm({ ...policyForm, returnPolicy: e.target.value })
              }
            />
          </div>
          <div>
            <Label htmlFor="shipping-policy">Shipping policy</Label>
            <Textarea
              id="shipping-policy"
              rows={4}
              value={policyForm.shippingPolicy}
              onChange={(e) =>
                setPolicyForm({ ...policyForm, shippingPolicy: e.target.value })
              }
            />
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="intl-shipping"
              checked={policyForm.shipsInternationally}
              onCheckedChange={(checked) =>
                setPolicyForm({
                  ...policyForm,
                  shipsInternationally: checked === true,
                })
              }
            />
            <Label htmlFor="intl-shipping">Ship internationally</Label>
          </div>
          <div>
            <Label htmlFor="intl-details">International shipping details</Label>
            <Textarea
              id="intl-details"
              rows={3}
              value={policyForm.internationalShippingDetails}
              onChange={(e) =>
                setPolicyForm({
                  ...policyForm,
                  internationalShippingDetails: e.target.value,
                })
              }
            />
          </div>
          <div>
            <Label htmlFor="support-email">Support email</Label>
            <Input
              id="support-email"
              type="email"
              value={policyForm.supportEmail}
              onChange={(e) =>
                setPolicyForm({ ...policyForm, supportEmail: e.target.value })
              }
            />
          </div>
          <Button onClick={() => void handleSavePolicies()} disabled={isLoading}>
            Save policies
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
