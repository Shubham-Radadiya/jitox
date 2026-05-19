import mongoose, { Schema } from "mongoose";

export interface ITargetIncentiveRow {
  group?: string;
  category?: string;
  product: string;
  unit?: string;
  qty?: string;
  selling?: string;
  incentive?: string;
}

export interface ITargetIncentiveAssignment extends mongoose.Document {
  label?: string;
  rows: ITargetIncentiveRow[];
  createdByUserId?: string;
}

const rowSchema = new Schema<ITargetIncentiveRow>(
  {
    group: { type: String, trim: true, default: "" },
    category: { type: String, trim: true, default: "" },
    product: { type: String, required: true, trim: true },
    unit: { type: String, trim: true, default: "" },
    qty: { type: String, trim: true, default: "" },
    selling: { type: String, trim: true, default: "" },
    incentive: { type: String, trim: true, default: "" },
  },
  { _id: false }
);

const targetIncentiveAssignmentSchema = new Schema<ITargetIncentiveAssignment>(
  {
    label: { type: String, trim: true, default: "Default" },
    rows: { type: [rowSchema], default: [] },
    createdByUserId: { type: String, trim: true },
  },
  { timestamps: true }
);

const TargetIncentiveAssignment = mongoose.model<ITargetIncentiveAssignment>(
  "TargetIncentiveAssignment",
  targetIncentiveAssignmentSchema
);

export default TargetIncentiveAssignment;
