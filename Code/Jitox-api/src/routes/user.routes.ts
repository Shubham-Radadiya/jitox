import express from "express";
import {
  createUser,
  registerUser,
  deleteUser,
  getAllUsers,
  getUserByUserId,
  login,
  updateUser,
  createAdminAndUser,
  sendOtp,
  verifyOtp,
  changePassword,
} from "../controllers/user.controller";
import { adminAuthenticate } from "../utils/authRoles.utils";

const router = express.Router();

router.post("/login", login);
router.post("/register", registerUser);
router.post("/create-user", adminAuthenticate, createUser);
router.put("/update-user/:id", adminAuthenticate, updateUser);
router.delete("/delete-user/:id", adminAuthenticate, deleteUser);
router.get("/", adminAuthenticate, getAllUsers);
router.get("/get-users", (req, res) => {
  const allowed =
    process.env.NODE_ENV === "development" ||
    process.env.ALLOW_BOOTSTRAP_USERS === "true";
  if (!allowed) {
    res.status(404).json({ message: "Not found" });
    return;
  }
  void createAdminAndUser(req, res);
});
router.get("/get-user/:id", adminAuthenticate, getUserByUserId);

router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);
router.post("/change-password", changePassword);

export default router;
