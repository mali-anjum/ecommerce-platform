import { Router } from "express";
import {
  createAdminFaq,
  deleteAdminFaq,
  getAdminFaqs,
  getPublicFaqs,
  getStorePoliciesHandler,
  postAiChat,
  updateAdminFaq,
  updateStorePoliciesHandler,
} from "../controllers/aiController";
import {
  createManualKnowledgeBase,
  deleteAdminKnowledgeBase,
  getAdminKnowledgeBase,
  updateAdminKnowledgeBase,
  uploadKnowledgeBaseDocument,
} from "../controllers/knowledgeBaseController";
import { getAiAnalyticsDashboard } from "../controllers/aiAnalyticsController";
import {
  closeAdminSupportTicket,
  getAdminSupportTickets,
  replyAdminSupportTicket,
} from "../controllers/supportTicketController";
import { uploadDocument } from "../middleware/documentUploadMiddleware";
import { optionalAuthenticateJwt } from "../middleware/optionalAuthMiddleware";
import { authenticateJwt, isSuperAdmin } from "../middleware/authMiddleware";
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

const router = Router();

router.post("/chat", optionalAuthenticateJwt, validate(aiChatSchema), postAiChat);
router.get("/faq", getPublicFaqs);
router.get("/policies", getStorePoliciesHandler);

router.use(authenticateJwt, isSuperAdmin);
router.get("/admin/analytics", getAiAnalyticsDashboard);
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
