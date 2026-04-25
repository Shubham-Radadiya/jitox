/**
 * Centralized API layer for Jitox-api (Express + MongoDB).
 *
 * Base URL: import.meta.env.VITE_API_BASE_URL (default http://localhost:4000)
 *
 * Main route groups (see Jitox-api/src/routes/index.ts):
 * - /users          — auth, user CRUD (admin)
 * - /dashboard-ui   — dashboard, orders UI, stock UI, schemes, documents, employees
 * - /products       — product master
 * - /accounts       — account master (multipart create)
 * - /customers      — customer billing activity summary & admin timeframe
 * - /dayBooks       — day book
 * - /tasks          — tasks
 * - /api            — HRM (employees, salary slips, letters) — requires Bearer token
 * - /receiptVouchers — receivable list
 * - /paymentVouchers, /purchaseVouchers, … — vouchers
 */
import http from "./axios.config.jsx";

const DU = "/dashboard-ui";
const API = "/api";

export const authApi = {
  login: (body) => http.post("/users/login", body),
  register: (body) => http.post("/users/register", body),
  forgotPassword: (body) => http.post("/users/send-otp", body),
  verifyCode: (body) => http.post("/users/verify-otp", body),
  resetPassword: (body) => http.post("/users/change-password", body),
};

export const usersApi = {
  getAll: () => http.get("/users/"),
  getById: (id) => http.get(`/users/get-user/${encodeURIComponent(id)}`),
  create: (body) => http.post("/users/create-user", body),
  update: (id, body) =>
    http.put(`/users/update-user/${encodeURIComponent(id)}`, body),
  delete: (id) =>
    http.delete(`/users/delete-user/${encodeURIComponent(id)}`),
};

export const productsApi = {
  getAll: () => http.get("/products/"),
  getById: (id) => http.get(`/products/${encodeURIComponent(id)}`),
  create: (body) => http.post("/products/create-product", body),
  update: (id, body) =>
    http.put(`/products/update-product/${encodeURIComponent(id)}`, body),
  delete: (id) =>
    http.delete(`/products/delete-product/${encodeURIComponent(id)}`),
};

