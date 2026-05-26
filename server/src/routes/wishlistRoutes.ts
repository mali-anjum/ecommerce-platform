import express from "express";
import { authenticateJwt } from "../middleware/authMiddleware";
import { validate } from "../middleware/validation";
import {
  getWishlist,
  removeWishlistItem,
  toggleWishlist,
} from "../controllers/wishlistController";
import { toggleWishlistSchema } from "../validations/wishlistSchema";

const router = express.Router();

router.use(authenticateJwt);

router.get("/", getWishlist);
router.post("/toggle", validate(toggleWishlistSchema), toggleWishlist);
router.delete("/remove/:id", removeWishlistItem);

export default router;
