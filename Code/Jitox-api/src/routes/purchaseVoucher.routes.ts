import express from "express";
import {
  createPurchaseVoucher,
  deletePurchaseVoucher,
  getAllPurchaseVouchers,
  getPurchaseVoucherById,
  updatePurchaseVoucher,
} from "../controllers/purchaseVoucher.controller";

const router = express.Router();

router.post("/create-purchase-voucher", createPurchaseVoucher);
router.get("/", getAllPurchaseVouchers);
router.get("/:id", getPurchaseVoucherById);
router.put("/update-purchase-voucher/:id", updatePurchaseVoucher);
router.delete("/delete-purchase-voucher/:id", deletePurchaseVoucher);

export default router;
