import Notification from "../models/notification.model";
import { NotificationType } from "../types/notification.type";
import { emitToUser, emitToAdmins } from "../socket/io";

function statusLabel(status: string): string {
  const m: Record<string, string> = {
    pending: "Pending",
    in_progress: "In progress",
    completed: "Completed",
  };
  return m[status] || status;
}

export async function createAndPushNotification(input: {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  taskId?: string;
  meta?: Record<string, unknown>;
}): Promise<void> {
  const doc = await Notification.create({
    userId: input.userId,
    type: input.type,
    title: input.title,
    body: input.body,
    read: false,
    taskId: input.taskId,
    meta: input.meta || {},
  });
  const plain = doc.toObject();
  emitToUser(input.userId, "notification:new", {
    ...plain,
    _id: String(plain._id),
  });
}

export function notifyTaskAssigned(
  assigneeId: string,
  taskId: string,
  taskTitle: string,
  actorName: string
): Promise<void> {
  return createAndPushNotification({
    userId: assigneeId,
    type: "task_assigned",
    title: "New task assigned",
    body: `You have been assigned: "${taskTitle}"${actorName ? ` by ${actorName}` : ""}.`,
    taskId,
    meta: { taskTitle, actorName },
  });
}

export function notifyTaskUpdated(
  userId: string,
  taskId: string,
  taskTitle: string,
  message: string
): Promise<void> {
  return createAndPushNotification({
    userId,
    type: "task_updated",
    title: "Task updated",
    body: message || `Task "${taskTitle}" was updated.`,
    taskId,
    meta: { taskTitle },
  });
}

export async function notifyTaskCompleted(
  adminUserIds: string[],
  taskId: string,
  taskTitle: string,
  completedByName: string
): Promise<void> {
  const body = `Task "${taskTitle}" was marked completed${completedByName ? ` by ${completedByName}` : ""}.`;
  await Promise.all(
    adminUserIds.map((uid) =>
      createAndPushNotification({
        userId: uid,
        type: "task_completed",
        title: "Task completed",
        body,
        taskId,
        meta: { taskTitle, completedByName },
      })
    )
  );
  emitToAdmins("task:updated", { taskId, status: "completed" });
}

/**
 * When a non-admin (assignee) changes task status: notify every admin in-app + real-time (`notification:new`).
 * Uses task_completed when the new status is completed; otherwise task_updated.
 */
export async function notifyAdminsTaskStatusFromAssignee(
  adminUserIds: string[],
  taskId: string,
  taskTitle: string,
  prevStatus: string,
  newStatus: string,
  actorName: string
): Promise<void> {
  const done = newStatus === "completed";
  const title = done ? "Task completed" : "Task status updated";
  const body = done
    ? `Task "${taskTitle}" was marked completed by ${actorName || "assignee"}.`
    : `${actorName || "Assignee"} updated "${taskTitle}" from ${statusLabel(prevStatus)} to ${statusLabel(newStatus)}.`;
  const type: NotificationType = done ? "task_completed" : "task_updated";
  await Promise.all(
    adminUserIds.map((uid) =>
      createAndPushNotification({
        userId: uid,
        type,
        title,
        body,
        taskId,
        meta: {
          taskTitle,
          actorName,
          prevStatus,
          newStatus,
          source: "assignee_status_change",
        },
      })
    )
  );
}
