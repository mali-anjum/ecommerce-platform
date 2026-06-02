"use client";

import { useSearchParams } from "next/navigation";
import { AiKnowledgeHub } from "@/components/super-admin/ai/organisms/AiKnowledgeHub";

export default function AiKnowledgePage() {
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab");
  const defaultTab =
    tab === "faq" || tab === "documents" || tab === "policies" ? tab : "policies";

  return <AiKnowledgeHub defaultTab={defaultTab} />;
}
