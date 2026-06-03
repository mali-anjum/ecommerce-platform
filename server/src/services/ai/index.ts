/**
 * AI commerce module — public API for controllers and cross-cutting callers.
 */

export { runAssistantChat } from "./orchestration/AssistantService";
export { runGeneralChat } from "./chat/GeneralChatService";
export {
  toPublicChatPayload,
  isProductSearchIntent,
  type PublicAssistantChatPayload,
} from "./chat/ChatResponse";

export {
  classifyIntent,
  mapClassifiedIntentToLegacy,
  type IntentClassification,
} from "./classification/IntentClassifier";
export type { ClassifiedIntent } from "./types";

export { getProductRecommendations } from "./recommendations/ProductRecommendationService";
export { runOrderSupportChat } from "./orders/OrderSupportService";
export { runLeadCaptureChat } from "./leads/LeadCaptureService";

export {
  runHumanHandoffChat,
  shouldEscalateToHuman,
  handleOpenTicketMessage,
  type HandoffResult,
} from "./handoff/HandoffService";
export {
  createSupportTicket,
  appendSupportTicketMessage,
  findOpenSupportTicket,
  listSupportTickets,
  closeSupportTicket,
  addAgentReply,
  type SupportTicketRecord,
  type SupportTicketMessage,
} from "./handoff/SupportTicketService";

export {
  logAiConversation,
  scheduleAiConversationLog,
  markAiChatConversionsForUser,
  scheduleAiChatConversion,
} from "./analytics/ConversationLogService";
export {
  fetchAiAnalyticsDashboard,
  fetchAiMetricsSummary,
  type AiAnalyticsDashboard,
  type AiMetricsSummary,
} from "./analytics/AiAnalyticsService";

export {
  loadSessionHistory,
  persistSessionTurn,
  mergeSessionHistory,
} from "./sessionMemory/SessionMemoryService";

export * from "./productIndex";
export type * from "./types";
