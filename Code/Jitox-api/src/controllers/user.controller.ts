import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { User, Employee } from "../models/index";
import type { AuthRequest } from "../middleware/authonticated.middleware";
import { ensureDefaultUsers } from "../seed/ensureDefaultUsers";
import { isEmailConfigured, sendEmail } from "../helper/sendEmail";
import * as otpService from "../services/otp.service";
import { AppError } from "../common/errors/AppError";
import { HttpStatusCode } from "../common/errors/httpStatusCode";
import { validateAndRespond } from "../utils/validateAndRespond";
import {
  DEFAULT_MANAGER_PERMISSIONS,
  DEFAULT_SELF_REGISTER_PERMISSIONS,
  assertClientAllowedForRole,
  effectivePermissions,
  permissionsPayloadForClient,
  sanitizePermissionList,
  type AuthClient,
} from "../constants/permissions";
import {
  AccountStatus,
  effectiveAccountStatus,
} from "../constants/accountStatus";
import { parseRole, Role } from "../constants/roles";
import {
  assertRequiredAddressParts,
  normalizeStructuredAddress,
  seedFromLegacyAddress,
  trimAddressPart,
} from "../utils/address.util";
import { toPublicUser } from "../utils/userAddress.dto";
import { buildUserSummary } from "../services/userSummary.service";
import { applyTerritoryAssignmentToUser } from "../services/territory.service";
import type { IUser } from "../types/user.type";

/** FormData sends JSON arrays as strings — normalize before `sanitizePermissionList`. */
function permissionsFromMultipart(raw: unknown): unknown {
  if (raw === undefined) return undefined;
  if (Array.isArray(raw)) return raw;
  if (typeof raw === "string") {
    const t = raw.trim();
    if (!t) return [];
    try {
      const v = JSON.parse(t) as unknown;
      return Array.isArray(v) ? v : [];
    } catch {
      return [];
    }
  }
  return raw;
}

const normalizeEmail = (email: unknown): string =>
  String(email).trim().toLowerCase();

const generateOtp = (): string =>
  Math.floor(100000 + Math.random() * 900000).toString();

/** Store OTP in MongoDB and deliver by email (registration must send; reset may skip in dev). */
const issueOtp = async (opts: {
  email: string;
  subject: string;
  bodyIntro: string;
  requireDelivery: boolean;
}): Promise<string> => {
  const email = normalizeEmail(opts.email);
  const otp = generateOtp();
  await otpService.saveOtp(email, otp);

  const emailConfigured = isEmailConfigured();

  if (emailConfigured) {
    try {
      await sendEmail({
        to: email,
        subject: opts.subject,
        text: `${opts.bodyIntro}\n\nYour verification code is: ${otp}\n\nThis code expires in 5 minutes.\n\nThank you,\nJitox System`,
      });
    } catch (err) {
      await otpService.clearOtp(email);
      console.error("[email] Failed to send OTP:", err);
      const detail =
        err instanceof Error ? err.message : "Email delivery failed.";
      throw new AppError(
        HttpStatusCode.SERVICE_UNAVAILABLE,
        `Could not send verification email. ${detail}`
      );
    }
  } else if (process.env.NODE_ENV === "development") {
    console.warn(`[dev] OTP for ${email}: ${otp}`);
  } else if (opts.requireDelivery) {
    await otpService.clearOtp(email);
    throw new AppError(
      HttpStatusCode.SERVICE_UNAVAILABLE,
      "Email service is not configured. Please try again later or contact support."
    );
  }

  return otp;
};

