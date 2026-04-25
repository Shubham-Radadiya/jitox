import express from "express";
import { isAuthenticated } from "../middleware/authonticated.middleware";
import {
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  unreadNotificationCount,
} from "../controllers/notification.controller";

const router = express.Router();

router.get("/", isAuthenticated, listNotifications);
router.get("/unread-count", isAuthenticated, unreadNotificationCount);
router.patch("/read-all", isAuthenticated, markAllNotificationsRead);
router.patch("/:id/read", isAuthenticated, markNotificationRead);

export default router;
