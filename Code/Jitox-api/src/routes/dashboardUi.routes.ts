import { Router } from "express";
import {
  getOrdersSummary,
  getOrders,
  getOrderById,
  postOrderPay,
  getPayables,
  postPayablePayment,
  getStockSummary,
  getStockProducts,
  postStockProduct,
  getStockGroups,
  getSchemes,
  postScheme,
  putScheme,
  deleteScheme,
  getDocuments,
  postDocumentCategory,
  postDocumentFileUpload,
  postDocumentEntry,
  patchDocumentEntry,
  deleteDocumentEntry,
  getDashboardOverview,
  getReportsPage,
  getEmployees,
  getEmployeeTracking,
  getFleetTracking,
  getPurchaseFormMeta,
} from "../controllers/dashboardUi.controller";
import {
  deleteTargetIncentiveAssignment,
  getTargetIncentiveAssignMeta,
  getTargetIncentiveAssignmentById,
  listTargetIncentiveAssignments,
  saveTargetIncentiveAssignment,
  updateTargetIncentiveAssignment,
} from "../controllers/targetIncentive.controller";
import {
  getTargetIncentivePayload,
  listTargetAchievementPlans,
  saveTargetAchievementPlans,
} from "../controllers/targetAchievement.controller";
import { uploadDocumentFile } from "../middleware/multerDocuments.middleware";
import { dashboardAuthenticate } from "../utils/authRoles.utils";

const router = Router();

router.get("/orders/summary", getOrdersSummary);
router.get("/orders", getOrders);
router.get("/orders/:id", getOrderById);
router.post("/orders/:id/pay", postOrderPay);

router.get("/payables", getPayables);
router.post("/payables/payments", postPayablePayment);

router.get("/stock/summary", getStockSummary);
router.get("/stock/products", getStockProducts);
router.post("/stock/products", postStockProduct);
router.get("/stock/groups", getStockGroups);

router.get("/schemes", getSchemes);
router.post("/schemes", postScheme);
router.put("/schemes/:id", putScheme);
router.delete("/schemes/:id", deleteScheme);

router.get("/documents", getDocuments);
router.post("/documents/categories", postDocumentCategory);
router.post(
  "/documents/files",
  (req, res, next) => {
    uploadDocumentFile.single("file")(req, res, (err: unknown) => {
      if (err) {
        const msg =
          err instanceof Error ? err.message : "Upload failed";
        return res.status(400).json({ message: msg });
      }
      next();
    });
  },
  postDocumentFileUpload
);
router.post("/documents/entries", postDocumentEntry);
router.patch("/documents/entries/:id", patchDocumentEntry);
router.delete("/documents/entries/:id", deleteDocumentEntry);

router.get("/overview", getDashboardOverview);
router.get("/reports", getReportsPage);
router.get("/target-incentive", getTargetIncentivePayload);
router.get("/target-incentive/plans", listTargetAchievementPlans);
router.post("/target-incentive/plans", saveTargetAchievementPlans);
router.get("/target-incentive/assign-meta", getTargetIncentiveAssignMeta);
router.get("/target-incentive/assignments", listTargetIncentiveAssignments);
router.get("/target-incentive/assignments/:id", getTargetIncentiveAssignmentById);
router.post("/target-incentive/assign", saveTargetIncentiveAssignment);
router.put("/target-incentive/assign/:id", updateTargetIncentiveAssignment);
router.delete("/target-incentive/assign/:id", deleteTargetIncentiveAssignment);
router.get("/employees", ...dashboardAuthenticate, getEmployees);
router.get("/tracking/fleet", ...dashboardAuthenticate, getFleetTracking);
router.get("/employees/:id/tracking", ...dashboardAuthenticate, getEmployeeTracking);

/** Master data for purchase voucher / invoice forms */
router.get("/vouchers/purchase-form-meta", getPurchaseFormMeta);

export default router;
