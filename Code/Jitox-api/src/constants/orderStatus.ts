export const ORDER_STATUS_VALUES = [
  "Pending",
  "Dispatched",
  "Processing",
  "Cancelled",
  "Approved",
  "Quotation",
] as const;

export type OrderStatusValue = (typeof ORDER_STATUS_VALUES)[number];

export function normalizeOrderStatus(
  value?: string
): OrderStatusValue | undefined {
  const s = String(value ?? "").trim();
  if (!s) return undefined;
  const hit = ORDER_STATUS_VALUES.find(
    (v) => v.toLowerCase() === s.toLowerCase()
  );
  return hit;
}

export function dashboardTabForOrderStatus(status: string): string {
  const n = normalizeOrderStatus(status);
  if (n === "Dispatched") return "dispatched";
  if (n === "Cancelled") return "cancelled";
  return "pending";
}
