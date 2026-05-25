import { getStoredUser, isAdminUser } from "./authSession";

/**
 * In-app route for a notification document from the API.
 * Task notifications include `taskId` and `type`; others fall back to tasks home.
 *
 * @param {Record<string, unknown> | null | undefined} raw
 * @returns {string | null} pathname + query, or null if nothing to open
 */
export function getNotificationTargetPath(raw) {
  if (!raw || typeof raw !== "object") return null;

  const taskId = raw.taskId != null ? String(raw.taskId).trim() : "";
  const type = String(raw.type || "");

  const taskTypes = new Set([
    "task_assigned",
    "task_updated",
    "task_completed",
    "task_overdue",
  ]);

  if (type === "user_registration_pending") {
    const userId = raw.meta?.pendingUserId;
    const q = new URLSearchParams({ status: "pending" });
    if (userId) q.set("userId", String(userId));
    return `/dashboard/user-master?${q.toString()}`;
  }

  if (type === "territory_unmapped_district") {
    const district = raw.meta?.district;
    const q = district
      ? `?highlightDistrict=${encodeURIComponent(String(district))}`
      : "";
    return `/dashboard/territories${q}`;
  }

  if (type === "product_low_stock") {
    return "/dashboard/stock";
  }

  const orderTypes = new Set([
    "order_new",
    "order_pending",
    "order_approved",
    "order_cancelled",
    "order_dispatched",
    "order_invoice_generated",
    "order_returned",
  ]);
  if (orderTypes.has(type)) {
    const qid = raw.meta?.quotationId;
    return qid
      ? `/dashboard/order-list?orderId=${encodeURIComponent(String(qid))}`
      : "/dashboard/order-list";
  }

  const user = getStoredUser();
  const tasksHome = isAdminUser(user)
    ? "/dashboard/tasks/all"
    : "/dashboard/tasks/my";

  if (taskId) {
    return `${tasksHome}?taskId=${encodeURIComponent(taskId)}`;
  }

  if (taskTypes.has(type)) {
    return tasksHome;
  }

  return tasksHome;
}
