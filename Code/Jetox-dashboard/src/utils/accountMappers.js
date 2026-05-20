import { buildTableSummary } from "./addressFormat";
import { formatAccountCreditDebitFromRunning } from "./partyLedgerTx";

/** Admin-configurable inactivity threshold (months without billing). */
export function getCustomerInactiveMonths() {
  const n = Number(
    typeof localStorage !== "undefined"
      ? localStorage.getItem("JITOX_CUSTOMER_INACTIVE_MONTHS") || "3"
      : "3"
  );
  return Number.isFinite(n) && n > 0 ? n : 3;
}

const REGION_LABELS = {
  north: "North Region",
  south: "South Region",
  east: "East Region",
  west: "West Region",
};

/** Account Master “Area Assignment” → display label (Region). */
export function formatAreaAssignmentLabel(value) {
  const s = String(value || "").trim();
  if (!s) return "";
  const key = s.toLowerCase();
  if (REGION_LABELS[key]) return REGION_LABELS[key];
  return s
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function accountRegionAndArea(account) {
  if (!account || typeof account !== "object") {
    return { region: "", area: "" };
  }
  return {
    region: formatAreaAssignmentLabel(account.areaAssigment),
    area: String(account.area || account.businessArea || "").trim(),
  };
}

/** Match purchase/sales party dropdown value to an Account Master row. */
export function findAccountByBusinessName(accounts, businessName) {
  const target = String(businessName || "").trim().toLowerCase();
  if (!target) return null;
  const list = Array.isArray(accounts) ? accounts : [];
  return (
    list.find(
      (a) => String(a?.businessName || "").trim().toLowerCase() === target
    ) || null
  );
}

export function mapAccountToRow(a, options = {}) {
  const fmt = (n) =>
    Number.isFinite(n) ? n.toLocaleString("en-IN") : "—";

  let creditCell;
  let debitCell;
  if (
    options.closingRunning != null &&
    Number.isFinite(Number(options.closingRunning))
  ) {
    const cells = formatAccountCreditDebitFromRunning(options.closingRunning);
    creditCell = cells.credit;
    debitCell = cells.debit;
  } else {
    const isCredit = String(a.balenceType || "").toLowerCase() === "credit";
    const amt = Number(a.amount);
    creditCell = isCredit ? fmt(amt) : "—";
    debitCell = !isCredit ? fmt(amt) : "—";
  }
  const cat = a.category
    ? String(a.category).replace(/_/g, " ")
    : a.accountType || "—";

  let status = a.customerStatus || "Active";
  if (a.billActivityStatus === "active") {
    status = "Active";
  } else if (a.billActivityStatus === "inactive") {
    status = "Inactive (auto)";
  } else {
    const lb = a.lastBillingAt ? new Date(a.lastBillingAt) : null;
    if (
      status === "Active" &&
      lb &&
      !Number.isNaN(lb.getTime()) &&
      typeof localStorage !== "undefined"
    ) {
      const months = (Date.now() - lb.getTime()) / (1000 * 60 * 60 * 24 * 30);
      if (months >= getCustomerInactiveMonths()) {
        status = "Inactive (auto)";
      }
    }
  }

  return {
    _id: a._id || a.id,
    "Party Name": a.businessName || "—",
    "Contact Person": a.name || "—",
    Territory: a.areaAssigment || "—",
    "Account Type": cat,
    "Credit (₹)": creditCell,
    "Debit (₹)": debitCell,
    Status: status,
    Street:
      a.addressSummary ||
      buildTableSummary({
        streetAddress: a.streetAddress || a.street,
        city: a.city,
        pincode: a.pincode || a.pinCode,
      }),
    "Shop No": a.shopNo || "—",
    City: a.city || "—",
    Taluka: a.taluka || "—",
    State: a.state || "—",
    PIN: a.pincode || a.pinCode || "—",
    _fullAddress: a.fullAddress || "",
    "Party Type": a.partyType || "—",
    Transport: a.transportMode || "—",
    "Delivery At": a.deliveryAt || "—",
    GST: a.gstNumber || "—",
    Birthday: a.birthday || "—",
    Anniversary: a.anniversary || "—",
    _category: String(a.category || "").toLowerCase(),
    _raw: a,
  };
}
