import express from "express";
import { authenticateJwt, isSuperAdmin } from "../middleware/authMiddleware";
import {
  createCoupon,
  deleteCoupon,
  fetchAllCoupons,
  validateCoupon,
} from "../controllers/couponController";
import { validate } from "../middleware/validation";
import { createCouponSchema, validateCouponSchema } from "../validations/couponSchema";

const router = express.Router();

router.use(authenticateJwt);

// Full list exposes every code, so it is admin-only; shoppers use /validate.
router.get("/fetch-all-coupons", isSuperAdmin, fetchAllCoupons);
router.post("/validate", validate(validateCouponSchema), validateCoupon);
router.post("/create-coupon", isSuperAdmin, validate(createCouponSchema), createCoupon);
router.delete("/:id", isSuperAdmin, deleteCoupon);

export default router;
