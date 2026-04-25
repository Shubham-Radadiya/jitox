import mongoose, { Document, Schema } from "mongoose";

export type CustomerActivityUnit = "months" | "days";

export interface ISystemSettings extends Document {
  customerActivityValue: number;
  customerActivityUnit: CustomerActivityUnit;
}

const systemSettingsSchema = new Schema<ISystemSettings>(
  {
    customerActivityValue: {
      type: Number,
      default: 3,
      min: 1,
      max: 3660,
    },
    customerActivityUnit: {
      type: String,
      enum: ["months", "days"],
      default: "months",
    },
  },
  { timestamps: true }
);

const SystemSettings = mongoose.model<ISystemSettings>(
  "SystemSettings",
  systemSettingsSchema
);

export async function getOrCreateSystemSettings(): Promise<ISystemSettings> {
  let doc = await SystemSettings.findOne();
  if (!doc) {
    doc = await SystemSettings.create({});
  }
  return doc;
}

export default SystemSettings;