const displayName = (user: InstanceType<typeof User>): string => {
  if (user.name?.trim()) return user.name.trim();
  const parts = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
  return parts || user.email;
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    validateAndRespond(req.body, ["email", "password"] as const, res);

    if (!process.env.JWT_SECRET_KEY?.trim()) {
      throw new AppError(
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        "Server configuration error: JWT_SECRET_KEY is not set"
      );
    }

    const emailNormalized = String(email).trim().toLowerCase();
    const user = await User.findOne({ email: emailNormalized });
    if (!user) {
      throw new AppError(
        HttpStatusCode.UNAUTHORIZED,
        "Invalid email or password"
      );
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new AppError(
        HttpStatusCode.UNAUTHORIZED,
        "Invalid email or password"
      );
    }

    const clientRaw = String(
      req.body.client ?? req.query.client ?? "web"
    ).toLowerCase();
    const client: AuthClient = clientRaw === "mobile" ? "mobile" : "web";

    try {
      assertClientAllowedForRole(user.role, client);
    } catch (e) {
      throw new AppError(
        HttpStatusCode.FORBIDDEN,
        e instanceof Error ? e.message : "Login not allowed for this app"
      );
    }

    if (client === "mobile" && user.role === Role.user) {
      const status = effectiveAccountStatus(user.accountStatus);
      if (status === AccountStatus.PENDING) {
        throw new AppError(
          HttpStatusCode.FORBIDDEN,
          "Your account is pending admin approval. You will be able to log in after an administrator approves your registration."
        );
      }
      if (status === AccountStatus.REJECTED) {
        throw new AppError(
          HttpStatusCode.FORBIDDEN,
          "Your registration was not approved. Please contact your administrator."
        );
      }
    }

    const permissions = effectivePermissions(user.role, user.permissions);
    const accessMeta = permissionsPayloadForClient(user.role, permissions);

    const token = jwt.sign(
      { id: user._id, role: user.role, permissions },
      process.env.JWT_SECRET_KEY,
      { expiresIn: "1d" }
    );

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: displayName(user),
        email: user.email,
        role: user.role,
        ...accessMeta,
        territoryId: user.territoryId,
        managerId: user.managerId,
        region: user.region,
        accountStatus: effectiveAccountStatus(user.accountStatus),
      },
    });
  } catch (error) {
    throw error;
  }
};

/** Public self-registration — always field `User` (mobile app; no dashboard modules). */
export const registerUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { email, password, firstName, lastName } = req.body;

    const requiredFields = [
      "firstName",
      "lastName",
      "email",
      "password",
    ] as const;

    validateAndRespond(req.body, requiredFields, res);

    let addr = normalizeStructuredAddress(req.body);
    const legacy = trimAddressPart(req.body.address);
    if (!trimAddressPart(addr.streetAddress) && legacy) {
      const b = seedFromLegacyAddress(legacy);
      addr = { ...addr, streetAddress: b.streetAddress! };
    }
    if (!trimAddressPart(addr.country)) {
      addr = { ...addr, country: "India" };
    }
    assertRequiredAddressParts(addr);

    const emailNormalized = normalizeEmail(email);
    await otpService.assertOtpVerified(emailNormalized);

    const existingUser = await User.findOne({ email: emailNormalized });
    if (existingUser) {
      throw new AppError(HttpStatusCode.BAD_REQUEST, "User already exists.");
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const fullName = [firstName, lastName].filter(Boolean).join(" ").trim();

    const user = new User({
      email: emailNormalized,
      password: hashedPassword,
      role: Role.user,
      accountStatus: AccountStatus.PENDING,
      permissions: [...DEFAULT_SELF_REGISTER_PERMISSIONS],
      ...(fullName ? { name: fullName } : {}),
      firstName,
      lastName,
      fullAddressBackup: legacy || undefined,
      streetAddress: addr.streetAddress,
      area: addr.area,
      city: addr.city,
      taluka: addr.taluka,
      district: addr.district,
      state: addr.state,
      country: addr.country,
      pincode: addr.pincode,
    });

    await applyTerritoryAssignmentToUser(user, { reResolveFromAddress: true });
    await user.save();

    await otpService.clearOtp(emailNormalized);

    const permissions = effectivePermissions(user.role, user.permissions);
    const pub = toPublicUser(user);

    res.status(201).json({
      message:
        "Registration submitted. Please wait for admin approval before logging in.",
      user: {
        id: user._id,
        name: displayName(user),
        email: user.email,
        role: user.role,
        accountStatus: user.accountStatus,
        permissions,
        firstName,
        lastName,
        fullAddress: pub.fullAddress,
        addressSummary: pub.addressSummary,
        streetAddress: pub.streetAddress,
        city: pub.city,
        state: pub.state,
        pincode: pub.pincode,
        territoryId: user.territoryId,
        managerId: user.managerId,
        region: user.region,
      },
    });
  } catch (error) {
    console.error("Register User Error:", error);
    throw error;
  }
};

