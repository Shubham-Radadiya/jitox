import express from "express";
import {
  createCashVoucher,
  getAllCashVouchers,
  getCashVoucherById,
} from "../controllers/cashVoucher.controller";
import { singleProofUpload } from "../middleware/multer.middleware";

const router = express.Router();

router.post(
  "/create",
  singleProofUpload("attachmentsFile"),
  createCashVoucher
);
router.get("/", getAllCashVouchers);
router.get("/:id", getCashVoucherById);

export default router;
