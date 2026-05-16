export const ORDER_SORT_OPTIONS = [
  { label: "Newest First", value: "newest" },
  { label: "Oldest First", value: "oldest" },
  { label: "Highest Amount", value: "amountHigh" },
  { label: "Lowest Amount", value: "amountLow" },
  { label: "Delivery Date", value: "delivery" },
];

function parseOrderTotal(row) {
  const s = String(row["Total Amount"] ?? "").replace(/[₹,\s]/g, "");
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}

function compareOrderDate(a, b) {
  return String(a.Date || "").localeCompare(String(b.Date || ""));
}

/** Client-side sort for dashboard / order-list rows from the orders API. */
export function sortOrderRows(rows, sortKey) {
  const list = [...(rows || [])];
  switch (sortKey) {
    case "oldest":
    case "delivery":
      return list.sort(compareOrderDate);
    case "newest":
      return list.sort((a, b) => -compareOrderDate(a, b));
    case "amountHigh":
      return list.sort((a, b) => parseOrderTotal(b) - parseOrderTotal(a));
    case "amountLow":
      return list.sort((a, b) => parseOrderTotal(a) - parseOrderTotal(b));
    default:
      return list;
  }
}
