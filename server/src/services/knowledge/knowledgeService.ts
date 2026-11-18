import { prisma } from "../../lib/prisma";

export class KnowledgeService {
  async listPublicFaqs() {
    return prisma.faqItem.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      select: {
        id: true,
        question: true,
        answer: true,
        href: true,
        sortOrder: true,
      },
    });
  }

  async listAllFaqsForAdmin() {
    return prisma.faqItem.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });
  }

  async createFaqItem(data: {
    question: string;
    answer: string;
    href?: string | null;
    sortOrder?: number;
    isActive?: boolean;
  }) {
    return prisma.faqItem.create({
      data: {
        question: data.question,
        answer: data.answer,
        href: data.href ?? null,
        sortOrder: data.sortOrder ?? 0,
        isActive: data.isActive ?? true,
      },
    });
  }

  async updateFaqItem(
    id: string,
    data: {
      question?: string;
      answer?: string;
      href?: string | null;
      sortOrder?: number;
      isActive?: boolean;
    },
  ) {
    return prisma.faqItem.update({
      where: { id },
      data,
    });
  }

  async deleteFaqItem(id: string) {
    return prisma.faqItem.delete({ where: { id } });
  }

  async getStorePolicies() {
    const row = await prisma.storePolicySettings.findUnique({
      where: { id: "default" },
    });

    if (row) {
      return row;
    }

    return prisma.storePolicySettings.create({
      data: { id: "default" },
    });
  }

  async updateStorePolicies(data: {
    returnPolicy?: string;
    shippingPolicy?: string;
    shipsInternationally?: boolean;
    internationalShippingDetails?: string;
    supportEmail?: string | null;
  }) {
    await this.getStorePolicies();

    return prisma.storePolicySettings.update({
      where: { id: "default" },
      data,
    });
  }
}

export const knowledgeService = new KnowledgeService();

export const listPublicFaqs = () => knowledgeService.listPublicFaqs();
export const listAllFaqsForAdmin = () => knowledgeService.listAllFaqsForAdmin();
export const createFaqItem = (
  data: Parameters<KnowledgeService["createFaqItem"]>[0],
) => knowledgeService.createFaqItem(data);
export const updateFaqItem = (
  id: string,
  data: Parameters<KnowledgeService["updateFaqItem"]>[1],
) => knowledgeService.updateFaqItem(id, data);
export const deleteFaqItem = (id: string) => knowledgeService.deleteFaqItem(id);
export const getStorePolicies = () => knowledgeService.getStorePolicies();
export const updateStorePolicies = (
  data: Parameters<KnowledgeService["updateStorePolicies"]>[0],
) => knowledgeService.updateStorePolicies(data);
