import express from "express";
import {
  createCashVoucher,
  deleteCashVoucher,
  getAllCashVouchers,
  getCashVoucherById,
  updateCashVoucher,
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
router.put(
  "/update/:id",
  singleProofUpload("attachmentsFile"),
  updateCashVoucher
);
router.delete("/delete/:id", deleteCashVoucher);

export default router;