/** Admin-only: create any role and assign module permissions. */
export const createUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      email,
      password,
      role: roleRaw,
      firstName,
      lastName,
      phone,
    } = req.body;

    const requiredFields = [
      "firstName",
      "lastName",
      "email",
      "password",
    ] as const;

    validateAndRespond(req.body, requiredFields, res);

    let addr = normalizeStructuredAddress(req.body);
    const legacy = trimAddressPart(req.body.address);
    if (!trimAddressPart(addr.streetAddress) && legacy) {
      const b = seedFromLegacyAddress(legacy);
      addr = { ...addr, streetAddress: b.streetAddress! };
    }
    if (!trimAddressPart(addr.country)) {
      addr = { ...addr, country: "India" };
    }
    assertRequiredAddressParts(addr);

    const parsedRole = parseRole(roleRaw) ?? Role.user;
    const emailNormalized = String(email).trim().toLowerCase();

    const existingUser = await User.findOne({ email: emailNormalized });
    if (existingUser) {
      throw new AppError(HttpStatusCode.BAD_REQUEST, "User already exists.");
    }

    let permissionsStored = sanitizePermissionList(
      permissionsFromMultipart(req.body.permissions) ?? req.body.permissions
    );
    if (parsedRole === Role.admin) {
      permissionsStored = [];
    } else if (parsedRole === Role.manager && permissionsStored.length === 0) {
      permissionsStored = [...DEFAULT_MANAGER_PERMISSIONS];
    } else if (parsedRole === Role.user) {
      permissionsStored = [];
    } else if (permissionsStored.length === 0) {
      permissionsStored = ["dashboard"];
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const fullName = [firstName, lastName].filter(Boolean).join(" ").trim();
    const region = trimAddressPart(req.body.region);

    const authReq = req as AuthRequest;
    const creatorId = authReq.user?.id;
    const parentRaw = req.body.parentUserId ?? req.body.parent_user_id;
    let parentUserId: mongoose.Types.ObjectId | undefined;
    if (parentRaw && mongoose.isValidObjectId(String(parentRaw))) {
      parentUserId = new mongoose.Types.ObjectId(String(parentRaw));
    }

    const user = new User({
      email: emailNormalized,
      password: hashedPassword,
      role: parsedRole,
      accountStatus: AccountStatus.APPROVED,
      permissions: permissionsStored,
      ...(phone ? { phone: String(phone).trim() } : {}),
      ...(fullName ? { name: fullName } : {}),
      firstName,
      lastName,
      fullAddressBackup: legacy || undefined,
      streetAddress: addr.streetAddress,
      area: addr.area,
      city: addr.city,
      taluka: addr.taluka,
      district: addr.district,
      state: addr.state,
      country: addr.country,
      pincode: addr.pincode,
      ...(region && parsedRole !== Role.admin ? { region } : {}),
      ...(req.file
        ? { profilePhoto: `/uploads/${req.file.filename}` }
        : {}),
      ...(creatorId && mongoose.isValidObjectId(String(creatorId))
        ? { createdBy: new mongoose.Types.ObjectId(String(creatorId)) }
        : {}),
      ...(parentUserId ? { parentUserId } : {}),
    });

    await applyTerritoryAssignmentToUser(user, {
      territoryId: req.body.territoryId,
      managerId: req.body.managerId,
      reResolveFromAddress: parsedRole === Role.user,
    });
    await user.save();

    const permissions = effectivePermissions(user.role, user.permissions);
    const pub = toPublicUser(user);

    res.status(201).json({
      message: "User created successfully",
      user: {
        id: user._id,
        name: displayName(user),
        email: user.email,
        role: user.role,
        permissions,
        phone: user.phone,
        firstName,
        lastName,
        fullAddress: pub.fullAddress,
        addressSummary: pub.addressSummary,
        streetAddress: pub.streetAddress,
        city: pub.city,
        state: pub.state,
        taluka: pub.taluka,
        district: pub.district,
        area: pub.area,
        country: pub.country,
        pincode: pub.pincode,
        region: user.region,
        profilePhoto: user.profilePhoto,
      },
    });
  } catch (error) {
    console.error("Create User Error:", error);
    throw error;
  }
};

