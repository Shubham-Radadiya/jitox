import express from "express";
import {
  createPaymentVoucher,
  getAllPaymentVouchers,
  getTotalPayment,
} from "../controllers/paymentVoucher.controller";

const router = express.Router();

router.post("/create", createPaymentVoucher);
router.get("/", getAllPaymentVouchers);
router.get("/get-total", getTotalPayment);

export default router;