export const accountsApi = {
  getAll: (params) => http.get("/accounts/", { params }),
  getById: (id) => http.get(`/accounts/${encodeURIComponent(id)}`),
  /** multipart/form-data — pass FormData */
  create: (formData) =>
    http.post("/accounts/create-account", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  update: (id, body) =>
    http.put(`/accounts/update-account/${encodeURIComponent(id)}`, body),
  delete: (id) =>
    http.delete(`/accounts/delete-account/${encodeURIComponent(id)}`),
};

export const hrmApi = {
  getDashboard: () => http.get(`${API}/hrm/dashboard`),
  listEmployees: (params) => http.get(`${API}/employees`, { params }),
  getEmployee: (id) => http.get(`${API}/employees/${encodeURIComponent(id)}`),
  createEmployee: (body) => http.post(`${API}/employees`, body),
  updateEmployee: (id, body) =>
    http.put(`${API}/employees/${encodeURIComponent(id)}`, body),
  deleteEmployee: (id) =>
    http.delete(`${API}/employees/${encodeURIComponent(id)}`),
  linkUsers: () => http.get(`${API}/employees/link-users`),
  generateSalary: (body) => http.post(`${API}/salary/generate`, body),
  listSalarySlips: (params) => http.get(`${API}/salary`, { params }),
  getSalarySlip: (id) =>
    http.get(`${API}/salary/slip/${encodeURIComponent(id)}`),
  generateOfferLetter: (body) =>
    http.post(`${API}/offer-letter/generate`, body),
  listOfferLetters: () => http.get(`${API}/offer-letter`),
  generateAppointmentLetter: (body) =>
    http.post(`${API}/appointment-letter/generate`, body),
  listAppointmentLetters: () => http.get(`${API}/appointment-letter`),
};

export const customersApi = {
  getStatusSummary: () => http.get("/customers/status-summary"),
  getActivitySettings: () =>
    http.get("/customers/settings/customer-activity"),
  patchActivitySettings: (body) =>
    http.patch("/customers/settings/customer-activity", body),
};

export const dayBooksApi = {
  getAll: (params) => http.get("/dayBooks/", { params }),
  getById: (id) => http.get(`/dayBooks/${encodeURIComponent(id)}`),
  create: (body) => http.post("/dayBooks/create", body),
};

export const tasksApi = {
  getAll: (params) => http.get("/tasks/", { params }),
  getAnalytics: () => http.get("/tasks/analytics"),
  getById: (id) => http.get(`/tasks/${encodeURIComponent(id)}`),
  create: (body) => http.post("/tasks/create-task", body),
  update: (id, body) =>
    http.put(`/tasks/update-task/${encodeURIComponent(id)}`, body),
  delete: (id) =>
    http.delete(`/tasks/delete-task/${encodeURIComponent(id)}`),
};

export const notificationsApi = {
  list: (params) => http.get("/notifications/", { params }),
  unreadCount: () => http.get("/notifications/unread-count"),
  markRead: (id) =>
    http.patch(`/notifications/${encodeURIComponent(id)}/read`),
  markAllRead: () => http.patch("/notifications/read-all"),
};

export const receiptVouchersApi = {
  getAll: (params) => http.get("/receiptVouchers/", { params }),
  getById: (id) =>
    http.get(`/receiptVouchers/get-receipt-by-id/${encodeURIComponent(id)}`),
  create: (body) => http.post("/receiptVouchers/create", body),
};

export const purchaseVouchersApi = {
  getAll: (params) => http.get("/purchaseVouchers/", { params }),
  getById: (id) => http.get(`/purchaseVouchers/${encodeURIComponent(id)}`),
  create: (body) =>
    http.post("/purchaseVouchers/create-purchase-voucher", body),
  update: (id, body) =>
    http.put(
      `/purchaseVouchers/update-purchase-voucher/${encodeURIComponent(id)}`,
      body
    ),
  delete: (id) =>
    http.delete(
      `/purchaseVouchers/delete-purchase-voucher/${encodeURIComponent(id)}`
    ),
};

export const purchaseReturnVouchersApi = {
  getAll: (params) => http.get("/purchaseReturnVouchers/", { params }),
  getById: (id) =>
    http.get(`/purchaseReturnVouchers/${encodeURIComponent(id)}`),
  create: (body) =>
    http.post("/purchaseReturnVouchers/create-purchase-return-voucher", body),
  update: (id, body) =>
    http.put(
      `/purchaseReturnVouchers/update-purchase-return-voucher/${encodeURIComponent(id)}`,
      body
    ),
  delete: (id) =>
    http.delete(
      `/purchaseReturnVouchers/delete-purchase-return-voucher/${encodeURIComponent(id)}`
    ),
};

export const paymentVouchersApi = {
  getAll: (params) => http.get("/paymentVouchers/", { params }),
  getTotal: () => http.get("/paymentVouchers/get-total"),
  create: (body) => http.post("/paymentVouchers/create", body),
};

export const expenseVouchersApi = {
  getAll: (params) => http.get("/expenseVouchers/", { params }),
  getById: (id) => http.get(`/expenseVouchers/${encodeURIComponent(id)}`),
  create: (formData) =>
    http.post("/expenseVouchers/create", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
};

export const cashVouchersApi = {
  getAll: (params) => http.get("/cashVouchers/", { params }),
  getById: (id) => http.get(`/cashVouchers/${encodeURIComponent(id)}`),
  create: (formData) =>
    http.post("/cashVouchers/create", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
};

export const journalVouchersApi = {
  getAll: (params) => http.get("/journalVouchers/", { params }),
  getById: (id) => http.get(`/journalVouchers/${encodeURIComponent(id)}`),
  create: (body) => http.post("/journalVouchers/create", body),
  update: (id, body) =>
    http.put(`/journalVouchers/update/${encodeURIComponent(id)}`, body),
  delete: (id) =>
    http.delete(`/journalVouchers/delete/${encodeURIComponent(id)}`),
};

export const quotationsApi = {
  getAll: (params) => http.get("/quotations/", { params }),
  getById: (id) => http.get(`/quotations/${encodeURIComponent(id)}`),
  create: (body) => http.post("/quotations/create-quotation", body),
  update: (id, body) =>
    http.put(`/quotations/update-quotation/${encodeURIComponent(id)}`, body),
  delete: (id) =>
    http.delete(`/quotations/delete-quotation/${encodeURIComponent(id)}`),
};

/** Dashboard & UI aggregates (same paths as dashboardUi.service.jsx) */
export const dashboardUiApi = {
  getOrdersSummary: () => http.get(`${DU}/orders/summary`),
  getOrders: (params) => http.get(`${DU}/orders`, { params }),
  getOrder: (id) =>
    http.get(`${DU}/orders/${encodeURIComponent(id)}`),
  payOrder: (id) =>
    http.post(`${DU}/orders/${encodeURIComponent(id)}/pay`),

  getPayables: (params) => http.get(`${DU}/payables`, { params }),
  postPayablePayment: (body) =>
    http.post(`${DU}/payables/payments`, body),

  getStockSummary: () => http.get(`${DU}/stock/summary`),
  getStockProducts: (params) =>
    http.get(`${DU}/stock/products`, { params }),
  postStockProduct: (body) =>
    http.post(`${DU}/stock/products`, body),
  getStockGroups: () => http.get(`${DU}/stock/groups`),

  getSchemes: (params) => http.get(`${DU}/schemes`, { params }),
  createScheme: (body) => http.post(`${DU}/schemes`, body),
  deleteScheme: (id) =>
    http.delete(`${DU}/schemes/${encodeURIComponent(id)}`),

  getDocuments: (params) => http.get(`${DU}/documents`, { params }),
  postDocumentCategory: (body) =>
    http.post(`${DU}/documents/categories`, body),
  uploadDocumentFile: (formData) =>
    http.post(`${DU}/documents/files`, formData),
  postDocumentEntry: (body) => http.post(`${DU}/documents/entries`, body),
  patchDocumentEntry: (id, body) =>
    http.patch(`${DU}/documents/entries/${encodeURIComponent(id)}`, body),
  deleteDocumentEntry: (id) =>
    http.delete(`${DU}/documents/entries/${encodeURIComponent(id)}`),

  getOverview: () => http.get(`${DU}/overview`),
  getTargetIncentive: () => http.get(`${DU}/target-incentive`),
  getReports: (params) => http.get(`${DU}/reports`, { params }),
  getEmployees: () => http.get(`${DU}/employees`),
  getEmployeeTracking: (id, params) =>
    http.get(`${DU}/employees/${encodeURIComponent(id)}/tracking`, {
      params,
    }),

  /** Parties, products, GST, etc. for purchase voucher forms */
  getPurchaseFormMeta: () => http.get(`${DU}/vouchers/purchase-form-meta`),
};

export { default as http } from "./axios.config.jsx";
