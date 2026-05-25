import mongoose, { Schema, Document } from "mongoose";

export type LocationPingKind = "ping" | "day_start" | "day_end" | "visit";

export interface IFieldLocationPing extends Document {
  userId: mongoose.Types.ObjectId;
  employeeId?: mongoose.Types.ObjectId;
  lat: number;
  lng: number;
  accuracy?: number;
  speed?: number;
  heading?: number;
  address?: string;
  kind: LocationPingKind;
  recordedAt: Date;
}

const fieldLocationPingSchema = new Schema<IFieldLocationPing>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    employeeId: { type: Schema.Types.ObjectId, ref: "Employee" },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    accuracy: { type: Number },
    speed: { type: Number },
    heading: { type: Number },
    address: { type: String, trim: true },
    kind: {
      type: String,
      enum: ["ping", "day_start", "day_end", "visit"],
      default: "ping",
    },
    recordedAt: { type: Date, required: true, index: true },
  },
  { timestamps: true }
);

fieldLocationPingSchema.index({ userId: 1, recordedAt: -1 });
fieldLocationPingSchema.index({ recordedAt: -1 });

const FieldLocationPing = mongoose.model<IFieldLocationPing>(
  "FieldLocationPing",
  fieldLocationPingSchema
);

export default FieldLocationPing;
