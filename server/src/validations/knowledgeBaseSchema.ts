import { z } from "zod";

export const createManualKnowledgeBaseSchema = z.object({
  title: z.string().min(1).max(300),
  content: z.string().min(1).max(100_000),
  isActive: z.boolean().optional(),
});

export const updateKnowledgeBaseSchema = z.object({
  title: z.string().min(1).max(300).optional(),
  content: z.string().min(1).max(100_000).optional(),
  isActive: z.boolean().optional(),
});
