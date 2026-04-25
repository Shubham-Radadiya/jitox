import mongoose, { Schema, Types } from "mongoose";

export interface ISalarySlip {
  employeeId: Types.ObjectId;
  yearMonth: string;
  year: number;
  month: number;
  basic: number;
  allowances: { name: string; amount: number }[];
  deductions: { name: string; amount: number }[];
  grossSalary: number;
  totalDeductions: number;
  netSalary: number;
  status: "Generated" | "Pending";
}

const lineSchema = new Schema(
  {
    name: { type: String, required: true },
    amount: { type: Number, required: true },
  },
  { _id: false }
);

const salarySlipSchema = new Schema<ISalarySlip>(
  {
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    yearMonth: { type: String, required: true },
    year: { type: Number, required: true },
    month: { type: Number, required: true, min: 1, max: 12 },
    basic: { type: Number, required: true },
    allowances: { type: [lineSchema], default: [] },
    deductions: { type: [lineSchema], default: [] },
    grossSalary: { type: Number, required: true },
    totalDeductions: { type: Number, required: true },
    netSalary: { type: Number, required: true },
    status: {
      type: String,
      enum: ["Generated", "Pending"],
      default: "Generated",
    },
  },
  { timestamps: true }
);

salarySlipSchema.index(
  { employeeId: 1, yearMonth: 1 },
  { unique: true }
);

const SalarySlip = mongoose.model<ISalarySlip>(
  "SalarySlip",
  salarySlipSchema
);
export default SalarySlip;
