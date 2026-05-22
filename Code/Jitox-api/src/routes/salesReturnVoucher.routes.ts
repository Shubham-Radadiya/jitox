import { Router } from "express";
import {
  createSalesReturnFromQuotation,
  createSalesReturnVoucher,
  deleteSalesReturnVoucher,
  finalizeSalesReturnVoucher,
  getAllSalesReturnVouchers,
  getPrefillFromQuotation,
  getSalesReturnFormMeta,
  getSalesReturnVoucherById,
  rejectSalesReturnVoucher,
  updateSalesReturnVoucher,
} from "../controllers/salesReturnVoucher.controller";

const router = Router();

router.post("/create-sales-return-voucher", createSalesReturnVoucher);
router.post(
  "/create-from-quotation/:quotationId",
  createSalesReturnFromQuotation
);
router.post(
  "/finalize-sales-return-voucher/:id",
  finalizeSalesReturnVoucher
);
router.post(
  "/reject-sales-return-voucher/:id",
  rejectSalesReturnVoucher
);
router.get("/form-meta", getSalesReturnFormMeta);
router.get(
  "/prefill-from-quotation/:quotationId",
  getPrefillFromQuotation
);
router.get("/", getAllSalesReturnVouchers);
router.get("/:id", getSalesReturnVoucherById);
router.put("/update-sales-return-voucher/:id", updateSalesReturnVoucher);
router.delete("/delete-sales-return-voucher/:id", deleteSalesReturnVoucher);

export default router;
