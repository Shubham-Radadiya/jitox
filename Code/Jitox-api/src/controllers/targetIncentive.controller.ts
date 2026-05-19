import { Request, Response } from "express";
import { TargetIncentiveAssignment } from "../models/index";
import { AppError } from "../common/errors/AppError";
import { HttpStatusCode } from "../common/errors/httpStatusCode";
import { sendSuccess } from "../utils/apiResponse";

export const saveTargetIncentiveAssignment = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const rows = Array.isArray(req.body?.rows) ? req.body.rows : [];
    if (!rows.length) {
      throw new AppError(
        HttpStatusCode.BAD_REQUEST,
        "At least one product row is required."
      );
    }

    const doc = await TargetIncentiveAssignment.create({
      label: String(req.body?.label || "Assignment").trim(),
      rows: rows.map((r: Record<string, unknown>) => ({
        group: String(r.group ?? "").trim(),
        category: String(r.category ?? "").trim(),
        product: String(r.product ?? "").trim(),
        unit: String(r.unit ?? "").trim(),
        qty: String(r.qty ?? "").trim(),
        selling: String(r.selling ?? "").trim(),
        incentive: String(r.incentive ?? "").trim(),
      })),
      createdByUserId: (req as Request & { user?: { id?: string } }).user?.id,
    });

    res.status(201).json({
      message: "Target incentive rules saved",
      assignment: doc,
    });
  } catch (e) {
    console.error("saveTargetIncentiveAssignment", e);
    throw e;
  }
};

export const listTargetIncentiveAssignments = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const list = await TargetIncentiveAssignment.find()
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    sendSuccess(res, list, list.length ? "" : "No assignments yet.");
  } catch (e) {
    console.error("listTargetIncentiveAssignments", e);
    res.status(500).json({ message: "Failed to load assignments" });
  }
};
