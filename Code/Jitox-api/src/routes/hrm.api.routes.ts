import express from "express";
import {
  createEmployee,
  deleteEmployee,
  generateAppointmentLetter,
  generateMonthlySalary,
  generateOfferLetter,
  getEmployeeById,
  getHrmDashboard,
  getSalarySlipById,
  listAppointmentLetters,
  listEmployees,
  listOfferLetters,
  listSalarySlips,
  listUsersForLink,
  updateEmployee,
} from "../controllers/hrm.controller";
import {
  authorizeRoles,
  isAuthenticated,
} from "../middleware/authonticated.middleware";
import { Role } from "../constants/roles";

const router = express.Router();

router.use(isAuthenticated);

router.get("/hrm/dashboard", getHrmDashboard);

router.get("/employees/link-users", listUsersForLink);
router.get("/employees", listEmployees);
router.post(
  "/employees",
  authorizeRoles(Role.admin, Role.manager),
  createEmployee
);
router.get("/employees/:id", getEmployeeById);
router.put(
  "/employees/:id",
  authorizeRoles(Role.admin, Role.manager),
  updateEmployee
);
router.delete(
  "/employees/:id",
  authorizeRoles(Role.admin),
  deleteEmployee
);

router.post(
  "/salary/generate",
  authorizeRoles(Role.admin, Role.manager),
  generateMonthlySalary
);
router.get("/salary", listSalarySlips);
router.get("/salary/slip/:id", getSalarySlipById);

router.post(
  "/offer-letter/generate",
  authorizeRoles(Role.admin, Role.manager),
  generateOfferLetter
);
router.get("/offer-letter", listOfferLetters);

router.post(
  "/appointment-letter/generate",
  authorizeRoles(Role.admin, Role.manager),
  generateAppointmentLetter
);
router.get("/appointment-letter", listAppointmentLetters);

export default router;