export const updateUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      name,
      email,
      password,
      role: roleRaw,
      firstName,
      lastName,
      phone,
    } = req.body;

    const user = await User.findById(id);
    if (!user) {
      throw new AppError(HttpStatusCode.NOT_FOUND, "User not found.");
    }

    if (name) user.name = name;
    if (email) {
      const emailNorm = String(email).trim().toLowerCase();
      const emailExists = await User.findOne({
        email: emailNorm,
        _id: { $ne: id },
      });
      if (emailExists) {
        throw new AppError(
          HttpStatusCode.BAD_REQUEST,
          "This Email is already exits."
        );
      }
      user.email = emailNorm;
    }
    if (password && String(password).trim() !== "") {
      user.password = await bcrypt.hash(password, 10);
    }
    if (roleRaw !== undefined && roleRaw !== null && roleRaw !== "") {
      const parsed = parseRole(roleRaw);
      if (!parsed) {
        throw new AppError(HttpStatusCode.BAD_REQUEST, "Invalid role.");
      }
      if (parsed === Role.admin) {
        const authReq = req as AuthRequest;
        if (authReq.user?.role !== Role.admin) {
          throw new AppError(
            HttpStatusCode.FORBIDDEN,
            "Only admins can assign the Admin role."
          );
        }
      }
      user.role = parsed;
      if (parsed === Role.user) {
        user.permissions = [];
      } else if (parsed === Role.admin) {
        user.permissions = [];
      }
    }
    if (req.body.permissions !== undefined) {
      const raw = permissionsFromMultipart(req.body.permissions);
      let nextPerms = sanitizePermissionList(
        raw !== undefined ? raw : req.body.permissions
      );
      if (user.role === Role.admin) {
        user.permissions = [];
      } else if (user.role === Role.user) {
        user.permissions = [];
      } else if (user.role === Role.manager) {
        user.permissions =
          nextPerms.length === 0
            ? [...DEFAULT_MANAGER_PERMISSIONS]
            : nextPerms;
      } else if (nextPerms.length === 0) {
        user.permissions = ["dashboard"];
      } else {
        user.permissions = nextPerms;
      }
    }
    if (phone !== undefined) {
      user.phone = phone ? String(phone).trim() : undefined;
    }
    if (firstName !== undefined) user.firstName = firstName;
    if (lastName !== undefined) user.lastName = lastName;

    const addrTouchKeys = [
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
      "address",
    ];
    const touchingAddr = addrTouchKeys.some((k) => req.body[k] !== undefined);
    if (touchingAddr) {
      let addr = normalizeStructuredAddress({
        streetAddress: req.body.streetAddress ?? req.body.street_address ?? user.streetAddress,
        area: req.body.area ?? user.area,
        city: req.body.city ?? user.city,
        taluka: req.body.taluka ?? user.taluka,
        district: req.body.district ?? user.district,
        state: req.body.state ?? user.state,
        country: req.body.country ?? user.country,
        pincode: req.body.pincode ?? req.body.pinCode ?? user.pincode,
      });
      const legacyIn = trimAddressPart(req.body.address);
      if (!trimAddressPart(addr.streetAddress) && legacyIn) {
        const b = seedFromLegacyAddress(legacyIn);
        addr = { ...addr, streetAddress: b.streetAddress! };
        user.fullAddressBackup = user.fullAddressBackup || b.fullAddressBackup;
      }
      if (
        !trimAddressPart(addr.streetAddress) &&
        trimAddressPart(user.address) &&
        !legacyIn
      ) {
        addr = { ...addr, streetAddress: trimAddressPart(user.address) };
      }
      if (!trimAddressPart(addr.country)) {
        addr = { ...addr, country: trimAddressPart(user.country) || "India" };
      }
      assertRequiredAddressParts(addr);
      user.streetAddress = addr.streetAddress;
      user.area = addr.area;
      user.city = addr.city;
      user.taluka = addr.taluka;
      user.district = addr.district;
      user.state = addr.state;
      user.country = addr.country;
      user.pincode = addr.pincode;
    }

    if (req.body.region !== undefined) {
      const r = trimAddressPart(req.body.region);
      user.region = r || undefined;
    }
    const parentTouch =
      req.body.parentUserId !== undefined ||
      req.body.parent_user_id !== undefined;
    if (parentTouch) {
      const parentRaw = req.body.parentUserId ?? req.body.parent_user_id;
      if (parentRaw === "" || parentRaw === null) {
        user.parentUserId = undefined;
      } else if (mongoose.isValidObjectId(String(parentRaw))) {
        user.parentUserId = new mongoose.Types.ObjectId(String(parentRaw));
      } else {
        throw new AppError(HttpStatusCode.BAD_REQUEST, "Invalid parent user id.");
      }
    }
    if (req.file) {
      user.profilePhoto = `/uploads/${req.file.filename}`;
    }

    if (!name && (firstName !== undefined || lastName !== undefined)) {
      const combined = [user.firstName, user.lastName]
        .filter(Boolean)
        .join(" ")
        .trim();
      if (combined) user.name = combined;
    }

    if (user.role !== Role.admin && (!user.permissions || user.permissions.length === 0)) {
      user.permissions = ["dashboard"];
    }
    if (user.role === Role.admin) {
      user.permissions = [];
    }

    const territoryIdInBody =
      req.body.territoryId !== undefined &&
      req.body.territoryId !== null &&
      String(req.body.territoryId).trim() !== "";
    await applyTerritoryAssignmentToUser(user, {
      territoryId: req.body.territoryId,
      managerId: req.body.managerId,
      reResolveFromAddress:
        touchingAddr && user.role === Role.user && !territoryIdInBody,
    });

    const updatedUser = await user.save();
    const permissions = effectivePermissions(
      updatedUser.role,
      updatedUser.permissions
    );
    const pub = toPublicUser(updatedUser);

    res.status(200).json({
      message: "User updated successfully",
      user: {
        id: updatedUser._id,
        name: displayName(updatedUser),
        email: updatedUser.email,
        role: updatedUser.role,
        permissions,
        phone: updatedUser.phone,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        fullAddress: pub.fullAddress,
        addressSummary: pub.addressSummary,
        streetAddress: pub.streetAddress,
        city: pub.city,
        state: pub.state,
        taluka: pub.taluka,
        district: pub.district,
        area: pub.area,
        country: pub.country,
        pincode: pub.pincode,
        region: updatedUser.region,
        territoryId: updatedUser.territoryId,
        managerId: updatedUser.managerId,
        profilePhoto: updatedUser.profilePhoto,
      },
    });
  } catch (error) {
    console.error("Update User Error:", error);
    throw error;
  }
};

