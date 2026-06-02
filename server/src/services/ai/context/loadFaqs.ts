import { prisma } from "../../../lib/prisma";
import type { AssistantFaqSnippet } from "../types";

export async function loadFaqs(): Promise<AssistantFaqSnippet[]> {
  return prisma.faqItem.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    select: {
      question: true,
      answer: true,
      href: true,
    },
  });
}
