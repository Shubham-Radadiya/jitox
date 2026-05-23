import mongoose, { Schema } from "mongoose";

export type TargetIncentiveApplicableTo = "all" | "managers" | "region";

export interface ITargetIncentiveRow {
  productId?: string;
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
  fromDate?: string;
  toDate?: string;
  applicableTo?: TargetIncentiveApplicableTo;
  applicableUserIds?: string[];
  region?: string;
  rows: ITargetIncentiveRow[];
  createdByUserId?: string;
}

const rowSchema = new Schema<ITargetIncentiveRow>(
  {
    productId: { type: String, trim: true, default: "" },
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
    label: { type: String, trim: true, default: "Assignment" },
    fromDate: { type: String, trim: true, default: "" },
    toDate: { type: String, trim: true, default: "" },
    applicableTo: {
      type: String,
      enum: ["all", "managers", "region"],
      default: "all",
    },
    applicableUserIds: { type: [String], default: [] },
    region: { type: String, trim: true, default: "" },
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
