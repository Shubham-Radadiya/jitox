import express from "express";
import {
  createReceiptVoucher,
  getAllReceiptVouchers,
  getReceiptById,
} from "../controllers/receiptVoucher.controller";

const router = express.Router();

router.post("/create", createReceiptVoucher);
router.get("/", getAllReceiptVouchers);
router.get("/get-receipt-by-id/:id", getReceiptById);

export default router;
