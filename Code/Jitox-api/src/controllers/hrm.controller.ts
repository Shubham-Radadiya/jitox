import { Request, Response } from "express";
import mongoose from "mongoose";
import Employee from "../models/employee.model";
import SalarySlip from "../models/salarySlip.model";
import OfferLetter from "../models/offerLetter.model";
import AppointmentLetter from "../models/appointmentLetter.model";
import { User } from "../models/index";
import { sendSuccess, sendCreated } from "../utils/apiResponse";
import { AppError } from "../common/errors/AppError";
import { HttpStatusCode } from "../common/errors/httpStatusCode";
import { computeSalaryTotals, yearMonthKey } from "../utils/hrmSalary.util";
import {
  buildAppointmentLetterHtml,
  buildOfferLetterHtml,
  buildSalarySlipHtml,
  writeHrmHtmlFile,
} from "../utils/hrmDocument.util";
import { ISalaryStructure } from "../types/employee.type";

function parseYearMonth(
  monthParam: string | undefined,
  yearParam: string | undefined
): { year: number; month: number; yearMonth: string } {
  const now = new Date();
  let year = yearParam ? parseInt(yearParam, 10) : now.getFullYear();
  let month = monthParam ? parseInt(monthParam, 10) : now.getMonth() + 1;
  if (monthParam && monthParam.includes("-")) {
    const [y, m] = monthParam.split("-");
    year = parseInt(y, 10);
    month = parseInt(m, 10);
  }
  if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) {
    throw new AppError(
      HttpStatusCode.BAD_REQUEST,
      "Invalid month/year. Use month=YYYY-MM or month=1-12&year=YYYY"
    );
  }
  return { year, month, yearMonth: yearMonthKey(year, month) };
}

export const getHrmDashboard = async (
  _req: Request,
  res: Response
): Promise<void> => {
  const [totalEmployees, activeEmployees, inactiveEmployees] = await Promise.all([
    Employee.countDocuments(),
    Employee.countDocuments({ status: "Active" }),
    Employee.countDocuments({ status: "Inactive" }),
  ]);
  const { year, month, yearMonth } = parseYearMonth(undefined, undefined);
  const activeCount = await Employee.countDocuments({ status: "Active" });
  const generatedCount = await SalarySlip.countDocuments({ yearMonth });
  const pendingCount = Math.max(0, activeCount - generatedCount);
  sendSuccess(res, {
    totalEmployees,
    activeEmployees,
    inactiveEmployees,
    payroll: {
      yearMonth,
      year,
      month,
      generatedCount,
      pendingCount,
      status: pendingCount === 0 && activeCount > 0 ? "Generated" : "Pending",
    },
  });
};

export const listEmployees = async (req: Request, res: Response): Promise<void> => {
  const q = String(req.query.search || "").trim();
  const status = String(req.query.status || "").trim();
  const department = String(req.query.department || "").trim();
  const filter: Record<string, unknown> = {};
  if (status === "Active" || status === "Inactive") filter.status = status;
  if (department) filter.department = new RegExp(department, "i");
  if (q) {
    filter.$or = [
      { name: new RegExp(q, "i") },
      { email: new RegExp(q, "i") },
      { roleDesignation: new RegExp(q, "i") },
    ];
  }
  const list = await Employee.find(filter).sort({ createdAt: -1 }).lean();
  sendSuccess(res, list);
};

export const getEmployeeById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    throw new AppError(HttpStatusCode.BAD_REQUEST, "Invalid employee id");
  }
  const e = await Employee.findById(id).lean();
  if (!e) throw new AppError(HttpStatusCode.NOT_FOUND, "Employee not found");
  const slips = await SalarySlip.find({ employeeId: id })
    .sort({ yearMonth: -1 })
    .limit(24)
    .lean();
  const letters = await AppointmentLetter.find({ employeeId: id })
    .sort({ createdAt: -1 })
    .limit(10)
    .lean();
  sendSuccess(res, { ...e, salarySlips: slips, appointmentLetters: letters });
};

