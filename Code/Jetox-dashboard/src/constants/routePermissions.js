import { NAV_ENTRIES } from "./accessModules";

/** Longest prefix first — first match wins. */
const PATH_MODULE_RULES = [
  { prefix: "/dashboard/user-master", module: "users" },
  { prefix: "/dashboard/territories", module: "territories" },
  { prefix: "/dashboard/target-incentive", module: "target-incentive" },
  { prefix: "/dashboard/accounting-voucher", module: "vouchers" },
  { prefix: "/dashboard/employee-tracking", module: "employees" },
  { prefix: "/dashboard/order-list", module: "orders" },
  { prefix: "/dashboard/scheme-master", module: "schemes" },
  { prefix: "/dashboard/documents", module: "documents" },
  { prefix: "/dashboard/receivable", module: "receivable" },
  { prefix: "/dashboard/payable", module: "payable" },
  { prefix: "/dashboard/reports", module: "reports" },
  { prefix: "/dashboard/account", module: "accounts" },
  { prefix: "/dashboard/product", module: "products" },
  { prefix: "/dashboard/daybook", module: "daybook" },
  { prefix: "/dashboard/stock", module: "stock" },
  { prefix: "/dashboard/tasks", module: "tasks" },
  { prefix: "/dashboard/hrm", module: "hrm" },
].sort((a, b) => b.prefix.length - a.prefix.length);

export function getModuleForPath(pathname = "") {
  const path =
    pathname.endsWith("/") && pathname.length > 1
      ? pathname.slice(0, -1)
      : pathname;
  if (path === "/dashboard" || path === "") return "dashboard";
  for (const { prefix, module } of PATH_MODULE_RULES) {
    if (path.startsWith(prefix)) return module;
  }
  return "dashboard";
}

/** First sidebar route the signed-in user may open. */
export function getFirstAllowedDashboardPath(user) {
  if (!user?.permissions?.length) {
    return "/dashboard";
  }
  const perms = user.permissions;
  for (const entry of NAV_ENTRIES) {
    if (entry.permissionKey && perms.includes(entry.permissionKey)) {
      return entry.path;
    }
  }
  return "/dashboard";
}
