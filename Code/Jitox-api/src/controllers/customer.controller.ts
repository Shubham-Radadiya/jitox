import { Request, Response } from "express";
import { getOrCreateSystemSettings } from "../models/index";
import { classifyCustomersByQuotations } from "../services/customerActivity.service";
import { sendSuccess } from "../utils/apiResponse";
import { AppError } from "../common/errors/AppError";
import { HttpStatusCode } from "../common/errors/httpStatusCode";

export const getCustomerStatusSummary = async (
  _req: Request,
  res: Response
): Promise<void> => {
  const settings = await getOrCreateSystemSettings();
  const c = await classifyCustomersByQuotations(settings);
  sendSuccess(res, {
    total: c.total,
    active: c.active,
    inactive: c.inactive,
    activeNames: c.activeNames,
    inactiveNames: c.inactiveNames,
    timeframe: {
      value: settings.customerActivityValue,
      unit: settings.customerActivityUnit,
    },
  });
};

export const getCustomerActivitySettings = async (
  _req: Request,
  res: Response
): Promise<void> => {
  const s = await getOrCreateSystemSettings();
  sendSuccess(res, {
    value: s.customerActivityValue,
    unit: s.customerActivityUnit,
  });
};

export const patchCustomerActivitySettings = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { value, unit } = req.body || {};
  const num = Number(value);
  if (!Number.isFinite(num) || num < 1) {
    throw new AppError(
      HttpStatusCode.BAD_REQUEST,
      "value must be a positive number."
    );
  }
  const u = unit === "days" ? "days" : "months";
  const max = u === "months" ? 120 : 3660;
  if (num > max) {
    throw new AppError(
      HttpStatusCode.BAD_REQUEST,
      `value must be at most ${max}.`
    );
  }
  const s = await getOrCreateSystemSettings();
  s.customerActivityValue = Math.floor(num);
  s.customerActivityUnit = u;
  await s.save();
  sendSuccess(res, {
    value: s.customerActivityValue,
    unit: s.customerActivityUnit,
  });
};
