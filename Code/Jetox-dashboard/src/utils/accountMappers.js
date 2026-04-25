import { buildTableSummary } from "./addressFormat";

/** Admin-configurable inactivity threshold (months without billing). */
export function getCustomerInactiveMonths() {
  const n = Number(
    typeof localStorage !== "undefined"
      ? localStorage.getItem("JITOX_CUSTOMER_INACTIVE_MONTHS") || "3"
      : "3"
  );
  return Number.isFinite(n) && n > 0 ? n : 3;
}

export function mapAccountToRow(a) {
  const isCredit = String(a.balenceType || "").toLowerCase() === "credit";
  const amt = Number(a.amount);
  const fmt = (n) =>
    Number.isFinite(n) ? n.toLocaleString("en-IN") : "—";
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
    "Credit (₹)": isCredit ? fmt(amt) : "—",
    "Debit (₹)": !isCredit ? fmt(amt) : "—",
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