/** Admin approves a pending mobile self-registration. */
export const approveUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      throw new AppError(HttpStatusCode.BAD_REQUEST, "Invalid user id.");
    }

    const user = await User.findById(id);
    if (!user) {
      throw new AppError(HttpStatusCode.NOT_FOUND, "User not found.");
    }

    if (user.role !== Role.user) {
      throw new AppError(
        HttpStatusCode.BAD_REQUEST,
        "Only field user accounts can be approved through this action."
      );
    }

    const current = effectiveAccountStatus(user.accountStatus);
    if (current === AccountStatus.APPROVED) {
      throw new AppError(HttpStatusCode.BAD_REQUEST, "User is already approved.");
    }

    user.accountStatus = AccountStatus.APPROVED;
    await user.save();

    const pub = toPublicUser(user);
    res.status(200).json({
      message: "User approved successfully.",
      user: {
        id: user._id,
        name: displayName(user),
        email: user.email,
        role: user.role,
        accountStatus: user.accountStatus,
        ...pub,
      },
    });
  } catch (error) {
    console.error("Approve User Error:", error);
    throw error;
  }
};

/** Admin rejects a pending mobile self-registration. */
export const rejectUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      throw new AppError(HttpStatusCode.BAD_REQUEST, "Invalid user id.");
    }

    const user = await User.findById(id);
    if (!user) {
      throw new AppError(HttpStatusCode.NOT_FOUND, "User not found.");
    }

    if (user.role !== Role.user) {
      throw new AppError(
        HttpStatusCode.BAD_REQUEST,
        "Only field user accounts can be rejected through this action."
      );
    }

    const current = effectiveAccountStatus(user.accountStatus);
    if (current === AccountStatus.REJECTED) {
      throw new AppError(HttpStatusCode.BAD_REQUEST, "User is already rejected.");
    }

    user.accountStatus = AccountStatus.REJECTED;
    await user.save();

    const pub = toPublicUser(user);
    res.status(200).json({
      message: "User registration rejected.",
      user: {
        id: user._id,
        name: displayName(user),
        email: user.email,
        role: user.role,
        accountStatus: user.accountStatus,
        ...pub,
      },
    });
  } catch (error) {
    console.error("Reject User Error:", error);
    throw error;
  }
};

