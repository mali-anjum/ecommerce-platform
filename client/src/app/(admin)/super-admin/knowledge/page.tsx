import { redirect } from "next/navigation";

export default function LegacyKnowledgePage() {
  redirect("/super-admin/ai/knowledge?tab=policies");
}
