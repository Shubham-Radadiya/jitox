import { Request, Response } from "express";
import { Account, getOrCreateSystemSettings } from "../models/index";
import { validateAndRespond } from "../utils/validateAndRespond";
import { AppError } from "../common/errors/AppError";
import { HttpStatusCode } from "../common/errors/httpStatusCode";
import { sendSuccess } from "../utils/apiResponse";
import {
  classifyCustomersByQuotations,
  isCustomerAccount,
  type CustomerActivityClassification,
} from "../services/customerActivity.service";
import {
  assertRequiredAddressParts,
  buildFullAddressComma,
  buildFullAddressMultiline,
  buildAddressTableSummary,
  normalizeStructuredAddress,
  seedFromLegacyAddress,
  trimAddressPart,
} from "../utils/address.util";

function parseAccountStructuredAddress(
  body: Record<string, unknown>
): {
  addr: ReturnType<typeof normalizeStructuredAddress>;
  legacyResidential: string;
} {
  const raw: Record<string, unknown> = { ...body };
  if (!raw.pincode && raw.pinCode) raw.pincode = raw.pinCode;

  let addr = normalizeStructuredAddress(raw);

  const mergedStreet = [trimAddressPart(raw.shopNo), trimAddressPart(raw.street)]
    .filter(Boolean)
    .join(", ");
  if (!trimAddressPart(addr.streetAddress) && mergedStreet) {
    addr = { ...addr, streetAddress: mergedStreet };
  }

  const legacyResidential = trimAddressPart(
    typeof body.residentialAddress === "string" ? body.residentialAddress : ""
  );
  if (!trimAddressPart(addr.streetAddress) && legacyResidential) {
    const b = seedFromLegacyAddress(legacyResidential);
    addr = { ...addr, streetAddress: b.streetAddress! };
  }

  if (!trimAddressPart(addr.country)) {
    addr = { ...addr, country: "India" };
  }

  return { addr, legacyResidential };
}

function applyStructuredAddressToAccountPayload(
  accountData: Record<string, unknown>,
  addr: ReturnType<typeof normalizeStructuredAddress>,
  legacyResidential: string
): void {
  accountData.streetAddress = addr.streetAddress;
  accountData.area = addr.area;
  accountData.city = addr.city;
  accountData.taluka = addr.taluka;
  accountData.district = addr.district;
  accountData.state = addr.state;
  accountData.country = addr.country;
  accountData.pincode = addr.pincode;
  accountData.pinCode = addr.pincode;
  accountData.residentialAddress = buildFullAddressComma(addr);
  if (
    legacyResidential &&
    legacyResidential !== String(accountData.residentialAddress)
  ) {
    accountData.residentialFullAddressBackup =
      (accountData.residentialFullAddressBackup as string) || legacyResidential;
  }
}

function enrichAccountJson(a: object): Record<string, unknown> {
  const raw = a as Record<string, unknown>;
  const addr = normalizeStructuredAddress({
    streetAddress: raw.streetAddress,
    area: raw.area,
    city: raw.city,
    taluka: raw.taluka,
    district: raw.district,
    state: raw.state,
    country: raw.country,
    pincode: raw.pincode ?? raw.pinCode,
  });
  const line =
    !trimAddressPart(addr.streetAddress) &&
    trimAddressPart(raw.residentialAddress)
      ? { ...addr, streetAddress: trimAddressPart(raw.residentialAddress) }
      : addr;
  return {
    ...raw,
    fullAddress: buildFullAddressMultiline(line),
    addressSummary: buildAddressTableSummary(line),
  };
}

export const createAccount = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const accountData = req.body as Record<string, unknown>;

    const requiredFields = [
      "businessName",
      "accountType",
      "name",
      "email",
      "mobileNumber",
      "amount",
      "balenceType",
    ] as const;

    validateAndRespond(req.body, requiredFields, res);

    const { addr, legacyResidential } =
      parseAccountStructuredAddress(accountData);
    assertRequiredAddressParts(addr);
    applyStructuredAddressToAccountPayload(
      accountData,
      addr,
      legacyResidential
    );

    if (req.file) {
      accountData.documentUpload = req.file.path;
    }

    const opening = Number(accountData.amount);
    accountData.openingAmount = Number.isFinite(opening) ? opening : 0;

    const newAccount = new Account(accountData);
    const savedAccount = await newAccount.save();

    res.status(201).json({
      message: "Account created successfully.",
      account: enrichAccountJson(savedAccount.toObject()),
    });
  } catch (error) {
    console.error("Create Account Error:", error);
    throw error;
  }
};

