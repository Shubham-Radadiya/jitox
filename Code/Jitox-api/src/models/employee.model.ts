import mongoose, { Schema } from "mongoose";
import {
  IEmployee,
  ISalaryLine,
  ISalaryStructure,
} from "../types/employee.type";

const salaryLineSchema = new Schema<ISalaryLine>(
  {
    name: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const salaryStructureSchema = new Schema<ISalaryStructure>(
  {
    basic: { type: Number, required: true, min: 0, default: 0 },
    allowances: { type: [salaryLineSchema], default: [] },
    deductions: { type: [salaryLineSchema], default: [] },
  },
  { _id: false }
);

const employeeSchema = new Schema<IEmployee>(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
    },
    phone: { type: String, trim: true },
    roleDesignation: { type: String, required: true, trim: true },
    department: { type: String, required: true, trim: true },
    joiningDate: { type: Date, required: true },
    salaryStructure: {
      type: salaryStructureSchema,
      required: true,
      default: () => ({ basic: 0, allowances: [], deductions: [] }),
    },
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
    linkedUserId: { type: Schema.Types.ObjectId, ref: "User" },
    permissions: { type: [String], default: [] },
  },
  { timestamps: true }
);

employeeSchema.index({ name: "text", email: "text", department: 1 });

const Employee = mongoose.model<IEmployee>("Employee", employeeSchema);
export default Employee;
