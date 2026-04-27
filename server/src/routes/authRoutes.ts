import express from "express";
import {
  getCurrentUser,
  login,
  logout,
  refreshAccessToken,
  heartbeat,
  register,
} from "../controllers/authController";
import { authenticateJwt } from "../middleware/authMiddleware";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", authenticateJwt, getCurrentUser)
router.post("/refresh-token", refreshAccessToken);
router.post("/heartbeat", authenticateJwt, heartbeat);
router.post("/logout", logout);

export default router;