export const deleteUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    const deletedUser = await User.findByIdAndDelete(id);

    if (!deletedUser) {
      throw new AppError(HttpStatusCode.NOT_FOUND, "User not found.");
    }

    res.status(200).json({
      message: "User deleted successfully",
      user: {
        id: deletedUser._id,
        name: displayName(deletedUser),
        email: deletedUser.email,
        role: deletedUser.role,
      },
    });
  } catch (error) {
    console.error("Delete User Error:", error);
    throw error;
  }
};

/** HRM employees linked to a User Master account (`Employee.linkedUserId`). */
async function linkedEmployeeCountByUserId(): Promise<Map<string, number>> {
  const grouped = await Employee.aggregate<{ _id: mongoose.Types.ObjectId; count: number }>([
    { $match: { linkedUserId: { $exists: true, $ne: null } } },
    { $group: { _id: "$linkedUserId", count: { $sum: 1 } } },
  ]);
  const map = new Map<string, number>();
  for (const row of grouped) {
    if (row._id) map.set(String(row._id), row.count);
  }
  return map;
}

function mapEmployeeForUserList(e: {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  phone?: string;
  roleDesignation?: string;
  department?: string;
  status?: string;
  linkedUserId?: mongoose.Types.ObjectId;
}) {
  const idStr = String(e._id);
  return {
    _id: idStr,
    id: idStr,
    isHrmEmployee: true,
    name: e.name,
    email: e.email,
    phone: e.phone,
    roleDesignation: e.roleDesignation,
    department: e.department,
    status: e.status,
    linkedUserId: e.linkedUserId ? String(e.linkedUserId) : undefined,
  };
}

export const getAllUsers = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const users = await User.find().select("-password");
    const subordinateCounts = await linkedEmployeeCountByUserId();

    res.status(200).json({
      message: "Users fetched successfully",
      count: users.length,
      users: users.map((u) => {
        const pub = toPublicUser(u as IUser);
        const id = String(u._id);
        return {
          ...pub,
          subordinateCount: subordinateCounts.get(id) ?? 0,
        };
      }),
    });
  } catch (error) {
    console.error("Get All Users Error:", error);
    throw error;
  }
};

/** HRM employees linked to this User Master account (`Employee.linkedUserId`). */
export const getSubordinateUsers = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(String(id))) {
      throw new AppError(HttpStatusCode.BAD_REQUEST, "Invalid user id.");
    }

    const parent = await User.findById(id).select("_id role");
    if (!parent) {
      throw new AppError(HttpStatusCode.NOT_FOUND, "User not found.");
    }

    const employees = await Employee.find({ linkedUserId: id })
      .select("name email phone roleDesignation department status linkedUserId")
      .sort({ name: 1 })
      .lean();

    const mapped = employees.map((e) => mapEmployeeForUserList(e));

    res.status(200).json({
      message: "Linked employees fetched successfully",
      source: "hrm",
      count: mapped.length,
      employees: mapped,
      users: mapped,
    });
  } catch (error) {
    console.error("Get Subordinate Users Error:", error);
    throw error;
  }
};

export const getUserByUserId = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    const user = await User.findById(id).select("-password");

    if (!user) {
      throw new AppError(HttpStatusCode.NOT_FOUND, "User not found.");
    }

    const subordinateCount = await Employee.countDocuments({ linkedUserId: id });

    res.status(200).json({
      message: "User fetched successfully",
      user: {
        ...toPublicUser(user as IUser),
        subordinateCount,
      },
    });
  } catch (error) {
    console.error("Get User By ID Error:", error);
    throw error;
  }
};

export const getUserSummaryById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const summary = await buildUserSummary(id);
    if (!summary) {
      throw new AppError(HttpStatusCode.NOT_FOUND, "User not found.");
    }
    res.status(200).json({
      message: "User summary loaded",
      summary,
    });
  } catch (error) {
    console.error("Get User Summary Error:", error);
    throw error;
  }
};

