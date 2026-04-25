import moment from "moment";
import { Account, Quotation } from "../models/index";
import {
  CustomerActivityUnit,
  ISystemSettings,
} from "../models/systemSettings.model";

export function normalizePartyKey(raw: string | undefined | null): string {
  return String(raw ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

export function isCustomerAccount(account: {
  accountType?: string;
}): boolean {
  return /^customer$/i.test(String(account.accountType ?? "").trim());
}

export function getCutoffDate(settings: {
  customerActivityValue: number;
  customerActivityUnit: CustomerActivityUnit;
}): Date {
  const v = Math.max(1, Number(settings.customerActivityValue) || 3);
  const unit = settings.customerActivityUnit === "days" ? "days" : "months";
  return moment().subtract(v, unit).startOf("day").toDate();
}

/** Party names (normalized) with at least one quotation on/after cutoff. */
export async function loadActivePartyKeysSince(cutoff: Date): Promise<Set<string>> {
  const rows = await Quotation.aggregate<{ _id: string }>([
    {
      $project: {
        partyName: 1,
        billDate: { $ifNull: ["$voucherDate", "$createdAt"] },
      },
    },
    {
      $match: {
        billDate: { $gte: cutoff },
        partyName: { $type: "string", $ne: "" },
      },
    },
    {
      $group: {
        _id: {
          $toLower: {
            $trim: { input: { $ifNull: ["$partyName", ""] } },
          },
        },
      },
    },
    { $match: { _id: { $ne: "" } } },
  ]);

  const set = new Set<string>();
  for (const r of rows) {
    if (r._id) set.add(String(r._id));
  }
  return set;
}

export function accountMatchesActiveParties(
  account: { name?: string; businessName?: string },
  activePartyKeys: Set<string>
): boolean {
  const keys = [
    normalizePartyKey(account.businessName),
    normalizePartyKey(account.name),
  ].filter((k) => k.length > 0);
  return keys.some((k) => activePartyKeys.has(k));
}

export type BillActivityStatus = "active" | "inactive";

export interface CustomerActivityClassification {
  total: number;
  active: number;
  inactive: number;
  /** Display names (business name preferred), sorted, unique per bucket */
  activeNames: string[];
  inactiveNames: string[];
  idToStatus: Map<string, BillActivityStatus>;
  activePartyKeys: Set<string>;
  cutoff: Date;
}

function customerDisplayName(c: {
  businessName?: string;
  name?: string;
}): string {
  const s = String(c.businessName || c.name || "").trim();
  return s || "—";
}

export async function classifyCustomersByQuotations(
  settings: ISystemSettings
): Promise<CustomerActivityClassification> {
  const cutoff = getCutoffDate(settings);
  const activePartyKeys = await loadActivePartyKeysSince(cutoff);

  const customers = await Account.find({
    accountType: { $regex: /^customer$/i },
  })
    .select("_id name businessName accountType")
    .lean();

  const idToStatus = new Map<string, BillActivityStatus>();
  const activeNameSet = new Set<string>();
  const inactiveNameSet = new Set<string>();
  let active = 0;
  let inactive = 0;

  for (const c of customers) {
    const id = String(c._id);
    const isActive = accountMatchesActiveParties(c, activePartyKeys);
    const label = customerDisplayName(c);
    if (isActive) {
      active++;
      idToStatus.set(id, "active");
      activeNameSet.add(label);
    } else {
      inactive++;
      idToStatus.set(id, "inactive");
      inactiveNameSet.add(label);
    }
  }

  const activeNames = [...activeNameSet].sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: "base" })
  );
  const inactiveNames = [...inactiveNameSet].sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: "base" })
  );

  return {
    total: customers.length,
    active,
    inactive,
    activeNames,
    inactiveNames,
    idToStatus,
    activePartyKeys,
    cutoff,
  };
}
