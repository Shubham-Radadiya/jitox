import express from "express";
import {
  createCashVoucher,
  getAllCashVouchers,
  getCashVoucherById,
} from "../controllers/cashVoucher.controller";
import { upload } from "../middleware/multer.middleware";

const router = express.Router();

router.post("/create", upload.single("attachmentsFile"), createCashVoucher);
router.get("/", getAllCashVouchers);
router.get("/:id", getCashVoucherById);

export default router;
