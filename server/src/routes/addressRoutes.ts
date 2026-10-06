import express from "express";
import { authenticateJwt } from "../middleware/authMiddleware";
import {
  createAddress,
  deleteAddress,
  getAddresses,
  updateAddress,
} from "../controllers/addressController";
import { validate } from "../middleware/validation";
import { addressSchema } from "../validations/addressSchema";

const router = express.Router();

router.use(authenticateJwt);

router.post("/add-address", validate(addressSchema), createAddress);
router.get("/get-address", getAddresses);
router.delete("/delete-address/:id", deleteAddress);
router.put("/update-address/:id", validate(addressSchema), updateAddress);

export default router;
