import express from "express";
import {
  createDayBook,
  deleteDayBook,
  getAllDayBooks,
  getDayBookById,
  updateDayBook,
} from "../controllers/dayBook.controller";

const router = express.Router();

router.post("/create", createDayBook);
router.get("/", getAllDayBooks);
router.get("/:id", getDayBookById);
router.put("/update/:id", updateDayBook);
router.delete("/delete/:id", deleteDayBook);

export default router;
