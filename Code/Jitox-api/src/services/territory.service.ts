import { Types } from "mongoose";
import Territory from "../models/territory.model";
import User from "../models/user.model";
import SalesVoucher from "../models/salesVoucher.model";
import { Role } from "../constants/roles";
import {
  normalizeStructuredAddress,
  StructuredAddress,
  trimAddressPart,
} from "../utils/address.util";
import type { ITerritory } from "../types/territory.type";
import {
  notifyAdminsUnmappedDistrict,
  resolveUnmappedDistrictNotifications,
} from "./notification.service";

/** Admin is never territory-scoped (no assignment, no list filters). */
export function isTerritoryScopedRole(role: string | undefined | null): boolean {
  return role === Role.manager || role === Role.user;
}

function norm(s: string | undefined | null): string {
  return String(s || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function listHas(rules: string[] | undefined, value: string): boolean {
  if (!value || !rules?.length) return false;
  const v = norm(value);
  return rules.some((r) => norm(r) === v);
}

/** True if the district appears on any active territory's district list. */
export async function isDistrictMappedToTerritory(
  district: string | undefined | null
): Promise<boolean> {
  const d = trimAddressPart(district);
  if (!d) return true;
  const territories = await Territory.find({ isActive: { $ne: false } })
    .select("districts")
    .lean();
  return territories.some((t) => listHas(t.districts, d));
}

function displayUserName(user: {
  name?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
}): string {
  return (
    user.name ||
    [user.firstName, user.lastName].filter(Boolean).join(" ").trim() ||
    user.email ||
    "User"
  );
}

/** Notify admins when a scoped user has a district not on any territory. */
export async function checkAndNotifyUnmappedDistrict(
  user: InstanceType<typeof User>
): Promise<void> {
  if (!isTerritoryScopedRole(user.role)) return;

  const addr = normalizeStructuredAddress(
    user.toObject() as unknown as Record<string, unknown>
  );
  const district = trimAddressPart(addr.district);
  if (!district) return;

  const mapped = await isDistrictMappedToTerritory(district);
  if (mapped) return;

  await notifyAdminsUnmappedDistrict({
    userId: String(user._id),
    userName: displayUserName(user),
    district,
    state: trimAddressPart(addr.state) || undefined,
  });
}

/** Match territory from address: pincode → district → city → state. */
export async function resolveTerritoryFromAddress(
  addr: StructuredAddress
): Promise<ITerritory | null> {
  const territories = await Territory.find({ isActive: { $ne: false } }).lean();
  const pin = trimAddressPart(addr.pincode);
  const district = trimAddressPart(addr.district);
  const city = trimAddressPart(addr.city);
  const state = trimAddressPart(addr.state);

  for (const t of territories) {
    if (pin && listHas(t.pincodes, pin)) {
      return Territory.hydrate(t);
    }
  }
  for (const t of territories) {
    if (district && listHas(t.districts, district)) {
      return Territory.hydrate(t);
    }
  }
  for (const t of territories) {
    if (city && listHas(t.cities, city)) {
      return Territory.hydrate(t);
    }
  }
  for (const t of territories) {
    if (state && listHas(t.states, state)) {
      return Territory.hydrate(t);
    }
  }
  return null;
}

export async function applyTerritoryAssignmentToUser(
  user: InstanceType<typeof User>,
  opts?: {
    territoryId?: string | Types.ObjectId | null;
    managerId?: string | Types.ObjectId | null;
    reResolveFromAddress?: boolean;
  }
): Promise<void> {
  const role = user.role;
  if (role === Role.admin) {
    user.territoryId = undefined;
    user.managerId = undefined;
    return;
  }

  let territoryId = opts?.territoryId
    ? new Types.ObjectId(String(opts.territoryId))
    : user.territoryId;

  if (opts?.reResolveFromAddress && role === Role.user) {
    const addr = normalizeStructuredAddress(
      user.toObject() as unknown as Record<string, unknown>
    );
    const matched = await resolveTerritoryFromAddress(addr);
    if (matched?._id) {
      territoryId = new Types.ObjectId(String(matched._id));
    }
  }

  if (territoryId) {
    user.territoryId = territoryId;
    const territory = await Territory.findById(territoryId).lean();
    if (territory?.name) {
      user.region = territory.name;
    }
    if (role === Role.user && !opts?.managerId && territory?.managerId) {
      user.managerId = territory.managerId;
    }
  }

  if (opts?.managerId) {
    user.managerId = new Types.ObjectId(String(opts.managerId));
    const manager = await User.findById(user.managerId).select("territoryId role");
    if (manager?.territoryId && role === Role.user) {
      user.territoryId = manager.territoryId;
      const t = await Territory.findById(manager.territoryId).lean();
      if (t?.name) user.region = t.name;
    }
  }

  if (role === Role.manager && territoryId) {
    await Territory.findByIdAndUpdate(territoryId, {
      managerId: user._id,
    });
  }

  await checkAndNotifyUnmappedDistrict(user);
}

/** After admin adds districts to a territory: assign waiting users and clear alerts. */
export async function onTerritoryDistrictsChanged(
  territoryId: Types.ObjectId | string,
  addedDistricts: string[]
): Promise<{ reassignedUsers: number }> {
  const territory = await Territory.findById(territoryId).lean();
  if (!territory) return { reassignedUsers: 0 };

  let reassignedUsers = 0;
  for (const raw of addedDistricts) {
    const district = trimAddressPart(raw);
    if (!district) continue;

    const users = await User.find({
      role: { $in: [Role.user, Role.manager] },
      $or: [{ territoryId: { $exists: false } }, { territoryId: null }],
      district: new RegExp(`^${district.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i"),
    });

    for (const u of users) {
      await applyTerritoryAssignmentToUser(u, { territoryId });
      if (u.territoryId) {
        await u.save();
        reassignedUsers += 1;
      }
    }

    await resolveUnmappedDistrictNotifications(
      district,
      String(territoryId),
      territory.name
    );
  }
  return { reassignedUsers };
}

/** Mongo filter for sales / orders visible to the logged-in user. */
export async function buildSalesScopeFilter(userPayload: {
  id?: string;
  role?: string;
}): Promise<Record<string, unknown>> {
  const role = userPayload.role;
  const userId = userPayload.id;

  if (!userId || !isTerritoryScopedRole(role)) {
    return {};
  }

  const user = await User.findById(userId).select("role territoryId managerId");
  if (!user) return { createdByUserId: new Types.ObjectId(userId) };

  if (role === Role.manager || user.role === Role.manager) {
    const teamIds = await User.find({
      $or: [{ managerId: user._id }, { _id: user._id }],
    }).distinct("_id");
    const or: Record<string, unknown>[] = [
      { createdByUserId: { $in: teamIds } },
    ];
    if (user.territoryId) {
      or.push({ territoryId: user.territoryId });
    }
    return { $or: or };
  }

  return { createdByUserId: new Types.ObjectId(userId) };
}

export async function buildTerritorySalesReport(opts?: {
  from?: string;
  to?: string;
}): Promise<
  Array<{
    territoryId: string;
    territoryName: string;
    managerName: string;
    orderCount: number;
    salesAmount: number;
    userCount: number;
  }>
> {
  const territories = await Territory.find({ isActive: { $ne: false } }).lean();
  const dateMatch: Record<string, unknown> = {};
  if (opts?.from || opts?.to) {
    dateMatch.voucherDate = {};
    if (opts.from) {
      (dateMatch.voucherDate as Record<string, Date>).$gte = new Date(opts.from);
    }
    if (opts.to) {
      (dateMatch.voucherDate as Record<string, Date>).$lte = new Date(opts.to);
    }
  }

  const results = [];
  for (const t of territories) {
    const tid = t._id;
    const salesMatch = { territoryId: tid, ...dateMatch };
    const sales = await SalesVoucher.find(salesMatch).lean();
    const salesAmount = sales.reduce(
      (s, v) => s + Number(v.totalAmount || 0),
      0
    );
    const userCount = await User.countDocuments({ territoryId: tid });
    let managerName = "—";
    if (t.managerId) {
      const m = await User.findById(t.managerId).select("name firstName lastName email");
      if (m) {
        managerName =
          m.name ||
          [m.firstName, m.lastName].filter(Boolean).join(" ").trim() ||
          m.email;
      }
    }
    results.push({
      territoryId: String(tid),
      territoryName: t.name,
      managerName,
      orderCount: sales.length,
      salesAmount,
      userCount,
    });
  }
  return results.sort((a, b) => b.salesAmount - a.salesAmount);
}
