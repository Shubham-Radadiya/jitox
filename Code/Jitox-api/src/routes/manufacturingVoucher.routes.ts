import express from "express";
import { optionalProofUpload } from "../middleware/multer.middleware";
import {
  completeManufacturingVoucher,
  createManufacturingVoucher,
  deleteManufacturingVoucher,
  failManufacturingVoucher,
  getAllManufacturingVouchers,
  getManufacturingFormMeta,
  getManufacturingVoucherById,
  recheckManufacturingStock,
  startManufacturingVoucher,
  updateManufacturingVoucher,
} from "../controllers/manufacturingVoucher.controller";

const router = express.Router();

router.post("/create-manufacturing-voucher", createManufacturingVoucher);
/** Must stay above `/:id` — "form-meta" was previously mistaken for an id (CastError). */
router.get("/preview-numbers", getManufacturingFormMeta);
router.get("/form-meta", getManufacturingFormMeta);
router.get("/", getAllManufacturingVouchers);
router.get("/:id", getManufacturingVoucherById);
router.put("/update-manufacturing-voucher/:id", updateManufacturingVoucher);
router.delete("/delete-manufacturing-voucher/:id", deleteManufacturingVoucher);
router.post("/:id/recheck-stock", recheckManufacturingStock);
router.post("/:id/start", startManufacturingVoucher);
router.post("/:id/complete", completeManufacturingVoucher);
router.post(
  "/:id/fail",
  optionalProofUpload("failureAttachment"),
  failManufacturingVoucher
);

export default router;
