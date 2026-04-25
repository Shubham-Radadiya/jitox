import express from "express";
import {
  createJournalVoucher,
  getAllJournalVouchers,
  updateJournalVoucher,
  getJournalVoucherById,
  deleteJournalVoucher,
} from "../controllers/journalVoucher.controller";

const router = express.Router();

router.post("/create", createJournalVoucher);
router.get("/", getAllJournalVouchers);
router.get("/:id", getJournalVoucherById);
router.put("/update/:id", updateJournalVoucher);
router.delete("/delete/:id", deleteJournalVoucher);

export default router;
