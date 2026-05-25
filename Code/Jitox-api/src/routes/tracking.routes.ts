import express from "express";
import {
  postLocationPing,
  getMyTracking,
} from "../controllers/tracking.controller";
import { fieldUserAuthenticate } from "../utils/authRoles.utils";

const router = express.Router();

router.post("/ping", ...fieldUserAuthenticate, postLocationPing);
router.get("/me/today", ...fieldUserAuthenticate, getMyTracking);

export default router;
