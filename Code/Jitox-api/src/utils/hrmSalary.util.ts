import { ISalaryStructure } from "../types/employee.type";

export function computeSalaryTotals(structure: ISalaryStructure): {
  basic: number;
  allowances: { name: string; amount: number }[];
  deductions: { name: string; amount: number }[];
  grossSalary: number;
  totalDeductions: number;
  netSalary: number;
} {
  const basic = Math.max(0, Number(structure.basic) || 0);
  const allowances = (structure.allowances || []).map((a) => ({
    name: String(a.name || "Allowance"),
    amount: Math.max(0, Number(a.amount) || 0),
  }));
  const deductions = (structure.deductions || []).map((d) => ({
    name: String(d.name || "Deduction"),
    amount: Math.max(0, Number(d.amount) || 0),
  }));
  const allowanceSum = allowances.reduce((s, x) => s + x.amount, 0);
  const deductionSum = deductions.reduce((s, x) => s + x.amount, 0);
  const grossSalary = basic + allowanceSum;
  const netSalary = Math.max(0, grossSalary - deductionSum);
  return {
    basic,
    allowances,
    deductions,
    grossSalary,
    totalDeductions: deductionSum,
    netSalary,
  };
}

export function yearMonthKey(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, "0")}`;
}
