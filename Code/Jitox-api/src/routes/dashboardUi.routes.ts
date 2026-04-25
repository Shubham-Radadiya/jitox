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
  deleteScheme,
  getDocuments,
  postDocumentCategory,
  postDocumentFileUpload,
  postDocumentEntry,
  patchDocumentEntry,
  deleteDocumentEntry,
  getDashboardOverview,
  getReportsPage,
  getTargetIncentive,
  getEmployees,
  getEmployeeTracking,
  getPurchaseFormMeta,
} from "../controllers/dashboardUi.controller";
import { uploadDocumentFile } from "../middleware/multerDocuments.middleware";

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
router.get("/target-incentive", getTargetIncentive);
router.get("/employees", getEmployees);
router.get("/employees/:id/tracking", getEmployeeTracking);

/** Master data for purchase voucher / invoice forms */
router.get("/vouchers/purchase-form-meta", getPurchaseFormMeta);

export default router;
