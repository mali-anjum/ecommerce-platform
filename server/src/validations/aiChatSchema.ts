import { z } from "zod";

const historyMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(4000),
});

const leadSessionSchema = z.object({
  active: z.boolean(),
  email: z.email().optional(),
  phone: z.string().max(30).nullable().optional(),
  message: z.string().max(5000).optional(),
  initialRequirement: z.string().max(2000).optional(),
});

export const aiChatSchema = z.object({
  message: z.string().min(1, "Message is required").max(2000),
  productId: z.uuid().optional(),
  orderId: z.uuid().optional(),
  history: z.array(historyMessageSchema).max(12).optional(),
  leadSession: leadSessionSchema.optional(),
  sessionId: z.uuid().optional(),
});

export type AiChatBody = z.infer<typeof aiChatSchema>;
