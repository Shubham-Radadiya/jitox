import mongoose, { Document, Schema } from "mongoose";
import { IUser } from "../types/user.type";

const userSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["Admin", "Manager", "User"],
      default: "User",
    },
    permissions: { type: [String], default: [] },
    phone: { type: String, trim: true },
    name: { type: String, trim: true },
    firstName: { type: String, trim: true },
    lastName: { type: String, trim: true },
    /** @deprecated Legacy single line; use structured fields. Kept for reads / migration. */
    address: { type: String, trim: true },
    fullAddressBackup: { type: String, trim: true },
    streetAddress: { type: String, trim: true },
    area: { type: String, trim: true },
    country: { type: String, trim: true },
    pincode: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    taluka: { type: String, trim: true },
    district: { type: String, trim: true },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model<IUser>("User", userSchema);

export default User;
