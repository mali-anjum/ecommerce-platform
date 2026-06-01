import type { AssistantKnowledgeContext, ChatHistoryMessage } from "./types";

function formatPolicies(context: AssistantKnowledgeContext): string {
  const { policies } = context;
  const international = policies.shipsInternationally
    ? `Yes. ${policies.internationalShippingDetails || "International shipping is available."}`
    : "No. We currently ship domestically only.";

  return [
    "## Store policies",
    `Return policy: ${policies.returnPolicy || "Not specified."}`,
    `Shipping policy: ${policies.shippingPolicy || "Not specified."}`,
    `International shipping: ${international}`,
    policies.supportEmail
      ? `Support email: ${policies.supportEmail}`
      : "Support email: not configured.",
  ].join("\n");
}

function formatFaqs(context: AssistantKnowledgeContext): string {
  if (context.faqs.length === 0) {
    return "## FAQ\nNo FAQ entries configured.";
  }

  const lines = context.faqs.map(
    (faq, index) =>
      `${index + 1}. Q: ${faq.question}\n   A: ${faq.answer}${
        faq.href ? `\n   Link: ${faq.href}` : ""
      }`,
  );

  return ["## FAQ", ...lines].join("\n");
}

function formatProducts(context: AssistantKnowledgeContext): string {
  if (context.products.length === 0) {
    return "## Product catalog\nNo active products found.";
  }

  const lines = context.products.map((product) => {
    const discount =
      product.discountPercent != null && product.discountPercent > 0
        ? ` (${product.discountPercent}% off)`
        : "";
    return [
      `- [${product.id}] ${product.name} by ${product.brand}`,
      `  Category: ${product.category} | Condition: ${product.condition}`,
      `  Price: $${product.price.toFixed(2)}${discount} | Stock: ${product.stock}`,
      `  Summary: ${product.description}`,
    ].join("\n");
  });

  return ["## Product catalog (relevant items)", ...lines].join("\n");
}

function formatCoupons(context: AssistantKnowledgeContext): string {
  if (context.coupons.length === 0) {
    return "## Coupons\nNo active coupons.";
  }

  const lines = context.coupons.map((coupon) => {
    const min =
      coupon.minOrderValue != null
        ? ` Min order: $${coupon.minOrderValue}.`
        : "";
    const max =
      coupon.maxDiscount != null
        ? ` Max discount: $${coupon.maxDiscount}.`
        : "";
    return `- ${coupon.code}: ${coupon.discountPercent}% off.${min}${max}`;
  });

  return ["## Active coupons (optional context)", ...lines].join("\n");
}

function formatKnowledgeDocuments(context: AssistantKnowledgeContext): string {
  if (context.documents.length === 0) {
    return "## Uploaded knowledge base\nNo documents indexed.";
  }

  const lines = context.documents.map(
    (doc, index) =>
      `${index + 1}. ${doc.title} (${doc.sourceType})\n${doc.content}`,
  );

  return ["## Uploaded knowledge base", ...lines].join("\n\n");
}

export function buildAssistantSystemPrompt(
  context: AssistantKnowledgeContext,
  options?: { focus?: string },
): string {
  const knowledge = [
    formatPolicies(context),
    formatFaqs(context),
    formatKnowledgeDocuments(context),
    formatProducts(context),
    formatCoupons(context),
  ].join("\n\n");

  const focusLine = options?.focus ? `\nFocus: ${options.focus}\n` : "";

  return `You are a helpful shopping assistant for an e-commerce store.
${focusLine}
Rules:
- Answer using ONLY the knowledge below. If the answer is not in the knowledge, say you do not have that information and suggest visiting the Help Center or contacting support.
- Be concise, friendly, and accurate. Do not invent prices, stock, policies, or coupon codes.
- For product questions, reference product names and IDs from the catalog section when relevant.
- For policy questions (returns, shipping, international), use the store policies, FAQ, and uploaded knowledge base sections.
- Never request or store passwords, payment card numbers, or other sensitive data.
- If the user asks for medical, legal, or financial advice beyond store policies, decline politely.

${knowledge}`;
}

export function buildChatMessages(
  systemPrompt: string,
  userMessage: string,
  history: ChatHistoryMessage[] = [],
): Array<{ role: "system" | "user" | "assistant"; content: string }> {
  const trimmedHistory = history.slice(-8);

  return [
    { role: "system", content: systemPrompt },
    ...trimmedHistory.map((entry) => ({
      role: entry.role,
      content: entry.content,
    })),
    { role: "user", content: userMessage },
  ];
}