export const createAdminAndUser = async (req: Request, res: Response) => {
  try {
    await ensureDefaultUsers();

    const admin = await User.findOne({ email: "admin@gmail.com" });
    const manager = await User.findOne({ email: "manager@gmail.com" });
    const testUser = await User.findOne({ email: "testuser@gmail.com" });
    if (!admin || !manager || !testUser) {
      throw new AppError(
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        "Default users could not be created or loaded."
      );
    }

    const msg =
      process.env.NODE_ENV === "development"
        ? "Default users are ready (created if they were missing). Local dev password for all: 123456"
        : "Default users are ready (created if they were missing).";

    res.status(200).json({
      message: msg,
      users: [
        {
          id: admin._id,
          name: displayName(admin),
          email: admin.email,
          role: admin.role,
        },
        {
          id: manager._id,
          name: displayName(manager),
          email: manager.email,
          role: manager.role,
        },
        {
          id: testUser._id,
          name: displayName(testUser),
          email: testUser.email,
          role: testUser.role,
        },
      ],
    });
  } catch (error) {
    console.error("Create Admin and User Error:", error);
    throw error;
  }
};

/** Send OTP to verify email before self-registration (user must not exist yet). */
export const sendRegistrationOtp = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { email } = req.body;

    validateAndRespond(req.body, ["email"] as const, res);

    const emailNormalized = normalizeEmail(email);
    const existingUser = await User.findOne({ email: emailNormalized });
    if (existingUser) {
      throw new AppError(
        HttpStatusCode.BAD_REQUEST,
        "An account with this email already exists. Please log in."
      );
    }

    const otp = await issueOtp({
      email: emailNormalized,
      subject: "Verify your email — Jitox Agro registration",
      bodyIntro: "Hello,\n\nUse this code to verify your email and complete registration.",
      requireDelivery: true,
    });

    const payload: Record<string, unknown> = {
      message: "Verification code sent to your email.",
    };

    if (
      process.env.NODE_ENV === "development" &&
      process.env.EXPOSE_OTP_IN_DEV === "true"
    ) {
      payload.otp = otp;
    }

    res.status(200).json(payload);
  } catch (error) {
    console.error("Send Registration OTP Error:", error);
    throw error;
  }
};

export const sendOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    const requiredFields = ["email"] as const;

    validateAndRespond(req.body, requiredFields, res);

    const emailNormalized = normalizeEmail(email);
    const user = await User.findOne({ email: emailNormalized });
    if (!user) {
      throw new AppError(HttpStatusCode.NOT_FOUND, "User not found.");
    }

    const otp = await issueOtp({
      email: emailNormalized,
      subject: "Your OTP Code for Password Reset",
      bodyIntro: `Hello ${displayName(user)},\n\nUse this code to reset your password.`,
      requireDelivery: false,
    });

    const emailConfigured = isEmailConfigured();

    const payload: Record<string, unknown> = {
      message: emailConfigured
        ? "OTP sent successfully to your email."
        : "If this email is registered, check your inbox or contact support.",
    };

    if (
      process.env.NODE_ENV === "development" &&
      process.env.EXPOSE_OTP_IN_DEV === "true"
    ) {
      payload.otp = otp;
    }

    res.status(200).json(payload);
  } catch (error) {
    console.error("Send OTP Error:", error);
    throw error;
  }
};

export const verifyOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, otp } = req.body;

    const requiredFields = ["email", "otp"] as const;

    validateAndRespond(req.body, requiredFields, res);

    const emailNormalized = normalizeEmail(email);
    const otpNormalized = String(otp).trim();

    await otpService.verifyOtpCode(emailNormalized, otpNormalized);

    res.status(200).json({ message: "OTP verified successfully." });
  } catch (error) {
    console.error("Verify OTP Error:", error);
    throw error;
  }
};

export const changePassword = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { email, newPassword } = req.body;

    const requiredFields = ["email", "newPassword"] as const;

    validateAndRespond(req.body, requiredFields, res);

    const emailNormalized = normalizeEmail(email);
    await otpService.assertPasswordResetVerified(emailNormalized);

    const user = await User.findOne({ email: emailNormalized });
    if (!user) {
      throw new AppError(HttpStatusCode.NOT_FOUND, "User not found.");
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    await otpService.clearOtp(emailNormalized);

    res.status(200).json({ message: "Password changed successfully." });
  } catch (error) {
    console.error("Change Password Error:", error);
    throw error;
  }
};
