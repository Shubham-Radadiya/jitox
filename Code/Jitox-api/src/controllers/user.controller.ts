import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { User } from "../models/index";
import { ensureDefaultUsers } from "../seed/ensureDefaultUsers";
import { sendEmail } from "../helper/sendEmail";
import { AppError } from "../common/errors/AppError";
import { HttpStatusCode } from "../common/errors/httpStatusCode";
import { validateAndRespond } from "../utils/validateAndRespond";
import {
  DEFAULT_SELF_REGISTER_PERMISSIONS,
  effectivePermissions,
  sanitizePermissionList,
} from "../constants/permissions";
import { parseRole, Role } from "../constants/roles";
import {
  assertRequiredAddressParts,
  normalizeStructuredAddress,
  seedFromLegacyAddress,
  trimAddressPart,
} from "../utils/address.util";
import { toPublicUser } from "../utils/userAddress.dto";
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

const otpStore: Record<string, { otp: string; expiresAt: number }> = {};

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

    const permissions = effectivePermissions(user.role, user.permissions);

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
        permissions,
      },
    });
  } catch (error) {
    throw error;
  }
};

/** Public self-registration — always `User` with default module access. */
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

    const emailNormalized = String(email).trim().toLowerCase();
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

    await user.save();

    const permissions = effectivePermissions(user.role, user.permissions);
    const pub = toPublicUser(user);

    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: user._id,
        name: displayName(user),
        email: user.email,
        role: user.role,
        permissions,
        firstName,
        lastName,
        fullAddress: pub.fullAddress,
        addressSummary: pub.addressSummary,
        streetAddress: pub.streetAddress,
        city: pub.city,
        state: pub.state,
        pincode: pub.pincode,
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
    } else if (permissionsStored.length === 0) {
      permissionsStored = ["dashboard"];
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const fullName = [firstName, lastName].filter(Boolean).join(" ").trim();
    const region = trimAddressPart(req.body.region);

    const user = new User({
      email: emailNormalized,
      password: hashedPassword,
      role: parsedRole,
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
      ...(region ? { region } : {}),
      ...(req.file
        ? { profilePhoto: `/uploads/${req.file.filename}` }
        : {}),
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
      user.role = parsed;
    }
    if (req.body.permissions !== undefined) {
      const raw = permissionsFromMultipart(req.body.permissions);
      let nextPerms = sanitizePermissionList(
        raw !== undefined ? raw : req.body.permissions
      );
      if (user.role === Role.admin) {
        user.permissions = [];
      } else {
        if (nextPerms.length === 0) {
          nextPerms = ["dashboard"];
        }
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
        profilePhoto: updatedUser.profilePhoto,
      },
    });
  } catch (error) {
    console.error("Update User Error:", error);
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

export const getAllUsers = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const users = await User.find().select("-password");

    res.status(200).json({
      message: "Users fetched successfully",
      count: users.length,
      users: users.map((u) => toPublicUser(u as IUser)),
    });
  } catch (error) {
    console.error("Get All Users Error:", error);
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

    res.status(200).json({
      message: "User fetched successfully",
      user: toPublicUser(user as IUser),
    });
  } catch (error) {
    console.error("Get User By ID Error:", error);
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

export const sendOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    const requiredFields = ["email"] as const;

    validateAndRespond(req.body, requiredFields, res);

    const user = await User.findOne({ email });
    if (!user) {
      throw new AppError(HttpStatusCode.NOT_FOUND, "User not found.");
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    otpStore[email] = { otp, expiresAt: Date.now() + 5 * 60 * 1000 };

    const emailConfigured = Boolean(
      process.env.EMAIL_USER?.trim() && process.env.EMAIL_PASS?.trim()
    );

    if (emailConfigured) {
      await sendEmail({
        to: email,
        subject: "Your OTP Code for Password Reset",
        text: `Hello ${displayName(user)},\n\nYour OTP code is: ${otp}\n\nThis code will expire in 5 minutes.\n\nThank you,\nJitox System`,
      });
    } else if (process.env.NODE_ENV === "development") {
      console.warn(`[dev] Password reset OTP for ${email}: ${otp}`);
    }

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

    const storedOtp = otpStore[email];
    if (!storedOtp) {
      throw new AppError(
        HttpStatusCode.BAD_REQUEST,
        "No OTP found for this email."
      );
    }

    if (Date.now() > storedOtp.expiresAt) {
      delete otpStore[email];
      throw new AppError(
        HttpStatusCode.BAD_REQUEST,
        "OTP expired. Please request a new one."
      );
    }

    if (storedOtp.otp !== otp) {
      throw new AppError(HttpStatusCode.BAD_REQUEST, "Invalid OTP.");
    }

    otpStore[email].otp = "VERIFIED";

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

    const otpData = otpStore[email];
    if (!otpData || otpData.otp !== "VERIFIED") {
      throw new AppError(HttpStatusCode.BAD_REQUEST, "OTP not verified.");
    }

    const user = await User.findOne({ email });
    if (!user) {
      throw new AppError(HttpStatusCode.NOT_FOUND, "User not found.");
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    delete otpStore[email];

    res.status(200).json({ message: "Password changed successfully." });
  } catch (error) {
    console.error("Change Password Error:", error);
    throw error;
  }
};
