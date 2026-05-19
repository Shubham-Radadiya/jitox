import { Router } from "express";
import {
  createTerritory,
  getTerritorySalesReport,
  listManagers,
  listPendingDistricts,
  listTerritories,
  updateTerritory,
} from "../controllers/territory.controller";
import { adminAuthenticate } from "../utils/authRoles.utils";
import { isAuthenticated } from "../middleware/authonticated.middleware";

const router = Router();

router.get("/", isAuthenticated, listTerritories);
router.post("/", adminAuthenticate, createTerritory);
router.put("/:id", adminAuthenticate, updateTerritory);
router.get("/pending-districts", adminAuthenticate, listPendingDistricts);
router.get("/report/sales", adminAuthenticate, getTerritorySalesReport);
router.get("/managers", isAuthenticated, listManagers);

export default router;
