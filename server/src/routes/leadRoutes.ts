import { Router } from "express";
import { getLeads, postLead } from "../controllers/leadController";
import { authenticateJwt, isSuperAdmin } from "../middleware/authMiddleware";
import { validate } from "../middleware/validation";
import { createLeadSchema } from "../validations/leadSchema";
import { requireModule } from "../middleware/requireFeatureFlag";

const router = Router();

router.post("/", validate(createLeadSchema), postLead);
router.get("/", authenticateJwt, isSuperAdmin, requireModule("ai"), getLeads);

export default router;
