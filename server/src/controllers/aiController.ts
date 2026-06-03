import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../types/express";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../utils/ApiResponse";
import {
  runAssistantChat,
  toPublicChatPayload,
  scheduleAiConversationLog,
  persistSessionTurn,
} from "../services/ai";
import type { AiChatBody } from "../validations/aiChatSchema";
import { scheduleAnalyticsEvent } from "../services/analytics/analyticsEventService";
import { AnalyticsEventType } from "@prisma/client";
export const postAiChat = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
    const body = req.validatedData as AiChatBody;
    const result = await runAssistantChat({
      message: body.message,
      productId: body.productId,
      orderId: body.orderId,
      history: body.history,
      userId: req.user?.userId,
      userRole: req.user?.role,
      leadSession: body.leadSession,
      sessionId: body.sessionId,
    });

    const payload = toPublicChatPayload(result);

    scheduleAiConversationLog({
      userId: req.user?.userId,
      query: body.message,
      intent: result.classifiedIntent,
    });

    scheduleAnalyticsEvent({
      type: AnalyticsEventType.CHAT,
      userId: req.user?.userId,
      sessionId: body.sessionId,
      metadata: {
        classifiedIntent: result.classifiedIntent,
        productId: body.productId ?? null,
        supportTicketId: result.supportTicket?.id ?? null,
      },
    });

    if (body.sessionId) {
      void persistSessionTurn({
        sessionId: body.sessionId,
        userId: req.user?.userId,
        userMessage: body.message,
        assistantReply: result.reply,
      }).catch((error) => {
        console.error("[session-memory] Failed to persist chat turn", error);
      });
    }

    res.json(new ApiResponse(200, payload, "Assistant reply generated"));
  },
);
