import mongoose, { Schema } from "mongoose";

export interface ITargetAchievementPlan extends mongoose.Document {
  year: number;
  /** 1–12 */
  month: number;
  /** Empty / null = company-wide target */
  managerUserId?: string;
  salesTarget: number;
  collectionPlan: number;
  /** Field-visit / customer-visit count target for the month */
  visitsTarget: number;
  createdByUserId?: string;
}

const targetAchievementPlanSchema = new Schema<ITargetAchievementPlan>(
  {
    year: { type: Number, required: true, min: 2000, max: 2100 },
    month: { type: Number, required: true, min: 1, max: 12 },
    managerUserId: { type: String, trim: true, default: "" },
    salesTarget: { type: Number, default: 0, min: 0 },
    collectionPlan: { type: Number, default: 0, min: 0 },
    visitsTarget: { type: Number, default: 0, min: 0 },
    createdByUserId: { type: String, trim: true },
  },
  { timestamps: true }
);

targetAchievementPlanSchema.index(
  { year: 1, month: 1, managerUserId: 1 },
  { unique: true }
);

const TargetAchievementPlan = mongoose.model<ITargetAchievementPlan>(
  "TargetAchievementPlan",
  targetAchievementPlanSchema
);

export default TargetAchievementPlan;
