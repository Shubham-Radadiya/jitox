import express from "express";
import {
  createReceiptVoucher,
  deleteReceiptVoucher,
  getAllReceiptVouchers,
  getReceiptById,
  getReceiptFormMeta,
  updateReceiptVoucher,
} from "../controllers/receiptVoucher.controller";

const router = express.Router();

router.post("/create", createReceiptVoucher);
router.get("/form-meta", getReceiptFormMeta);
router.get("/", getAllReceiptVouchers);
router.get("/get-receipt-by-id/:id", getReceiptById);
router.put("/update/:id", updateReceiptVoucher);
router.delete("/delete/:id", deleteReceiptVoucher);

export default router;
