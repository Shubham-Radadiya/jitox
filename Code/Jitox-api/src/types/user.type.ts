import { Document, Types } from "mongoose";
import type { AppRole } from "../constants/roles";

export interface IUser extends Document {
  name?: string;
  email: string;
  password: string;
  role: AppRole;
  permissions?: string[];
  phone?: string;
  createdAt: Date;
  updatedAt: Date;
  firstName?: string;
  lastName?: string;
  /** @deprecated */
  address?: string;
  fullAddressBackup?: string;
  streetAddress?: string;
  area?: string;
  country?: string;
  pincode?: string;
  city?: string;
  state?: string;
  taluka?: string;
  district?: string;
  region?: string;
  profilePhoto?: string;
  /** User who created this account (admin/manager). */
  createdBy?: Types.ObjectId;
  /** Manager or admin this user reports to (team hierarchy). */
  parentUserId?: Types.ObjectId;
}
