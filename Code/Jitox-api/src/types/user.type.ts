import { Document, Types } from "mongoose";
import type { AccountStatusValue } from "../constants/accountStatus";
import type { AppRole } from "../constants/roles";

export interface IUser extends Document {
  name?: string;
  email: string;
  password: string;
  role: AppRole;
  /** `pending` until admin approves mobile self-registration; admin-created users are `approved`. */
  accountStatus?: AccountStatusValue;
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
  /** Sales territory assignment. */
  territoryId?: Types.ObjectId;
  /** Reporting manager (field User role). */
  managerId?: Types.ObjectId;
  /** User who created this account (admin/manager). */
  createdBy?: Types.ObjectId;
  /** Manager or admin this user reports to (team hierarchy). */
  parentUserId?: Types.ObjectId;
}
