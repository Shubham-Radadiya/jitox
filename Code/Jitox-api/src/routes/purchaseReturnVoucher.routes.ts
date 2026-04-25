import express from "express";
import {
  createPurchaseReturnVoucher,
  deletePurchaseReturnVoucher,
  getAllPurchaseReturnVouchers,
  getPurchaseReturnVoucherById,
  updatePurchaseReturnVoucher,
} from "../controllers/purchaseReturnVoucher.controller";

const router = express.Router();

router.post("/create-purchase-return-voucher", createPurchaseReturnVoucher);
router.get("/", getAllPurchaseReturnVouchers);
router.get("/:id", getPurchaseReturnVoucherById);
router.put("/update-purchase-return-voucher/:id", updatePurchaseReturnVoucher);
router.delete(
  "/delete-purchase-return-voucher/:id",
  deletePurchaseReturnVoucher
);

export default router;
