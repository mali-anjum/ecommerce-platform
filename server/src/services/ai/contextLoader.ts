import { prisma } from "../../lib/prisma";
import { listActiveKnowledgeBaseForAi } from "../knowledge/knowledgeBaseService";
import { searchAssistantProductsFromIndex } from "./productIndex";
import type {
  AssistantCouponSnippet,
  AssistantFaqSnippet,
  AssistantKnowledgeContext,
  AssistantPolicyContext,
  AssistantProductSnippet,
} from "./types";

const MAX_PRODUCTS = 8;
const MAX_COUPONS = 5;
const MAX_DOC_CHARS = 4000;

function toProductSnippet(product: {
  id: string;
  name: string;
  brand: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  condition: string;
  discountPercent: number | null;
}): AssistantProductSnippet {
  return {
    id: product.id,
    name: product.name,
    brand: product.brand,
    description: product.description.slice(0, 500),
    price: product.price,
    stock: product.stock,
    category: product.category,
    condition: product.condition,
    discountPercent: product.discountPercent,
  };
}

function extractSearchTerms(message: string): string[] {
  const stopWords = new Set([
    "a",
    "an",
    "the",
    "is",
    "are",
    "what",
    "how",
    "do",
    "you",
    "we",
    "i",
    "my",
    "this",
    "that",
    "about",
    "for",
    "and",
    "or",
    "can",
    "please",
    "tell",
    "me",
    "ship",
    "shipping",
    "return",
    "policy",
    "product",
    "explain",
  ]);

  return message
    .toLowerCase()
    .replace(/[^\w\s-]/g, " ")
    .split(/\s+/)
    .map((word) => word.trim())
    .filter((word) => word.length > 2 && !stopWords.has(word))
    .slice(0, 6);
}

async function loadPolicies(): Promise<AssistantPolicyContext> {
  const row = await prisma.storePolicySettings.findUnique({
    where: { id: "default" },
  });

  if (!row) {
    return {
      returnPolicy: "",
      shippingPolicy: "",
      shipsInternationally: false,
      internationalShippingDetails: "",
      supportEmail: null,
    };
  }

  return {
    returnPolicy: row.returnPolicy,
    shippingPolicy: row.shippingPolicy,
    shipsInternationally: row.shipsInternationally,
    internationalShippingDetails: row.internationalShippingDetails,
    supportEmail: row.supportEmail,
  };
}

async function loadFaqs(): Promise<AssistantFaqSnippet[]> {
  const rows = await prisma.faqItem.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    select: {
      question: true,
      answer: true,
      href: true,
    },
  });

  return rows;
}

async function loadRelevantProducts(
  message: string,
  productId?: string,
): Promise<AssistantProductSnippet[]> {
  const indexed = searchAssistantProductsFromIndex(message, productId);
  if (indexed) {
    return indexed;
  }

  const productSelect = {
    id: true,
    name: true,
    brand: true,
    description: true,
    price: true,
    stock: true,
    category: true,
    condition: true,
    discountPercent: true,
  } as const;

  const snippets: AssistantProductSnippet[] = [];
  const seen = new Set<string>();

  if (productId) {
    const focused = await prisma.product.findFirst({
      where: {
        id: productId,
        isActive: true,
        isArchived: false,
      },
      select: productSelect,
    });
    if (focused) {
      snippets.push(toProductSnippet(focused));
      seen.add(focused.id);
    }
  }

  const terms = extractSearchTerms(message);
  if (terms.length > 0) {
    const searchWhere = {
      isActive: true,
      isArchived: false,
      OR: terms.flatMap((term) => [
        { name: { contains: term, mode: "insensitive" as const } },
        { brand: { contains: term, mode: "insensitive" as const } },
        { description: { contains: term, mode: "insensitive" as const } },
        { category: { contains: term, mode: "insensitive" as const } },
      ]),
    };

    const matched = await prisma.product.findMany({
      where: searchWhere,
      take: MAX_PRODUCTS,
      orderBy: [{ soldCount: "desc" }, { createdAt: "desc" }],
      select: productSelect,
    });

    for (const product of matched) {
      if (seen.has(product.id)) continue;
      snippets.push(toProductSnippet(product));
      seen.add(product.id);
      if (snippets.length >= MAX_PRODUCTS) break;
    }
  }

  if (snippets.length < 3) {
    const featured = await prisma.product.findMany({
      where: { isActive: true, isArchived: false },
      take: MAX_PRODUCTS,
      orderBy: [{ isFeatured: "desc" }, { soldCount: "desc" }],
      select: productSelect,
    });

    for (const product of featured) {
      if (seen.has(product.id)) continue;
      snippets.push(toProductSnippet(product));
      seen.add(product.id);
      if (snippets.length >= MAX_PRODUCTS) break;
    }
  }

  return snippets;
}

async function loadActiveCoupons(): Promise<AssistantCouponSnippet[]> {
  const now = new Date();
  const rows = await prisma.coupon.findMany({
    where: {
      isActive: true,
      startDate: { lte: now },
      endDate: { gte: now },
    },
    orderBy: { discountPercent: "desc" },
    take: MAX_COUPONS,
    select: {
      code: true,
      discountPercent: true,
      minOrderValue: true,
      maxDiscount: true,
      isActive: true,
    },
  });

  return rows;
}

async function loadKnowledgeDocuments() {
  const rows = await listActiveKnowledgeBaseForAi();
  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    sourceType: row.sourceType,
    content:
      row.content.length > MAX_DOC_CHARS
        ? `${row.content.slice(0, MAX_DOC_CHARS)}…`
        : row.content,
  }));
}

export async function loadAssistantKnowledgeContext(
  message: string,
  productId?: string,
): Promise<AssistantKnowledgeContext> {
  const [faqs, policies, products, coupons, documents] = await Promise.all([
    loadFaqs(),
    loadPolicies(),
    loadRelevantProducts(message, productId),
    loadActiveCoupons(),
    loadKnowledgeDocuments(),
  ]);

  return { faqs, policies, products, coupons, documents };
}
