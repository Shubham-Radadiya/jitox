import { SITE_NAME } from "./siteConfig";

/**
 * Ordered list: first `matchPath` win. Patterns use react-router syntax.
 * Dashboard routes use noindex to avoid indexing auth-gated URLs in Google.
 */
export const SEO_ROUTE_ENTRIES = [
  {
    pattern: "/login",
    title: "Sign in — Jitox Agri ERP & Dashboard",
    description:
      "Sign in to Jitox: secure agri-business dashboard for dealers and distributors — orders, stock, accounts, and vouchers.",
    keywords:
      "Jitox login, agri ERP sign in, agriculture dashboard India, dealer portal login",
    robots: "index, follow",
    h1: "Sign in to Jitox",
  },
  {
    pattern: "/register",
    title: "Create account — Jitox Agri Business Software",
    description:
      "Register for Jitox to manage inventory, orders, accounting vouchers, and field teams for your agri distribution business.",
    keywords:
      "Jitox register, agri software signup, agriculture ERP trial, dealer management app",
    robots: "index, follow",
    h1: "Create your Jitox account",
  },
  {
    pattern: "/forgot-password",
    title: "Forgot password — Jitox",
    description:
      "Reset your Jitox account password. Secure recovery for agri ERP and dashboard access.",
    keywords: "Jitox forgot password, reset password agri ERP",
    robots: "index, follow",
    h1: "Reset your password",
  },
  {
    pattern: "/reset-password",
    title: "Set new password — Jitox",
    description:
      "Choose a new password to secure your Jitox agri-business account.",
    keywords: "Jitox password reset, new password",
    robots: "noindex, follow",
    h1: "Set a new password",
  },
  {
    pattern: "/verify-code",
    title: "Verify code — Jitox",
    description: "Verify your email or phone with a one-time code for Jitox.",
    keywords: "Jitox OTP verification",
    robots: "noindex, follow",
    h1: "Verify your code",
  },
  {
    pattern: "/message-box",
    title: "Message — Jitox",
    description: "Account messages and confirmations from Jitox.",
    keywords: "Jitox messages",
    robots: "noindex, follow",
    h1: "Message",
  },
  {
    pattern: "/dashboard/order-list/invoice",
    title: "Invoice generation — Orders | Jitox",
    description:
      "Generate and manage sales invoices from orders in Jitox — GST-ready agri distribution billing.",
    keywords:
      "agri invoice software, order invoice, distributor billing India, Jitox invoice",
    robots: "noindex, follow",
    h1: "Invoice generation",
  },
  {
    pattern: "/dashboard/order-list",
    title: "Orders & dispatch — Jitox Dashboard",
    description:
      "Track agri orders, payment status, dispatch, and returns. Dealer and distributor order management in one view.",
    keywords:
      "agri order management, fertilizer orders, pesticide dispatch, distributor order list, Jitox orders",
    robots: "noindex, follow",
    h1: "Orders",
  },
  {
    pattern: "/dashboard/user-master/summary/:userId/:tab",
    title: "User profile & activity — Jitox",
    description:
      "View team member profile, permissions, and activity summary in Jitox user management.",
    keywords: "Jitox user profile, sales team activity, agri CRM user",
    robots: "noindex, follow",
    h1: "User summary",
  },
  {
    pattern: "/dashboard/user-master",
    title: "User management — Jitox",
    description:
      "Manage users, roles, and access for your agri sales and operations teams.",
    keywords:
      "agri user management, dealer staff accounts, Jitox admin users, field team access",
    robots: "noindex, follow",
    h1: "User management",
  },
  {
    pattern: "/dashboard/account/ledger",
    title: "Account ledger — Jitox Accounting",
    description:
      "Party-wise ledger and balances for dealers, distributors, and retailers linked to your vouchers.",
    keywords:
      "agri accounting ledger, party ledger, distributor outstanding, Jitox ledger",
    robots: "noindex, follow",
    h1: "Account ledger",
  },
  {
    pattern: "/dashboard/account",
    title: "Account master — Parties & balances | Jitox",
    description:
      "Maintain party master data: dealers, distributors, territories, credit limits, and opening balances.",
    keywords:
      "agri party master, dealer account master, distributor credit limit, Jitox accounts",
    robots: "noindex, follow",
    h1: "Account master",
  },
  {
    pattern: "/dashboard/product",
    title: "Product master — Catalog & pricing | Jitox",
    description:
      "Manage agri product catalog, units, GST, MRP, and price lists for fertilizers, pesticides, and inputs.",
    keywords:
      "agri product catalog, fertilizer SKU, pesticide price list, Jitox product master",
    robots: "noindex, follow",
    h1: "Product master",
  },
  {
    pattern: "/dashboard/accounting-voucher/add-purchase",
    title: "Add purchase voucher — Jitox",
    description:
      "Record purchase vouchers with line items, GST, and stock impact.",
    keywords: "purchase voucher agri, stock inward, Jitox purchase entry",
    robots: "noindex, follow",
    h1: "Add purchase voucher",
  },
  {
    pattern: "/dashboard/accounting-voucher/add-quotation",
    title: "Add quotation — Jitox",
    description:
      "Create sales quotations for dealers and distributors with products and pricing.",
    keywords: "agri quotation, sales quote fertilizer, Jitox quotation",
    robots: "noindex, follow",
    h1: "Add quotation",
  },
  {
    pattern: "/dashboard/accounting-voucher/add-manufacturing",
    title: "Add manufacturing batch — Jitox",
    description: "Log manufacturing or batch processing tied to inventory.",
    keywords: "manufacturing voucher agro, batch production Jitox",
    robots: "noindex, follow",
    h1: "Manufacturing",
  },
  {
    pattern: "/dashboard/accounting-voucher/sales-invoice",
    title: "Sales invoice view — Jitox",
    description: "Review sales or return invoice details linked to orders.",
    keywords: "sales invoice agri, Jitox invoice view",
    robots: "noindex, follow",
    h1: "Sales invoice",
  },
  {
    pattern: "/dashboard/accounting-voucher/:voucherSlug",
    title: "Accounting vouchers — Jitox",
    description:
      "Purchase, payment, receipt, journal, and expense vouchers for compliant agri distribution accounting.",
    keywords:
      "accounting vouchers agriculture, payment voucher, receipt voucher, day book India, Jitox vouchers",
    robots: "noindex, follow",
    h1: "Accounting vouchers",
  },
  {
    pattern: "/dashboard/employee-tracking",
    title: "Employee tracking & visits — Jitox",
    description:
      "Monitor field visits, routes, and team productivity for agri sales and technical teams.",
    keywords:
      "field force tracking agriculture, sales visit tracking, Jitox employee tracking",
    robots: "noindex, follow",
    h1: "Employee tracking",
  },
  {
    pattern: "/dashboard/hrm",
    title: "HRM — Employees, payroll & letters | Jitox",
    description:
      "Human resources: clock-in/out, salary slip templates, offer and appointment letters.",
    keywords: "HRM, employee management, salary slip, payroll, Jitox HR",
    robots: "noindex, follow",
    h1: "HRM",
  },
  {
    pattern: "/dashboard/daybook",
    title: "Day book — Cash & journal entries | Jitox",
    description:
      "Daily voucher listing with debit, credit, and voucher types for quick reconciliation.",
    keywords: "day book accounting, cash book agri, Jitox daybook",
    robots: "noindex, follow",
    h1: "Day book",
  },
  {
    pattern: "/dashboard/receivable",
    title: "Receivables — Receipt vouchers | Jitox",
    description:
      "Track money received from parties via cash, bank, or UPI against outstanding invoices.",
    keywords:
      "receivables agriculture, receipt voucher, collection tracking Jitox",
    robots: "noindex, follow",
    h1: "Receivables",
  },
  {
    pattern: "/dashboard/payable",
    title: "Payables — Supplier payments | Jitox",
    description:
      "Manage supplier and expense payables with due dates and payment modes.",
    keywords: "payables agri distributor, supplier dues, Jitox payables",
    robots: "noindex, follow",
    h1: "Payables",
  },
  {
    pattern: "/dashboard/stock",
    title: "Stock monitoring — Inventory | Jitox",
    description:
      "Real-time stock by product, group, and warehouse-style views for agri inputs.",
    keywords:
      "agri inventory software, fertilizer stock, pesticide stock level, Jitox stock",
    robots: "noindex, follow",
    h1: "Stock monitoring",
  },
  {
    pattern: "/dashboard/scheme-master",
    title: "Schemes & promotions — Jitox",
    description:
      "Configure trade schemes, discounts, and promotional rules for dealers.",
    keywords: "agri trade scheme, distributor promotion, Jitox schemes",
    robots: "noindex, follow",
    h1: "Scheme master",
  },
  {
    pattern: "/dashboard/documents",
    title: "Documents — Jitox",
    description:
      "Store and organize licenses, certificates, and business documents.",
    keywords: "agri document management, license storage Jitox",
    robots: "noindex, follow",
    h1: "Documents",
  },
  {
    pattern: "/dashboard/reports",
    title: "Reports & analytics — Jitox",
    description:
      "Sales, stock, and operational reports for agri distribution decision-making.",
    keywords: "agri sales reports, inventory reports India, Jitox analytics",
    robots: "noindex, follow",
    h1: "Reports",
  },
  {
    pattern: "/dashboard",
    title: "Dashboard — Overview | Jitox Agri ERP",
    description:
      "Jitox home dashboard: KPIs, orders, revenue snapshot, and quick access to inventory and accounting.",
    keywords:
      "agri ERP dashboard, distributor KPI, agriculture business overview, Jitox home",
    robots: "noindex, follow",
    h1: "Dashboard overview",
  },
];

/** Exact `/` before redirect to sign-in — keep indexable with canonical root. */
export const ROOT_SEO = {
  title: `${SITE_NAME} — Agri Business Dashboard, ERP & Inventory`,
  description:
    "Jitox is an agri-business ERP: orders, inventory, accounts, vouchers, field teams, and reports for dealers and distributors in India.",
  keywords:
    "Jitox, agri ERP, agriculture software, farm inventory, dealer management, accounting vouchers, India agri tech",
  robots: "index, follow",
  h1: SITE_NAME,
};

/** Unmatched paths (e.g. soft 404) — avoid indexing arbitrary URLs. */
export const DEFAULT_SEO = {
  ...ROOT_SEO,
  title: `Page not found — ${SITE_NAME}`,
  description:
    "The requested page was not found. Sign in to Jitox to access your agri-business dashboard.",
  robots: "noindex, follow",
  h1: "Page not found",
};
