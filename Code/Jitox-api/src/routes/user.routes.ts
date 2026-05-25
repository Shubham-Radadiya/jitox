import express from "express";
import {
  createUser,
  registerUser,
  deleteUser,
  getAllUsers,
  getSubordinateUsers,
  getUserByUserId,
  getUserSummaryById,
  login,
  updateUser,
  createAdminAndUser,
  sendOtp,
  sendRegistrationOtp,
  verifyOtp,
  changePassword,
  approveUser,
  rejectUser,
} from "../controllers/user.controller";
import { adminAuthenticate } from "../utils/authRoles.utils";
import { optionalUserPhotoUpload } from "../middleware/multer.middleware";

const router = express.Router();

router.post("/login", login);
router.post("/register", registerUser);
router.post(
  "/create-user",
  adminAuthenticate,
  optionalUserPhotoUpload("photo"),
  createUser
);
router.put(
  "/update-user/:id",
  adminAuthenticate,
  optionalUserPhotoUpload("photo"),
  updateUser
);
router.patch("/approve-user/:id", adminAuthenticate, approveUser);
router.patch("/reject-user/:id", adminAuthenticate, rejectUser);
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
router.get("/get-user/:id/summary", adminAuthenticate, getUserSummaryById);
router.get("/get-user/:id", adminAuthenticate, getUserByUserId);
router.get(
  "/subordinates/:id",
  adminAuthenticate,
  getSubordinateUsers
);

router.post("/send-registration-otp", sendRegistrationOtp);
router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);
router.post("/change-password", changePassword);

export default router;
