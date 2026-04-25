import { Types } from "mongoose";

export type EmployeeStatus = "Active" | "Inactive";

export interface ISalaryLine {
  name: string;
  amount: number;
}

export interface ISalaryStructure {
  basic: number;
  allowances: ISalaryLine[];
  deductions: ISalaryLine[];
}

export interface IEmployee {
  name: string;
  email: string;
  phone?: string;
  roleDesignation: string;
  department: string;
  joiningDate: Date;
  salaryStructure: ISalaryStructure;
  status: EmployeeStatus;
  linkedUserId?: Types.ObjectId;
  permissions?: string[];
  createdAt?: Date;
  updatedAt?: Date;
}
