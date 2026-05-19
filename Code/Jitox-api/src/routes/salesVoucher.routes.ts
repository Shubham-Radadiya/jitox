import express from "express";
import {
  createSalesVoucher,
  deleteSalesVoucher,
  getAllSalesVouchers,
  getSalesFormMeta,
  getSalesVoucherById,
  updateSalesVoucher,
} from "../controllers/salesVoucher.controller";
import { attachUserOptional } from "../middleware/attachUserOptional";

const router = express.Router();

router.use(attachUserOptional);

router.post("/create-sales-voucher", createSalesVoucher);
router.get("/form-meta", getSalesFormMeta);
router.get("/", getAllSalesVouchers);
router.get("/:id", getSalesVoucherById);
router.put("/update-sales-voucher/:id", updateSalesVoucher);
router.delete("/delete-sales-voucher/:id", deleteSalesVoucher);

export default router;
