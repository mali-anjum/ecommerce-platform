import { KnowledgeSourceType } from "@prisma/client";
import { prisma } from "../../lib/prisma";

export type CreateKnowledgeBaseInput = {
  title: string;
  content: string;
  sourceType: KnowledgeSourceType;
  fileUrl?: string | null;
  fileName?: string | null;
  isActive?: boolean;
};

export type UpdateKnowledgeBaseInput = {
  title?: string;
  content?: string;
  isActive?: boolean;
};

export class KnowledgeBaseService {
  async listForAdmin() {
    return prisma.knowledgeBase.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        content: true,
        sourceType: true,
        fileUrl: true,
        fileName: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async listActiveForAi(limit = 8) {
    return prisma.knowledgeBase.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        title: true,
        content: true,
        sourceType: true,
      },
    });
  }

  async create(input: CreateKnowledgeBaseInput) {
    return prisma.knowledgeBase.create({
      data: {
        title: input.title.trim(),
        content: input.content.trim(),
        sourceType: input.sourceType,
        fileUrl: input.fileUrl ?? null,
        fileName: input.fileName ?? null,
        isActive: input.isActive ?? true,
      },
    });
  }

  async update(id: string, input: UpdateKnowledgeBaseInput) {
    return prisma.knowledgeBase.update({
      where: { id },
      data: input,
    });
  }

  async delete(id: string) {
    return prisma.knowledgeBase.delete({ where: { id } });
  }
}

export const knowledgeBaseService = new KnowledgeBaseService();

export const listKnowledgeBaseForAdmin = () =>
  knowledgeBaseService.listForAdmin();

export const listActiveKnowledgeBaseForAi = (limit?: number) =>
  knowledgeBaseService.listActiveForAi(limit);

export const createKnowledgeBaseEntry = (input: CreateKnowledgeBaseInput) =>
  knowledgeBaseService.create(input);

export const updateKnowledgeBaseEntry = (
  id: string,
  input: UpdateKnowledgeBaseInput,
) => knowledgeBaseService.update(id, input);

export const deleteKnowledgeBaseEntry = (id: string) =>
  knowledgeBaseService.delete(id);
