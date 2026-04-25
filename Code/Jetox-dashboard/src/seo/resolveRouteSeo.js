import { matchPath } from "react-router-dom";
import { SEO_ROUTE_ENTRIES, DEFAULT_SEO, ROOT_SEO } from "./routeSeoConfig";

/**
 * @param {string} pathname
 * @returns {{ title: string, description: string, keywords: string, robots: string, h1: string }}
 */
export function resolveRouteSeo(pathname) {
  const path = pathname || "/";
  if (path === "/") {
    return { ...ROOT_SEO };
  }
  for (const entry of SEO_ROUTE_ENTRIES) {
    const m = matchPath({ path: entry.pattern, end: false }, path);
    if (m) {
      return {
        title: entry.title,
        description: entry.description,
        keywords: entry.keywords,
        robots: entry.robots,
        h1: entry.h1,
      };
    }
  }
  return { ...DEFAULT_SEO };
}

/**
 * Breadcrumb JSON-LD items for common path segments.
 */
export function buildBreadcrumbJsonLd(pathname, siteUrl) {
  const base = siteUrl.replace(/\/$/, "");
  const parts = pathname.split("/").filter(Boolean);
  const items = [{ name: "Home", path: "/" }];

  let acc = "";
  const labels = {
    login: "Sign in",
    register: "Register",
    dashboard: "Dashboard",
    account: "Accounts",
    ledger: "Ledger",
    product: "Products",
    "order-list": "Orders",
    invoice: "Invoice",
    "user-master": "Users",
    summary: "Summary",
    "accounting-voucher": "Vouchers",
    "employee-tracking": "Employee tracking",
    daybook: "Day book",
    receivable: "Receivables",
    payable: "Payables",
    stock: "Stock",
    "scheme-master": "Schemes",
    documents: "Documents",
    reports: "Reports",
    hrm: "HRM",
    "forgot-password": "Forgot password",
    "reset-password": "Reset password",
    "verify-code": "Verify",
    "message-box": "Messages",
  };

  for (let i = 0; i < parts.length; i++) {
    acc += `/${parts[i]}`;
    const slug = parts[i];
    const name =
      labels[slug] ||
      (slug.length > 20 ? "Page" : slug.replace(/-/g, " "));
    items.push({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      path: acc,
    });
  }

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${base}${item.path === "/" ? "/" : item.path}`,
    })),
  };
}
