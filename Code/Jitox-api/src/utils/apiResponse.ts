import { Response } from "express";

/** Standard success envelope for API consumers (dashboard, mobile). */
export function sendSuccess<T>(
  res: Response,
  data: T,
  message = "",
  status = 200
): void {
  res.status(status).json({ success: true, data, message });
}

export function sendCreated<T>(
  res: Response,
  data: T,
  message = "Created"
): void {
  sendSuccess(res, data, message, 201);
}
