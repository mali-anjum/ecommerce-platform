import express from "express";
import { authenticateJwt, isSuperAdmin } from "../middleware/authMiddleware";
import {
  getAdminUsers,
  setUserActiveState,
  setUserRole,
} from "../controllers/userAdminController";

const router = express.Router();

router.use(authenticateJwt);
router.use(isSuperAdmin);

router.get("/", getAdminUsers);
router.patch("/:userId/status", setUserActiveState);
router.patch("/:userId/role", setUserRole);

export default router;
