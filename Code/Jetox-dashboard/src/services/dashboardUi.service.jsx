import { dashboardUiApi } from "./api";

/** @deprecated Prefer importing `dashboardUiApi` from `./api` in new code. */
export const dashboardUiService = {
  getOrdersSummary: () => dashboardUiApi.getOrdersSummary(),
  getOrders: (params) => dashboardUiApi.getOrders(params),
  getOrder: (id) => dashboardUiApi.getOrder(id),
  payOrder: (id) => dashboardUiApi.payOrder(id),

  getPayables: (params) => dashboardUiApi.getPayables(params),
  postPayablePayment: (body) => dashboardUiApi.postPayablePayment(body),

  getStockSummary: () => dashboardUiApi.getStockSummary(),
  getStockProducts: (params) => dashboardUiApi.getStockProducts(params),
  postStockProduct: (body) => dashboardUiApi.postStockProduct(body),
  getStockGroups: () => dashboardUiApi.getStockGroups(),

  getSchemes: (params) => dashboardUiApi.getSchemes(params),
  createScheme: (body) => dashboardUiApi.createScheme(body),
  updateScheme: (id, body) => dashboardUiApi.updateScheme(id, body),
  deleteScheme: (id) => dashboardUiApi.deleteScheme(id),

  getDocuments: (params) => dashboardUiApi.getDocuments(params),
  postDocumentCategory: (body) => dashboardUiApi.postDocumentCategory(body),
  uploadDocumentFile: (formData) => dashboardUiApi.uploadDocumentFile(formData),
  postDocumentEntry: (body) => dashboardUiApi.postDocumentEntry(body),
  patchDocumentEntry: (id, body) => dashboardUiApi.patchDocumentEntry(id, body),
  deleteDocumentEntry: (id) => dashboardUiApi.deleteDocumentEntry(id),

  getOverview: (params) => dashboardUiApi.getOverview(params),
  getTargetIncentive: () => dashboardUiApi.getTargetIncentive(),
  getReports: (params) => dashboardUiApi.getReports(params),
  getEmployees: () => dashboardUiApi.getEmployees(),
  getEmployeeTracking: (id, params) =>
    dashboardUiApi.getEmployeeTracking(id, params),

  getPurchaseFormMeta: () => dashboardUiApi.getPurchaseFormMeta(),
};
