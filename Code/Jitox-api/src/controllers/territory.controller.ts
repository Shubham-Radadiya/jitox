import { Request, Response } from "express";
import { Types } from "mongoose";
import Territory from "../models/territory.model";
import User from "../models/user.model";
import { AppError } from "../common/errors/AppError";
import { HttpStatusCode } from "../common/errors/httpStatusCode";
import { sendSuccess, sendCreated } from "../utils/apiResponse";
import { Role } from "../constants/roles";
import {
  buildTerritorySalesReport,
  isDistrictMappedToTerritory,
  onTerritoryDistrictsChanged,
} from "../services/territory.service";
import type { AuthRequest } from "../middleware/authonticated.middleware";

function parseStringList(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.map((x) => String(x).trim()).filter(Boolean);
  }
  if (typeof raw === "string") {
    return raw
      .split(/[,;|\n]/)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

export const listTerritories = async (_req: Request, res: Response) => {
  const rows = await Territory.find().sort({ name: 1 }).lean();
  sendSuccess(res, rows, "Territories loaded");
};

export const createTerritory = async (req: Request, res: Response) => {
  const { name, code, managerId } = req.body;
  if (!String(name || "").trim()) {
    throw new AppError(HttpStatusCode.BAD_REQUEST, "Territory name is required.");
  }
  const doc = await Territory.create({
    name: String(name).trim(),
    code: code ? String(code).trim() : undefined,
    states: parseStringList(req.body.states),
    districts: parseStringList(req.body.districts),
    cities: parseStringList(req.body.cities),
    pincodes: parseStringList(req.body.pincodes),
    managerId: managerId ? new Types.ObjectId(String(managerId)) : undefined,
  });
  if (doc.managerId) {
    await User.findByIdAndUpdate(doc.managerId, {
      role: Role.manager,
      territoryId: doc._id,
      region: doc.name,
    });
  }
  const added = parseStringList(req.body.districts);
  const { reassignedUsers } = await onTerritoryDistrictsChanged(String(doc._id), added);
  sendCreated(
    res,
    { ...doc.toObject(), reassignedUsers },
    reassignedUsers
      ? `Territory created; ${reassignedUsers} user(s) assigned.`
      : "Territory created"
  );
};

export const updateTerritory = async (req: Request, res: Response) => {
  const { id } = req.params;
  const doc = await Territory.findById(id);
  if (!doc) {
    throw new AppError(HttpStatusCode.NOT_FOUND, "Territory not found.");
  }
  if (req.body.name !== undefined) doc.name = String(req.body.name).trim();
  if (req.body.code !== undefined) doc.code = String(req.body.code).trim();
  if (req.body.states !== undefined) doc.states = parseStringList(req.body.states);
  const prevDistricts = [...(doc.districts || [])];
  if (req.body.districts !== undefined) {
    doc.districts = parseStringList(req.body.districts);
  }
  if (req.body.cities !== undefined) doc.cities = parseStringList(req.body.cities);
  if (req.body.pincodes !== undefined) {
    doc.pincodes = parseStringList(req.body.pincodes);
  }
  if (req.body.isActive !== undefined) doc.isActive = Boolean(req.body.isActive);
  if (req.body.managerId !== undefined) {
    const mid = String(req.body.managerId || "").trim();
    doc.managerId = mid ? new Types.ObjectId(mid) : undefined;
    if (doc.managerId) {
      await User.findByIdAndUpdate(doc.managerId, {
        territoryId: doc._id,
        region: doc.name,
      });
    }
  }
  await doc.save();

  const prevNorm = new Set(prevDistricts.map((d) => d.trim().toLowerCase()));
  const addedDistricts = (doc.districts || []).filter(
    (d) => d.trim() && !prevNorm.has(d.trim().toLowerCase())
  );
  const { reassignedUsers } = await onTerritoryDistrictsChanged(
    String(doc._id),
    addedDistricts
  );

  sendSuccess(
    res,
    { ...doc.toObject(), reassignedUsers },
    reassignedUsers
      ? `Territory updated; ${reassignedUsers} user(s) assigned to this territory.`
      : "Territory updated"
  );
};

/** Admin-only territory-wise sales summary (optional date range). */
export const getTerritorySalesReport = async (req: Request, res: Response) => {
  const from = String(req.query.from || "").trim();
  const to = String(req.query.to || "").trim();
  const rows = await buildTerritorySalesReport({
    from: from || undefined,
    to: to || undefined,
  });
  sendSuccess(res, { territories: rows }, "Territory report loaded");
};

/** Users whose district is not on any territory (admin action list). */
export const listPendingDistricts = async (_req: Request, res: Response) => {
  const users = await User.find({
    role: { $in: [Role.manager, Role.user] },
    $or: [{ territoryId: null }, { territoryId: { $exists: false } }],
    district: { $exists: true, $nin: [null, ""] },
  })
    .select("name firstName lastName email district state")
    .lean();

  const byDistrict = new Map<
    string,
    { district: string; state: string; users: Array<{ id: string; name: string; email: string }> }
  >();

  for (const u of users) {
    const district = String(u.district || "").trim();
    if (!district) continue;
    const mapped = await isDistrictMappedToTerritory(district);
    if (mapped) continue;

    const key = district.toLowerCase();
    const name =
      u.name ||
      [u.firstName, u.lastName].filter(Boolean).join(" ").trim() ||
      u.email ||
      "User";
    const row = byDistrict.get(key) || {
      district,
      state: String(u.state || "").trim(),
      users: [],
    };
    row.users.push({
      id: String(u._id),
      name,
      email: String(u.email || ""),
    });
    byDistrict.set(key, row);
  }

  const rows = [...byDistrict.values()].sort((a, b) =>
    a.district.localeCompare(b.district)
  );
  sendSuccess(res, rows, "Pending districts loaded");
};

/** Managers for dropdown — Admin sees all managers; Manager sees self. */
export const listManagers = async (req: AuthRequest, res: Response) => {
  const filter: Record<string, unknown> = { role: Role.manager };
  const territoryId = String(req.query.territoryId || "").trim();
  if (territoryId) filter.territoryId = new Types.ObjectId(territoryId);

  if (req.user?.role === Role.manager && req.user?.id) {
    filter._id = new Types.ObjectId(String(req.user.id));
  }

  const rows = await User.find(filter)
    .select("-password")
    .sort({ name: 1 })
    .lean();
  sendSuccess(res, rows, "Managers loaded");
};
