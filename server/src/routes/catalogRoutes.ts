import express from "express";
import { authenticateJwt, isSuperAdmin } from "../middleware/authMiddleware";
import {
  getCatalogTree,
  listDepartmentStructure,
} from "../controllers/catalogPublicController";
import {
  seedCatalogEndpoint,
  adminCreateDepartment,
  adminUpdateDepartment,
  adminDeleteDepartment,
  adminCreateSubcategory,
  adminUpdateSubcategory,
  adminDeleteSubcategory,
} from "../controllers/catalogAdminController";

const router = express.Router();

router.get("/tree", getCatalogTree);
router.get("/structure", listDepartmentStructure);

router.post(
  "/admin/seed-from-constants",
  authenticateJwt,
  isSuperAdmin,
  seedCatalogEndpoint
);

router.post(
  "/admin/departments",
  authenticateJwt,
  isSuperAdmin,
  adminCreateDepartment
);
router.put(
  "/admin/departments/:id",
  authenticateJwt,
  isSuperAdmin,
  adminUpdateDepartment
);
router.delete(
  "/admin/departments/:id",
  authenticateJwt,
  isSuperAdmin,
  adminDeleteDepartment
);

router.post(
  "/admin/subcategories",
  authenticateJwt,
  isSuperAdmin,
  adminCreateSubcategory
);
router.put(
  "/admin/subcategories/:id",
  authenticateJwt,
  isSuperAdmin,
  adminUpdateSubcategory
);
router.delete(
  "/admin/subcategories/:id",
  authenticateJwt,
  isSuperAdmin,
  adminDeleteSubcategory
);

export default router;
