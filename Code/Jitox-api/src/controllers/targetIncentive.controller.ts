import { Request, Response } from "express";
import { TargetIncentiveAssignment, User } from "../models/index";
import type {
  ITargetIncentiveRow,
  TargetIncentiveApplicableTo,
} from "../models/targetIncentiveAssignment.model";
import { AppError } from "../common/errors/AppError";
import { HttpStatusCode } from "../common/errors/httpStatusCode";
import { Role } from "../constants/roles";
import { sendSuccess } from "../utils/apiResponse";

function userDisplayName(u: {
  name?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
}): string {
  const fromParts = [u.firstName, u.lastName].filter(Boolean).join(" ").trim();
  return (
    String(u.name || "").trim() ||
    fromParts ||
    String(u.email || "").trim() ||
    "User"
  );
}

function normalizeDateInput(raw: unknown): string {
  const s = String(raw ?? "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return "";
  return s;
}

function parseIncentivePct(raw: unknown): number | null {
  const s = String(raw ?? "")
    .trim()
    .replace(/%/g, "");
  if (!s) return null;
  const n = Number(s);
  if (!Number.isFinite(n) || n < 0 || n > 100) return null;
  return n;
}

function normalizeRows(rows: unknown[]): ITargetIncentiveRow[] {
  return rows.map((row) => {
    const r = row as Record<string, unknown>;
    const pct = parseIncentivePct(r.incentive);
    return {
      productId: String(r.productId ?? "").trim(),
      group: String(r.group ?? "").trim(),
      category: String(r.category ?? "").trim(),
      product: String(r.product ?? "").trim(),
      unit: String(r.unit ?? "").trim(),
      qty: String(r.qty ?? "").trim(),
      selling: String(r.selling ?? "").trim(),
      incentive: pct != null ? `${pct}%` : String(r.incentive ?? "").trim(),
    };
  });
}

function validateAssignmentBody(body: Record<string, unknown>): {
  label: string;
  fromDate: string;
  toDate: string;
  applicableTo: TargetIncentiveApplicableTo;
  applicableUserIds: string[];
  region: string;
  rows: ITargetIncentiveRow[];
} {
  const fromDate = normalizeDateInput(body.fromDate);
  const toDate = normalizeDateInput(body.toDate);
  if (!fromDate || !toDate) {
    throw new AppError(
      HttpStatusCode.BAD_REQUEST,
      "From and To dates are required (YYYY-MM-DD)."
    );
  }
  if (fromDate > toDate) {
    throw new AppError(
      HttpStatusCode.BAD_REQUEST,
      "From date cannot be after To date."
    );
  }

  const applicableRaw = String(body.applicableTo ?? "all").trim();
  const applicableTo: TargetIncentiveApplicableTo =
    applicableRaw === "managers" || applicableRaw === "region"
      ? applicableRaw
      : "all";

  const applicableUserIds = Array.isArray(body.applicableUserIds)
    ? body.applicableUserIds.map((id) => String(id).trim()).filter(Boolean)
    : [];

  const region = String(body.region ?? "").trim();

  if (applicableTo === "managers" && !applicableUserIds.length) {
    throw new AppError(
      HttpStatusCode.BAD_REQUEST,
      "Select at least one manager when Applicable To is specific managers."
    );
  }
  if (applicableTo === "region" && !region) {
    throw new AppError(
      HttpStatusCode.BAD_REQUEST,
      "Select a region when Applicable To is by region."
    );
  }

  const rawRows = Array.isArray(body.rows) ? body.rows : [];
  if (!rawRows.length) {
    throw new AppError(
      HttpStatusCode.BAD_REQUEST,
      "At least one product row is required."
    );
  }

  const rows = normalizeRows(rawRows).filter((r) => r.product);
  if (!rows.length) {
    throw new AppError(
      HttpStatusCode.BAD_REQUEST,
      "At least one product row with a product is required."
    );
  }

  const seenProducts = new Set<string>();
  for (const row of rows) {
    if (!row.group) {
      throw new AppError(
        HttpStatusCode.BAD_REQUEST,
        `Select a group for product "${row.product}".`
      );
    }
    if (!row.productId) {
      throw new AppError(
        HttpStatusCode.BAD_REQUEST,
        `Product "${row.product}" must be selected from Product Master.`
      );
    }
    const key = row.productId.toLowerCase();
    if (seenProducts.has(key)) {
      throw new AppError(
        HttpStatusCode.BAD_REQUEST,
        `Duplicate product "${row.product}" in the same assignment.`
      );
    }
    seenProducts.add(key);

    const pct = parseIncentivePct(row.incentive);
    if (pct == null) {
      throw new AppError(
        HttpStatusCode.BAD_REQUEST,
        `Incentive for "${row.product}" must be a percentage between 0 and 100.`
      );
    }

    if (row.qty) {
      const q = Number(row.qty);
      if (!Number.isFinite(q) || q <= 0) {
        throw new AppError(
          HttpStatusCode.BAD_REQUEST,
          `Qty for "${row.product}" must be greater than zero.`
        );
      }
    }
    if (row.selling) {
      const s = Number(String(row.selling).replace(/,/g, ""));
      if (!Number.isFinite(s) || s < 0) {
        throw new AppError(
          HttpStatusCode.BAD_REQUEST,
          `Selling amount for "${row.product}" must be zero or greater.`
        );
      }
    }
  }

  return {
    label: String(body.label || "Assignment").trim() || "Assignment",
    fromDate,
    toDate,
    applicableTo,
    applicableUserIds,
    region,
    rows,
  };
}

async function assertManagerUserIds(userIds: string[]): Promise<string[]> {
  if (!userIds.length) return [];
  const managers = await User.find({
    _id: { $in: userIds },
    role: Role.manager,
  })
    .select("_id")
    .lean();
  const valid = new Set(managers.map((m) => String(m._id)));
  return userIds.filter((id) => valid.has(id));
}

export const getTargetIncentiveAssignMeta = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const users = await User.find({ role: Role.manager })
      .select("name firstName lastName email role region")
      .sort({ name: 1, email: 1 })
      .lean();

    const managers = users.map((u) => ({
      value: String(u._id),
      label: userDisplayName(u),
      role: String(u.role || ""),
      region: String(u.region || "").trim(),
    }));

    const regionSet = new Set<string>();
    for (const u of users) {
      const r = String(u.region || "").trim();
      if (r) regionSet.add(r);
    }
    const regions = [...regionSet]
      .sort((a, b) => a.localeCompare(b))
      .map((r) => ({ value: r, label: r }));

    sendSuccess(res, { managers, regions });
  } catch (e) {
    console.error("getTargetIncentiveAssignMeta", e);
    res.status(500).json({ message: "Failed to load assign meta" });
  }
};

