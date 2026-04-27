import express from "express";
import { authenticateJwt, isSuperAdmin } from "../middleware/authMiddleware";
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
  isSuperAdmin,
  uploadMultiple, 
  createProduct
);

router.get(
  "/fetch-admin-products",
  authenticateJwt,
  isSuperAdmin,
  fetchAllProductsForAdmin
);

router.get("/fetch-client-products", getProductsForClient);
router.get("/categories", getProductCategories);
router.get("/:id", authenticateJwt, getProductByID);
router.put("/:id", authenticateJwt, isSuperAdmin, updateProduct);
router.delete("/:id", authenticateJwt, isSuperAdmin, deleteProduct);
import { upload } from "../middleware/uploadMiddleware"; // the upload object

router.post('/debug-multer', authenticateJwt, isSuperAdmin, upload.any(), (req, res) => {
  res.json({
    contentType: req.headers['content-type'],
    filesInfo: Array.isArray(req.files) ? req.files.map(f => ({ fieldname: f.fieldname, originalname: f.originalname, mimetype: f.mimetype, size: f.size })) : req.files,
    bodyKeys: Object.keys(req.body || {}),
    body: req.body
  });
});

export default router;