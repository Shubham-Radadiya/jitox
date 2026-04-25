import express from "express";
import {
  createQuotation,
  deleteQuotation,
  getAllQuotations,
  getQuotationById,
  updateQuotation,
} from "../controllers/quotation.controller";

const router = express.Router();

router.post("/create-quotation", createQuotation);
router.get("/", getAllQuotations);
router.get("/:id", getQuotationById);
router.put("/update-quotation/:id", updateQuotation);
router.delete("/delete-quotation/:id", deleteQuotation);

export default router;