export const createEmployee = async (req: Request, res: Response): Promise<void> => {
  const body = req.body || {};
  const salaryStructure: ISalaryStructure = {
    basic: Number(body.salaryStructure?.basic ?? 0),
    allowances: Array.isArray(body.salaryStructure?.allowances)
      ? body.salaryStructure.allowances
      : [],
    deductions: Array.isArray(body.salaryStructure?.deductions)
      ? body.salaryStructure.deductions
      : [],
  };
  const doc = await Employee.create({
    name: String(body.name || "").trim(),
    email: String(body.email || "").trim().toLowerCase(),
    phone: body.phone ? String(body.phone).trim() : undefined,
    roleDesignation: String(body.roleDesignation || "").trim(),
    department: String(body.department || "").trim(),
    joiningDate: body.joiningDate ? new Date(body.joiningDate) : new Date(),
    salaryStructure,
    status: body.status === "Inactive" ? "Inactive" : "Active",
    linkedUserId: body.linkedUserId || undefined,
    permissions: Array.isArray(body.permissions) ? body.permissions : [],
  });
  sendCreated(res, doc.toObject(), "Employee created");
};

export const updateEmployee = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    throw new AppError(HttpStatusCode.BAD_REQUEST, "Invalid employee id");
  }
  const body = req.body || {};
  const update: Record<string, unknown> = {};
  if (body.name != null) update.name = String(body.name).trim();
  if (body.email != null) update.email = String(body.email).trim().toLowerCase();
  if (body.phone !== undefined) update.phone = body.phone ? String(body.phone).trim() : "";
  if (body.roleDesignation != null) update.roleDesignation = String(body.roleDesignation).trim();
  if (body.department != null) update.department = String(body.department).trim();
  if (body.joiningDate != null) update.joiningDate = new Date(body.joiningDate);
  if (body.status === "Active" || body.status === "Inactive") update.status = body.status;
  if (body.linkedUserId !== undefined) update.linkedUserId = body.linkedUserId || null;
  if (Array.isArray(body.permissions)) update.permissions = body.permissions;
  if (body.salaryStructure) {
    update.salaryStructure = {
      basic: Number(body.salaryStructure.basic ?? 0),
      allowances: Array.isArray(body.salaryStructure.allowances)
        ? body.salaryStructure.allowances
        : [],
      deductions: Array.isArray(body.salaryStructure.deductions)
        ? body.salaryStructure.deductions
        : [],
    };
  }
  const e = await Employee.findByIdAndUpdate(id, update, {
    new: true,
    runValidators: true,
  }).lean();
  if (!e) throw new AppError(HttpStatusCode.NOT_FOUND, "Employee not found");

  sendSuccess(res, e, "Employee updated");
};

export const deleteEmployee = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    throw new AppError(HttpStatusCode.BAD_REQUEST, "Invalid employee id");
  }
  const e = await Employee.findByIdAndDelete(id);
  if (!e) throw new AppError(HttpStatusCode.NOT_FOUND, "Employee not found");
  await SalarySlip.deleteMany({ employeeId: id });
  sendSuccess(res, { deleted: true }, "Employee deleted");
};

export const generateMonthlySalary = async (
  req: Request,
  res: Response
): Promise<void> => {
  const body = req.body || {};
  const { year, month, yearMonth } = parseYearMonth(
    body.month != null ? String(body.month) : undefined,
    body.year != null ? String(body.year) : undefined
  );
  const employees = await Employee.find({ status: "Active" }).lean();
  let created = 0;
  let skipped = 0;
  for (const emp of employees) {
    const exists = await SalarySlip.findOne({
      employeeId: emp._id,
      yearMonth,
    });
    if (exists) {
      skipped++;
      continue;
    }
    const totals = computeSalaryTotals(emp.salaryStructure as ISalaryStructure);
    await SalarySlip.create({
      employeeId: emp._id,
      yearMonth,
      year,
      month,
      basic: totals.basic,
      allowances: totals.allowances,
      deductions: totals.deductions,
      grossSalary: totals.grossSalary,
      totalDeductions: totals.totalDeductions,
      netSalary: totals.netSalary,
      status: "Generated",
    });
    created++;
  }
  sendSuccess(res, {
    yearMonth,
    year,
    month,
    created,
    skipped,
    totalActive: employees.length,
  });
};

export const listSalarySlips = async (req: Request, res: Response): Promise<void> => {
  const month = req.query.month as string | undefined;
  const year = req.query.year as string | undefined;
  if (!month && !year) {
    const slips = await SalarySlip.find()
      .populate("employeeId", "name email department roleDesignation")
      .sort({ yearMonth: -1, createdAt: -1 })
      .limit(300)
      .lean();
    sendSuccess(res, slips);
    return;
  }
  const { yearMonth } = parseYearMonth(month, year);
  const slips = await SalarySlip.find({ yearMonth })
    .populate("employeeId", "name email department roleDesignation")
    .sort({ createdAt: -1 })
    .lean();
  sendSuccess(res, slips);
};

