import { redirect } from "next/navigation";

export default function LegacyFaqPage() {
  redirect("/super-admin/ai/knowledge?tab=faq");
}
