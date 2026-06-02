"use client";

import { BookOpen, FileText, HelpCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FaqManagementPanel } from "@/components/super-admin/ai/organisms/FaqManagementPanel";
import { KnowledgeBasePanel } from "@/components/super-admin/ai/organisms/KnowledgeBasePanel";
import { StorePoliciesPanel } from "@/components/super-admin/ai/organisms/StorePoliciesPanel";

type AiKnowledgeTab = "policies" | "faq" | "documents";

type AiKnowledgeHubProps = {
  defaultTab?: AiKnowledgeTab;
};

export function AiKnowledgeHub({ defaultTab = "policies" }: AiKnowledgeHubProps) {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <BookOpen className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">AI knowledge</h1>
          <p className="text-muted-foreground">
            Policies, FAQs, and documents used by the shopping assistant.
          </p>
        </div>
      </div>

      <Tabs defaultValue={defaultTab} className="space-y-6">
        <TabsList className="grid w-full max-w-lg grid-cols-3">
          <TabsTrigger value="policies" className="gap-2">
            <BookOpen className="h-4 w-4" />
            Policies
          </TabsTrigger>
          <TabsTrigger value="faq" className="gap-2">
            <HelpCircle className="h-4 w-4" />
            FAQ
          </TabsTrigger>
          <TabsTrigger value="documents" className="gap-2">
            <FileText className="h-4 w-4" />
            Documents
          </TabsTrigger>
        </TabsList>

        <TabsContent value="policies">
          <StorePoliciesPanel />
        </TabsContent>
        <TabsContent value="faq">
          <FaqManagementPanel embedded />
        </TabsContent>
        <TabsContent value="documents">
          <KnowledgeBasePanel embedded />
        </TabsContent>
      </Tabs>
    </div>
  );
}
