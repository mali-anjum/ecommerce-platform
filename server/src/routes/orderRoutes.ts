import express from "express";
import { authenticateJwt, isSuperAdmin } from "../middleware/authMiddleware";
import {
  createPaymentOrder,
  capturePayment,
  getAllOrdersAdminOnly,
  getAllOrdersForUser,
  // getOrder,
  // getOrdersByUserId,
  updateOrderStatusAdminOnly,
  getOrderById,
  getSellerOrderLines,
} from "../controllers/orderController";
import { attachSellerProfile } from "../middleware/sellerMiddleware";
import { ApiResponse } from "../utils/ApiResponse";
import { PaymentFactory } from "../services/payment/payment.factory";
import { genericWebhook, paypalWebhook, stripeWebhook } from "../controllers/webhook.controller";

const router = express.Router();

router.post("/webhooks/paypal", 
  express.raw({ type: "application/json" }), 
  paypalWebhook
);

router.post("/webhooks/stripe",
  express.raw({ type: "application/json" }),
  stripeWebhook
);

router.post("/webhooks/:provider", 
  express.raw({ type: "application/json" }),
  genericWebhook
);

router.use(authenticateJwt);

router.post("/create-order", createPaymentOrder);
router.post("/capture-order", capturePayment);


router.get('/methods', (req, res) => {
  const methods = PaymentFactory.getAvailableMethods();
  res.json(new ApiResponse(200, methods, "Available payment methods"));
});

// router.post("/create-final-order", createFinalOrderInDB);
// router.get("/get-single-order/:orderId", getOrder);
// router.get("/get-order-by-user-id", getOrdersByUserId);
router.get("/get-all-orders-for-admin", isSuperAdmin, getAllOrdersAdminOnly);
router.get("/get-all-orders", getAllOrdersForUser);
router.put("/:orderId/status", isSuperAdmin, updateOrderStatusAdminOnly);

router.get("/seller/my-sales", attachSellerProfile, getSellerOrderLines);

router.get("/:orderId", getOrderById); // For users
router.get("/admin/:orderId", isSuperAdmin, getOrderById); // Same controller works for both
export default router;