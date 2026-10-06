import express from "express";
import { authenticateJwt, isSuperAdmin } from "../middleware/authMiddleware";
import {
  attachSellerProfile,
  requireSellerOrSuperAdmin,
} from "../middleware/sellerMiddleware";
import { uploadMultiple, uploadSingle } from "../middleware/uploadMiddleware"; // ← Import the specific one
import {
  createProduct,
  deleteProduct,
  fetchAllProductsForAdmin,
  getProductByID,
  updateProduct,
  getProductsForClient,
  getProductCategories,
} from "../controllers/productController";

const router = express.Router();

router.post(
  "/create-new-product",
  authenticateJwt,
  requireSellerOrSuperAdmin,
  attachSellerProfile,
  uploadMultiple,
  createProduct
);

router.get(
  "/fetch-admin-products",
  authenticateJwt,
  requireSellerOrSuperAdmin,
  attachSellerProfile,
  fetchAllProductsForAdmin
);

router.get("/fetch-client-products", getProductsForClient);
router.get("/categories", getProductCategories);
router.get("/:id", getProductByID);
router.put(
  "/:id",
  authenticateJwt,
  requireSellerOrSuperAdmin,
  attachSellerProfile,
  uploadMultiple,
  updateProduct
);
router.delete(
  "/:id",
  authenticateJwt,
  requireSellerOrSuperAdmin,
  attachSellerProfile,
  deleteProduct
);
export default router;