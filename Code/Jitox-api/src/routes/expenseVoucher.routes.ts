import express from "express";
import {
  createExpenseVoucher,
  deleteExpenseVoucher,
  getAllExpenseVouchers,
  getExpenseVoucherById,
  updateExpenseVoucher,
} from "../controllers/expenseVoucher.controller";
import { upload } from "../middleware/multer.middleware";

const router = express.Router();

router.post("/create", upload.single("uploadProof"), createExpenseVoucher);
router.get("/", getAllExpenseVouchers);
router.get("/:id", getExpenseVoucherById);
router.put("/update/:id", upload.single("uploadProof"), updateExpenseVoucher);

router.delete("/delete/:id", deleteExpenseVoucher);

export default router;
