import { MENU_ITEMS } from "./accessModules";

/**
 * Resolves the main header title for the current dashboard path (JETOX design).
 */
export function getDashboardPageTitle(pathname) {
  const path = (pathname || "").replace(/\/$/, "") || "/";

  if (path === "/dashboard" || path === "/dashboard/") {
    return { title: "Dashboard", subtitle: null };
  }

  if (path.startsWith("/dashboard/accounting-voucher")) {
    return { title: "Account Voucher", subtitle: null };
  }

  if (path.startsWith("/dashboard/order-list/invoice")) {
    return { title: "Invoice Generate", subtitle: null };
  }
  if (path.startsWith("/dashboard/order-list")) {
    return { title: "All Orders", subtitle: null };
  }
  if (path.startsWith("/dashboard/payable")) {
    return { title: "Payables", subtitle: null };
  }
  if (path.startsWith("/dashboard/stock")) {
    return { title: "Stock Monitoring", subtitle: null };
  }
  if (path.startsWith("/dashboard/user-master")) {
    return { title: "User Management", subtitle: null };
  }
  if (path.startsWith("/dashboard/scheme-master")) {
    return { title: "Schema", subtitle: null };
  }
  if (path.startsWith("/dashboard/documents")) {
    return { title: "Documents", subtitle: null };
  }
  if (path.startsWith("/dashboard/reports")) {
    return { title: "Reports", subtitle: null };
  }
  if (path.startsWith("/dashboard/target-incentive")) {
    return { title: "Target vs Achievement", subtitle: null };
  }
  if (path.startsWith("/dashboard/hrm")) {
    return { title: "HRM", subtitle: null };
  }
  if (path.startsWith("/dashboard/tasks/all")) {
    return { title: "All Tasks", subtitle: null };
  }
  if (path.startsWith("/dashboard/tasks/my")) {
    return { title: "My Tasks", subtitle: null };
  }
  if (path.startsWith("/dashboard/tasks/analytics")) {
    return { title: "Task Analytics", subtitle: null };
  }
  if (path.startsWith("/dashboard/tasks/notifications")) {
    return { title: "Notifications", subtitle: null };
  }
  if (path.startsWith("/dashboard/notifications")) {
    return { title: "Notifications", subtitle: null };
  }

  const match = MENU_ITEMS.find((item) => {
    const p = item.path.replace(/\/$/, "");
    if (p === "/dashboard") return false;
    return path === p || path.startsWith(`${p}/`);
  });

  if (match) {
    return { title: match.name, subtitle: null };
  }

  return { title: "JETOX", subtitle: null };
}