export const saveTargetIncentiveAssignment = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const parsed = validateAssignmentBody(
      (req.body || {}) as Record<string, unknown>
    );
    if (parsed.applicableTo === "managers") {
      parsed.applicableUserIds = await assertManagerUserIds(
        parsed.applicableUserIds
      );
      if (!parsed.applicableUserIds.length) {
        throw new AppError(
          HttpStatusCode.BAD_REQUEST,
          "Select at least one manager when Applicable To is specific managers."
        );
      }
    }

    const doc = await TargetIncentiveAssignment.create({
      ...parsed,
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

export const updateTargetIncentiveAssignment = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const parsed = validateAssignmentBody(
      (req.body || {}) as Record<string, unknown>
    );
    if (parsed.applicableTo === "managers") {
      parsed.applicableUserIds = await assertManagerUserIds(
        parsed.applicableUserIds
      );
      if (!parsed.applicableUserIds.length) {
        throw new AppError(
          HttpStatusCode.BAD_REQUEST,
          "Select at least one manager when Applicable To is specific managers."
        );
      }
    }

    const doc = await TargetIncentiveAssignment.findByIdAndUpdate(
      id,
      { $set: parsed },
      { new: true, runValidators: true }
    );

    if (!doc) {
      throw new AppError(HttpStatusCode.NOT_FOUND, "Assignment not found.");
    }

    sendSuccess(res, doc, "Target incentive rules updated.");
  } catch (e) {
    console.error("updateTargetIncentiveAssignment", e);
    throw e;
  }
};

export const getTargetIncentiveAssignmentById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const doc = await TargetIncentiveAssignment.findById(req.params.id).lean();
    if (!doc) {
      throw new AppError(HttpStatusCode.NOT_FOUND, "Assignment not found.");
    }
    sendSuccess(res, doc);
  } catch (e) {
    console.error("getTargetIncentiveAssignmentById", e);
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

export const deleteTargetIncentiveAssignment = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const doc = await TargetIncentiveAssignment.findByIdAndDelete(req.params.id);
    if (!doc) {
      throw new AppError(HttpStatusCode.NOT_FOUND, "Assignment not found.");
    }
    sendSuccess(res, { id: req.params.id }, "Assignment deleted.");
  } catch (e) {
    console.error("deleteTargetIncentiveAssignment", e);
    throw e;
  }
};
