import express from "express";
import { authenticateJwt } from "../middleware/authMiddleware";
import {
  registerAsSeller,
  getMySellerProfile,
} from "../controllers/sellerController";

const router = express.Router();

router.post("/register", authenticateJwt, registerAsSeller);
router.get("/me", authenticateJwt, getMySellerProfile);

export default router;
