import { redirect } from "next/navigation";

export default function LegacyKnowledgeBasePage() {
  redirect("/super-admin/ai/knowledge?tab=documents");
}
