import express from "express";
import {
  getCustomerActivitySettings,
  getCustomerStatusSummary,
  patchCustomerActivitySettings,
} from "../controllers/customer.controller";
import {
  authorizeRoles,
  isAuthenticated,
} from "../middleware/authonticated.middleware";
import { Role } from "../constants/roles";

const router = express.Router();

router.get("/status-summary", isAuthenticated, getCustomerStatusSummary);
router.get(
  "/settings/customer-activity",
  isAuthenticated,
  getCustomerActivitySettings
);
router.patch(
  "/settings/customer-activity",
  isAuthenticated,
  authorizeRoles(Role.admin),
  patchCustomerActivitySettings
);

export default router;