export const getAllAccounts = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const name = req.query.name as string | undefined;
    const status = String(req.query.status ?? "").toLowerCase();
    let filter: Record<string, unknown> = {};
    if (name) {
      filter.name = { $regex: name, $options: "i" };
    }
    if (status === "active" || status === "inactive") {
      filter.accountType = { $regex: /^customer$/i };
    }
    const accounts = await Account.find(filter).sort({ createdAt: -1 }).lean();

    let classification: CustomerActivityClassification;
    try {
      const settings = await getOrCreateSystemSettings();
      classification = await classifyCustomersByQuotations(settings);
    } catch (activityErr) {
      console.error(
        "[accounts] Customer activity classification failed; listing accounts without activity flags.",
        activityErr
      );
      classification = {
        total: 0,
        active: 0,
        inactive: 0,
        activeNames: [],
        inactiveNames: [],
        idToStatus: new Map(),
        activePartyKeys: new Set(),
        cutoff: new Date(),
      };
    }

    const enriched = accounts.map((a) => {
      const row = enrichAccountJson({ ...a } as Record<string, unknown>);
      if (isCustomerAccount(a)) {
        row.billActivityStatus =
          classification.idToStatus.get(String(a._id)) ?? "inactive";
      }
      return row;
    });

    let result = enriched;
    if (status === "active" || status === "inactive") {
      result = enriched.filter(
        (a) =>
          isCustomerAccount(a) &&
          String((a as { billActivityStatus?: string }).billActivityStatus) ===
            status
      );
    }

    sendSuccess(
      res,
      result,
      result.length ? "" : "No accounts found."
    );
  } catch (error) {
    console.error("Get All Accounts Error:", error);
    throw error;
  }
};

export const getAccountById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const account = await Account.findById(id);

    if (!account) {
      throw new AppError(HttpStatusCode.NOT_FOUND, "Account not found.");
    }

    res.status(200).json(enrichAccountJson(account.toObject()));
  } catch (error) {
    console.error("Get Account By ID Error:", error);
    throw error;
  }
};

const ACCOUNT_ADDR_KEYS = [
  "streetAddress",
  "street_address",
  "area",
  "city",
  "taluka",
  "district",
  "state",
  "country",
  "pincode",
  "pinCode",
  "street",
  "shopNo",
  "residentialAddress",
];

function mergePartyNameAliasesOnRename(
  existing: Record<string, unknown>,
  body: Record<string, unknown>
): void {
  const prev = String(existing.businessName ?? "").trim();
  const next = String(body.businessName ?? prev).trim();
  if (!prev || !next || prev === next) return;

  const aliases = new Set<string>(
    Array.isArray(existing.partyNameAliases)
      ? (existing.partyNameAliases as string[]).map((s) => String(s).trim()).filter(Boolean)
      : []
  );
  aliases.add(prev);
  body.partyNameAliases = [...aliases];
}

export const updateAccount = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const body = { ...(req.body as Record<string, unknown>) };

    const existing = await Account.findById(id).lean();
    if (!existing) {
      throw new AppError(HttpStatusCode.NOT_FOUND, "No accounts found.");
    }

    mergePartyNameAliasesOnRename(
      existing as Record<string, unknown>,
      body
    );

    const touching = ACCOUNT_ADDR_KEYS.some((k) => body[k] !== undefined);
    if (touching) {
      const merged = { ...existing, ...body } as Record<string, unknown>;
      const { addr, legacyResidential } =
        parseAccountStructuredAddress(merged);
      assertRequiredAddressParts(addr);
      applyStructuredAddressToAccountPayload(body, addr, legacyResidential);
    }

    const updatedAccount = await Account.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    });

    if (!updatedAccount) {
      throw new AppError(HttpStatusCode.NOT_FOUND, "No accounts found.");
    }

    res.status(200).json({
      message: "Account updated successfully.",
      account: enrichAccountJson(updatedAccount.toObject()),
    });
  } catch (error) {
    console.error("Update Account Error:", error);
    throw error;
  }
};

export const deleteAccount = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const deletedAccount = await Account.findByIdAndDelete(id);

    if (!deletedAccount) {
      throw new AppError(HttpStatusCode.NOT_FOUND, "Account not found.");
    }

    res.status(200).json({ message: "Account deleted successfully." });
  } catch (error) {
    console.error("Delete Account Error:", error);
    throw error;
  }
};
