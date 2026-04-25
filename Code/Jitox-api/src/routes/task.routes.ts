import express from "express";
import {
  createTask,
  getAllTasks,
  getTaskById,
  updateTask,
  deleteTask,
  getTaskAnalytics,
} from "../controllers/task.controller";
import { isAuthenticated, authorizeRoles } from "../middleware/authonticated.middleware";
import { Role } from "../constants/roles";

const router = express.Router();

router.get(
  "/analytics",
  isAuthenticated,
  authorizeRoles(Role.admin),
  getTaskAnalytics
);
router.post(
  "/create-task",
  isAuthenticated,
  authorizeRoles(Role.admin),
  createTask
);
router.get("/", isAuthenticated, getAllTasks);
router.put("/update-task/:id", isAuthenticated, updateTask);
router.delete(
  "/delete-task/:id",
  isAuthenticated,
  authorizeRoles(Role.admin),
  deleteTask
);
router.get("/:id", isAuthenticated, getTaskById);

export default router;
