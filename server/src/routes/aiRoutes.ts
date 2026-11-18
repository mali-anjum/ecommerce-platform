import { Router } from "express";
import { postAiChat } from "../controllers/aiController";
import { getAiSetupRecommendations } from "../controllers/recommendationController";
import {
  createAdminFaq,
  deleteAdminFaq,
  getAdminFaqs,
  getPublicFaqs,
  getStorePoliciesHandler,
  updateAdminFaq,
  updateStorePoliciesHandler,
} from "../controllers/faqController";
import {
  getAdminSalesAgentDashboard,
  getSalesContext,
  getSalesOffers,
  postCaptureGuestEmail,
  postSalesOfferDismiss,
  postSalesOfferShown,
} from "../controllers/salesAgentController";
import {
  createManualKnowledgeBase,
  deleteAdminKnowledgeBase,
  getAdminKnowledgeBase,
  updateAdminKnowledgeBase,
  uploadKnowledgeBaseDocument,
} from "../controllers/knowledgeBaseController";
import { getAiAnalyticsDashboard } from "../controllers/aiAnalyticsController";
import {
  getAdminReviewAnalyzerDashboard,
  postAdminReviewAnalyzerRefresh,
} from "../controllers/reviewAnalyzerController";
import { postAdminSeoContentGenerate } from "../controllers/seoGeneratorController";
import { postSmartSearch } from "../controllers/smartSearchController";
import {
  closeAdminSupportTicket,
  getAdminSupportTickets,
  replyAdminSupportTicket,
} from "../controllers/supportTicketController";
import { uploadDocument } from "../middleware/documentUploadMiddleware";
import { optionalAuthenticateJwt } from "../middleware/optionalAuthMiddleware";
import { authenticateJwt, isSuperAdmin } from "../middleware/authMiddleware";
import { requireFeatureFlag, requireModule } from "../middleware/requireFeatureFlag";
import { validate } from "../middleware/validation";
import { aiChatSchema } from "../validations/aiChatSchema";
import {
  createFaqSchema,
  updateFaqSchema,
  updateStorePoliciesSchema,
} from "../validations/faqSchema";
import {
  createManualKnowledgeBaseSchema,
  updateKnowledgeBaseSchema,
} from "../validations/knowledgeBaseSchema";
import {
  captureGuestEmailSchema,
  salesOfferActionSchema,
} from "../validations/salesAgentSchema";
import { seoGeneratorSchema } from "../validations/seoGeneratorSchema";
import { smartSearchSchema } from "../validations/smartSearchSchema";

const router = Router();

router.use(requireModule("ai"));

router.post(
  "/chat",
  requireFeatureFlag("ai.chat"),
  optionalAuthenticateJwt,
  validate(aiChatSchema),
  postAiChat,
);
router.get("/faq", getPublicFaqs);
router.get("/policies", getStorePoliciesHandler);
router.get(
  "/recommendations/setup",
  requireFeatureFlag("ai.productRecommendations"),
  optionalAuthenticateJwt,
  getAiSetupRecommendations,
);
router.post(
  "/search",
  requireFeatureFlag("ai.smartSearch"),
  optionalAuthenticateJwt,
  validate(smartSearchSchema),
  postSmartSearch,
);
router.get(
  "/sales/context",
  requireFeatureFlag("ai.salesAgent"),
  optionalAuthenticateJwt,
  getSalesContext,
);
router.post(
  "/sales/capture-email",
  requireFeatureFlag("ai.salesAgent"),
  optionalAuthenticateJwt,
  validate(captureGuestEmailSchema),
  postCaptureGuestEmail,
);
router.get(
  "/sales/offers",
  requireFeatureFlag("ai.salesAgent"),
  getSalesOffers,
);
router.post(
  "/sales/offers/:id/shown",
  requireFeatureFlag("ai.salesAgent"),
  validate(salesOfferActionSchema),
  postSalesOfferShown,
);
router.post(
  "/sales/offers/:id/dismiss",
  requireFeatureFlag("ai.salesAgent"),
  validate(salesOfferActionSchema),
  postSalesOfferDismiss,
);

router.use(authenticateJwt, isSuperAdmin);

router.get("/admin/analytics", getAiAnalyticsDashboard);
router.get(
  "/admin/sales-agent",
  requireFeatureFlag("ai.salesAgent"),
  getAdminSalesAgentDashboard,
);
router.get(
  "/admin/review-analyzer",
  requireFeatureFlag("ai.reviewAnalyzer"),
  getAdminReviewAnalyzerDashboard,
);
router.post(
  "/admin/review-analyzer/refresh",
  requireFeatureFlag("ai.reviewAnalyzer"),
  postAdminReviewAnalyzerRefresh,
);
router.post(
  "/admin/seo-generator",
  requireFeatureFlag("ai.seoGenerator"),
  validate(seoGeneratorSchema),
  postAdminSeoContentGenerate,
);
router.get("/admin/support-tickets", getAdminSupportTickets);
router.patch("/admin/support-tickets/:id/close", closeAdminSupportTicket);
router.post("/admin/support-tickets/:id/reply", replyAdminSupportTicket);
router.get("/admin/faq", getAdminFaqs);
router.post("/admin/faq", validate(createFaqSchema), createAdminFaq);
router.patch("/admin/faq/:id", validate(updateFaqSchema), updateAdminFaq);
router.delete("/admin/faq/:id", deleteAdminFaq);
router.get("/admin/knowledge-base", getAdminKnowledgeBase);
router.post(
  "/admin/knowledge-base/upload",
  uploadDocument,
  uploadKnowledgeBaseDocument,
);
router.post(
  "/admin/knowledge-base",
  validate(createManualKnowledgeBaseSchema),
  createManualKnowledgeBase,
);
router.patch(
  "/admin/knowledge-base/:id",
  validate(updateKnowledgeBaseSchema),
  updateAdminKnowledgeBase,
);
router.delete("/admin/knowledge-base/:id", deleteAdminKnowledgeBase);
router.put(
  "/admin/policies",
  validate(updateStorePoliciesSchema),
  updateStorePoliciesHandler,
);

export default router;
