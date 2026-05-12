import express from "express";
import {
  createPaymentVoucher,
  deletePaymentVoucher,
  getAllPaymentVouchers,
  getPaymentFormMeta,
  getPaymentVoucherById,
  getTotalPayment,
  updatePaymentVoucher,
} from "../controllers/paymentVoucher.controller";

const router = express.Router();

router.post("/create", createPaymentVoucher);
router.get("/form-meta", getPaymentFormMeta);
router.get("/get-total", getTotalPayment);
router.get("/", getAllPaymentVouchers);
router.get("/:id", getPaymentVoucherById);
router.put("/update/:id", updatePaymentVoucher);
router.delete("/delete/:id", deletePaymentVoucher);

export default router;
