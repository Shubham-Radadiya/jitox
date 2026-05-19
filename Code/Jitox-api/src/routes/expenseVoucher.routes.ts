import express from "express";
import {
  createExpenseVoucher,
  deleteExpenseVoucher,
  getAllExpenseVouchers,
  getExpenseTypeOptions,
  getExpenseVoucherById,
  updateExpenseVoucher,
} from "../controllers/expenseVoucher.controller";
import { singleProofUpload } from "../middleware/multer.middleware";

const router = express.Router();

router.post(
  "/create",
  singleProofUpload("uploadProof"),
  createExpenseVoucher
);
router.get("/expense-types", getExpenseTypeOptions);
router.get("/", getAllExpenseVouchers);
router.get("/:id", getExpenseVoucherById);
router.put(
  "/update/:id",
  singleProofUpload("uploadProof"),
  updateExpenseVoucher
);

router.delete("/delete/:id", deleteExpenseVoucher);

export default router;
