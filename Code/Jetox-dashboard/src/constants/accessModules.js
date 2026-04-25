/** Must match Jitox-api `ALL_MODULE_PERMISSIONS` keys (order = sidebar order). */
export const MODULE_ACCESS_OPTIONS = [
  { key: "dashboard", label: "Dashboard" },
  { key: "accounts", label: "Account Master" },
  { key: "products", label: "Product Master" },
  { key: "vouchers", label: "Accounting Voucher" },
  { key: "daybook", label: "Day Book" },
  { key: "orders", label: "Order List & Dispatch" },
  { key: "employees", label: "Employee Tracking" },
  { key: "hrm", label: "HRM" },
  { key: "receivable", label: "Receivable" },
  { key: "payable", label: "Payable" },
  { key: "stock", label: "Stock" },
  { key: "users", label: "User Master" },
  { key: "schemes", label: "Scheme" },
  { key: "documents", label: "Documents" },
  { key: "target-incentive", label: "Target & Incentive" },
  { key: "reports", label: "Reports" },
  { key: "tasks", label: "Tasks" },
];

/** Flat links (non-group) for legacy lookups. */
export const MENU_ITEMS = [
  { name: "Dashboard", permissionKey: "dashboard", path: "/dashboard/" },
  { name: "Account Master", permissionKey: "accounts", path: "/dashboard/account" },
  { name: "Product Master", permissionKey: "products", path: "/dashboard/product" },
  {
    name: "Accounting Voucher",
    permissionKey: "vouchers",
    path: "/dashboard/accounting-voucher/purchase",
  },
  { name: "Day Book", permissionKey: "daybook", path: "/dashboard/daybook" },
  { name: "Order List & Dispatch", permissionKey: "orders", path: "/dashboard/order-list" },
  {
    name: "Employee Tracking",
    permissionKey: "employees",
    path: "/dashboard/employee-tracking",
  },
  { name: "HRM", permissionKey: "hrm", path: "/dashboard/hrm" },
  { name: "Receivable", permissionKey: "receivable", path: "/dashboard/receivable" },
  { name: "Payable", permissionKey: "payable", path: "/dashboard/payable" },
  { name: "Stock", permissionKey: "stock", path: "/dashboard/stock" },
  { name: "User Master", permissionKey: "users", path: "/dashboard/user-master" },
  { name: "Scheme", permissionKey: "schemes", path: "/dashboard/scheme-master" },
  { name: "Documents", permissionKey: "documents", path: "/dashboard/documents" },
  {
    name: "Target & Incentive",
    permissionKey: "target-incentive",
    path: "/dashboard/target-incentive",
  },
  { name: "Reports", permissionKey: "reports", path: "/dashboard/reports" },
  { name: "Tasks", permissionKey: "tasks", path: "/dashboard/tasks" },
];

/** Sidebar: single links; task sub-sections use in-page tabs under `/dashboard/tasks`. */
export const NAV_ENTRIES = [
  { kind: "link", name: "Dashboard", permissionKey: "dashboard", path: "/dashboard/" },
  { name: "Account Master", permissionKey: "accounts", path: "/dashboard/account", kind: "link" },
  { name: "Product Master", permissionKey: "products", path: "/dashboard/product", kind: "link" },
  {
    kind: "link",
    name: "Accounting Voucher",
    permissionKey: "vouchers",
    path: "/dashboard/accounting-voucher/purchase",
  },
  { kind: "link", name: "Day Book", permissionKey: "daybook", path: "/dashboard/daybook" },
  {
    kind: "link",
    name: "Order List & Dispatch",
    permissionKey: "orders",
    path: "/dashboard/order-list",
  },
  {
    kind: "link",
    name: "Employee Tracking",
    permissionKey: "employees",
    path: "/dashboard/employee-tracking",
  },
  { kind: "link", name: "HRM", permissionKey: "hrm", path: "/dashboard/hrm" },
  { kind: "link", name: "Receivable", permissionKey: "receivable", path: "/dashboard/receivable" },
  { kind: "link", name: "Payable", permissionKey: "payable", path: "/dashboard/payable" },
  { kind: "link", name: "Stock", permissionKey: "stock", path: "/dashboard/stock" },
  { kind: "link", name: "User Master", permissionKey: "users", path: "/dashboard/user-master" },
  { kind: "link", name: "Scheme", permissionKey: "schemes", path: "/dashboard/scheme-master" },
  { kind: "link", name: "Documents", permissionKey: "documents", path: "/dashboard/documents" },
  {
    kind: "link",
    name: "Target & Incentive",
    permissionKey: "target-incentive",
    path: "/dashboard/target-incentive",
  },
  { kind: "link", name: "Reports", permissionKey: "reports", path: "/dashboard/reports" },
  { kind: "link", name: "Tasks", permissionKey: "tasks", path: "/dashboard/tasks" },
];
