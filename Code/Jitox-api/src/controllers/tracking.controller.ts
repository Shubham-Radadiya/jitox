import { Response } from "express";
import { AuthRequest } from "../middleware/authonticated.middleware";
import { AppError } from "../common/errors/AppError";
import { HttpStatusCode } from "../common/errors/httpStatusCode";
import {
  recordLocationPing,
  getMyTrackingToday,
} from "../services/fieldTracking.service";

function userIdFromReq(req: AuthRequest): string {
  if (!req.user || typeof req.user !== "object") return "";
  const u = req.user as { id?: unknown; _id?: unknown; sub?: unknown };
  const raw = u.id ?? u._id ?? u.sub;
  return raw != null ? String(raw) : "";
}

export const postLocationPing = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const uid = userIdFromReq(req);
  if (!uid) {
    throw new AppError(HttpStatusCode.UNAUTHORIZED, "Not authenticated");
  }

  const { lat, lng, accuracy, speed, heading, address, kind } = req.body || {};

  const latN = Number(lat);
  const lngN = Number(lng);
  if (!Number.isFinite(latN) || !Number.isFinite(lngN)) {
    throw new AppError(HttpStatusCode.BAD_REQUEST, "lat and lng are required");
  }
  if (latN < -90 || latN > 90 || lngN < -180 || lngN > 180) {
    throw new AppError(HttpStatusCode.BAD_REQUEST, "Invalid coordinates");
  }

  const allowedKinds = ["ping", "day_start", "day_end", "visit"];
  const kindStr =
    kind && allowedKinds.includes(String(kind)) ? String(kind) : "ping";

  const result = await recordLocationPing({
    userId: uid,
    lat: latN,
    lng: lngN,
    accuracy: accuracy != null ? Number(accuracy) : undefined,
    speed: speed != null ? Number(speed) : undefined,
    heading: heading != null ? Number(heading) : undefined,
    address: address != null ? String(address) : undefined,
    kind: kindStr as "ping" | "day_start" | "day_end" | "visit",
  });

  res.status(201).json({
    success: true,
    message: "Location recorded",
    data: result,
  });
};

export const getMyTracking = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const uid = userIdFromReq(req);
  if (!uid) {
    throw new AppError(HttpStatusCode.UNAUTHORIZED, "Not authenticated");
  }
  const data = await getMyTrackingToday(uid);
  res.status(200).json(data);
};
