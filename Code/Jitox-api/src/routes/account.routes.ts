import express from "express";
import {
  createAccount,
  getAllAccounts,
  getAccountById,
  updateAccount,
  deleteAccount,
} from "../controllers/account.controller";
import { upload } from "../middleware/multer.middleware";

const router = express.Router();

router.post("/create-account", upload.single("documentUpload"), createAccount);
router.get("/", getAllAccounts);
router.get("/:id", getAccountById);
router.put("/update-account/:id", updateAccount);
router.delete("/delete-account/:id", deleteAccount);

export default router;