export const getSalarySlipById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    throw new AppError(HttpStatusCode.BAD_REQUEST, "Invalid slip id");
  }
  const slip = await SalarySlip.findById(id)
    .populate("employeeId", "name email department roleDesignation joiningDate")
    .lean();
  if (!slip) throw new AppError(HttpStatusCode.NOT_FOUND, "Salary slip not found");
  sendSuccess(res, slip);
};

export const generateOfferLetter = async (req: Request, res: Response): Promise<void> => {
  const b = req.body || {};
  const html = buildOfferLetterHtml({
    candidateName: String(b.candidateName || "").trim(),
    position: String(b.position || "").trim(),
    salary: Math.max(0, Number(b.salary) || 0),
    joiningDate: b.joiningDate ? new Date(b.joiningDate) : new Date(),
    companyName: String(b.companyName || "Jitox Agro").trim(),
    companyAddress: b.companyAddress ? String(b.companyAddress).trim() : undefined,
  });
  const documentPath = writeHrmHtmlFile("offer", html);
  const doc = await OfferLetter.create({
    candidateName: String(b.candidateName || "").trim(),
    position: String(b.position || "").trim(),
    salary: Number(b.salary) || 0,
    joiningDate: b.joiningDate ? new Date(b.joiningDate) : new Date(),
    companyName: String(b.companyName || "Jitox Agro").trim(),
    companyAddress: b.companyAddress ? String(b.companyAddress).trim() : undefined,
    documentPath,
    contentHtml: html,
  });
  sendCreated(
    res,
    { ...doc.toObject(), previewUrl: documentPath },
    "Offer letter generated"
  );
};

export const listOfferLetters = async (_req: Request, res: Response): Promise<void> => {
  const list = await OfferLetter.find().sort({ createdAt: -1 }).limit(100).lean();
  sendSuccess(res, list);
};

export const generateAppointmentLetter = async (
  req: Request,
  res: Response
): Promise<void> => {
  const b = req.body || {};
  let employeeName = String(b.employeeName || "").trim();
  let position = String(b.position || "").trim();
  let department = String(b.department || "").trim();
  let joiningDate = b.joiningDate ? new Date(b.joiningDate) : new Date();
  let employeeId: mongoose.Types.ObjectId | undefined;

  if (b.employeeId && mongoose.isValidObjectId(String(b.employeeId))) {
    const emp = await Employee.findById(b.employeeId).lean();
    if (!emp) throw new AppError(HttpStatusCode.NOT_FOUND, "Employee not found");
    employeeId = emp._id as mongoose.Types.ObjectId;
    employeeName = employeeName || emp.name;
    position = position || emp.roleDesignation;
    department = department || emp.department;
    joiningDate = joiningDate.getTime() ? joiningDate : new Date(emp.joiningDate);
  }

  if (!employeeName || !position || !department) {
    throw new AppError(
      HttpStatusCode.BAD_REQUEST,
      "employeeId or employeeName, position, and department are required"
    );
  }

  const html = buildAppointmentLetterHtml({
    employeeName,
    position,
    department,
    joiningDate,
    companyName: String(b.companyName || "Jitox Agro").trim(),
    companyAddress: b.companyAddress ? String(b.companyAddress).trim() : undefined,
  });
  const documentPath = writeHrmHtmlFile("appointment", html);
  const doc = await AppointmentLetter.create({
    employeeId,
    employeeName,
    position,
    department,
    joiningDate,
    companyName: String(b.companyName || "Jitox Agro").trim(),
    companyAddress: b.companyAddress ? String(b.companyAddress).trim() : undefined,
    documentPath,
    contentHtml: html,
  });
  sendCreated(
    res,
    { ...doc.toObject(), previewUrl: documentPath },
    "Appointment letter generated"
  );
};

export const listAppointmentLetters = async (
  _req: Request,
  res: Response
): Promise<void> => {
  const list = await AppointmentLetter.find()
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();
  sendSuccess(res, list);
};

export const listUsersForLink = async (_req: Request, res: Response): Promise<void> => {
  const users = await User.find()
    .select("_id name email role phone")
    .sort({ email: 1 })
    .limit(500)
    .lean();
  sendSuccess(res, users);
};
