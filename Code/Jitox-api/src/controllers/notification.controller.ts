import { Response } from "express";
import { AuthRequest } from "../middleware/authonticated.middleware";
import Notification from "../models/notification.model";
import { AppError } from "../common/errors/AppError";
import { HttpStatusCode } from "../common/errors/httpStatusCode";

function userIdFromReq(req: AuthRequest): string {
  const id = req.user && typeof req.user === "object" && "id" in req.user
    ? (req.user as { id: string }).id
    : "";
  return String(id || "");
}

export const listNotifications = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const uid = userIdFromReq(req);
  if (!uid) {
    throw new AppError(HttpStatusCode.UNAUTHORIZED, "Not authenticated");
  }
  const unreadOnly = req.query.unread === "1" || req.query.unread === "true";
  const filter: Record<string, unknown> = { userId: uid };
  if (unreadOnly) filter.read = false;
  const list = await Notification.find(filter).sort({ createdAt: -1 }).limit(200);
  res.status(200).json(list);
};

export const markNotificationRead = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const uid = userIdFromReq(req);
  const { id } = req.params;
  const doc = await Notification.findOneAndUpdate(
    { _id: id, userId: uid },
    { read: true },
    { new: true }
  );
  if (!doc) {
    throw new AppError(HttpStatusCode.NOT_FOUND, "Notification not found");
  }
  res.status(200).json(doc);
};

export const markAllNotificationsRead = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const uid = userIdFromReq(req);
  await Notification.updateMany({ userId: uid, read: false }, { read: true });
  res.status(200).json({ message: "All marked read" });
};

export const unreadNotificationCount = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const uid = userIdFromReq(req);
  const count = await Notification.countDocuments({ userId: uid, read: false });
  res.status(200).json({ count });
};
