import express from "express";
import {
  createDayBook,
  getAllDayBooks,
  getDayBookById,
} from "../controllers/dayBook.controller";

const router = express.Router();

router.post("/create", createDayBook);
router.get("/", getAllDayBooks);
router.get("/:id", getDayBookById);

export default router;
