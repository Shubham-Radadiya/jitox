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
