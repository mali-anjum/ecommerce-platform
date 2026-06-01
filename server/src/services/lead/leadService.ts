import { LeadSource } from "@prisma/client";
import { prisma } from "../../lib/prisma";

export type CreateLeadInput = {
  email: string;
  phone?: string | null;
  message: string;
  source?: LeadSource;
};

export class LeadService {
  async create(input: CreateLeadInput) {
    return prisma.lead.create({
      data: {
        email: input.email.trim().toLowerCase(),
        phone: input.phone?.trim() || null,
        message: input.message.trim(),
        source: input.source ?? LeadSource.AI,
      },
    });
  }

  async list(filters?: { source?: LeadSource }) {
    return prisma.lead.findMany({
      where: filters?.source ? { source: filters.source } : undefined,
      orderBy: { createdAt: "desc" },
    });
  }

  async countBySource() {
    const [ai, manual, total] = await Promise.all([
      prisma.lead.count({ where: { source: LeadSource.AI } }),
      prisma.lead.count({ where: { source: LeadSource.MANUAL } }),
      prisma.lead.count(),
    ]);

    return { ai, manual, total };
  }
}

export const leadService = new LeadService();

export const createLead = (input: CreateLeadInput) => leadService.create(input);
export const listLeads = (filters?: { source?: LeadSource }) =>
  leadService.list(filters);
export const countLeadsBySource = () => leadService.countBySource();
