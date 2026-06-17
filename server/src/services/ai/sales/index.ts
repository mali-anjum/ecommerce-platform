export {
  collectBehaviorSignals,
  pickPrimaryTrigger,
} from "./BehaviorSignalService";
export { analyzeBuyingIntent } from "./BuyingIntentAnalyzer";
export {
  computeIntentScore,
  meetsOfferScoreThreshold,
  shouldPromptGuestEmailCapture,
} from "./IntentScoringEngine";
export {
  decideSalesActions,
  resolveCustomerSegment,
  formatSegmentLabel,
} from "./SalesDecisionService";
export {
  upsertSalesCustomerProfile,
  attachEmailToProfile,
  fetchSegmentBreakdown,
} from "./CustomerProfileService";
export {
  enqueueSalesEmailSequence,
  processDueSalesEmailJobs,
  startSalesEmailQueueProcessor,
  cancelPendingEmailsForOffer,
} from "./SalesEmailQueueService";
export {
  fetchSalesAgentAdminDashboard,
  listSalesAgentOffers,
  listSalesEmailJobs,
} from "./SalesAgentAdminService";
export {
  evaluateSalesAgentOffer,
  scheduleSalesAgentEvaluation,
  getSalesAgentContext,
  captureGuestEmailForSales,
  getPendingOffersForSession,
  markOfferShown,
  dismissOffer,
  markSalesOffersConverted,
  scheduleSalesOfferConversion,
  fetchSalesAgentSummary,
} from "./SalesOfferService";
export {
  sendSalesFollowUpEmail,
  createSalesLead,
} from "./SalesFollowUpService";
export type {
  BehaviorSignals,
  BuyingIntentAnalysis,
  SalesOfferPayload,
  SalesAgentContext,
  IntentScoreBreakdown,
} from "./types";
export { SALES_AGENT_CONSTANTS } from "./types";
