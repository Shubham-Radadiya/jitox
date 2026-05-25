import Notification from "../models/notification.model";
import User from "../models/user.model";
import { NotificationType } from "../types/notification.type";
import { Role } from "../constants/roles";
import { emitToUser, emitToAdmins } from "../socket/io";

export async function getAdminUserIds(): Promise<string[]> {
  const admins = await User.find({ role: Role.admin }).select("_id").lean();
  return admins.map((a) => String(a._id));
}

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

/** Notify all admins when a mobile user registers and awaits approval. */
export async function notifyAdminsPendingRegistration(input: {
  userId: string;
  userName: string;
  email: string;
  district?: string;
  city?: string;
}): Promise<void> {
  const adminIds = await getAdminUserIds();
  if (!adminIds.length) return;

  const location = [input.city, input.district].filter(Boolean).join(", ");
  const locationPart = location ? ` (${location})` : "";
  const body = `New field user "${input.userName}" (${input.email})${locationPart} registered on the mobile app. Approve or reject in User Master.`;

  await Promise.all(
    adminIds.map((uid) =>
      createAndPushNotification({
        userId: uid,
        type: "user_registration_pending",
        title: "New user awaiting approval",
        body,
        meta: {
          pendingUserId: input.userId,
          userName: input.userName,
          email: input.email,
          district: input.district || "",
          city: input.city || "",
        },
      })
    )
  );
  emitToAdmins("user:registration_pending", {
    userId: input.userId,
    email: input.email,
  });
}

/** Mark pending-registration alerts read after admin approves or rejects the user. */
export async function resolvePendingRegistrationNotifications(
  pendingUserId: string
): Promise<void> {
  const id = String(pendingUserId || "").trim();
  if (!id) return;

  await Notification.updateMany(
    {
      type: "user_registration_pending",
      read: false,
      "meta.pendingUserId": id,
    },
    { $set: { read: true } }
  );
}

/** Alert admins when a user's district is not listed on any territory. */
export async function notifyAdminsUnmappedDistrict(input: {
  userId: string;
  userName: string;
  district: string;
  state?: string;
}): Promise<void> {
  const district = String(input.district || "").trim();
  if (!district) return;

  const adminIds = await getAdminUserIds();
  if (!adminIds.length) return;

  const districtKey = district.toLowerCase();
  const existing = await Notification.findOne({
    userId: { $in: adminIds },
    type: "territory_unmapped_district",
    read: false,
    "meta.districtKey": districtKey,
    "meta.userId": input.userId,
  }).lean();
  if (existing) return;

  const statePart = input.state ? ` (${input.state})` : "";
  const body = `User "${input.userName}" is in district "${district}"${statePart}, which is not assigned to any territory. Add this district to a territory in Territory Master.`;

  await Promise.all(
    adminIds.map((uid) =>
      createAndPushNotification({
        userId: uid,
        type: "territory_unmapped_district",
        title: "District not mapped to territory",
        body,
        meta: {
          userId: input.userId,
          userName: input.userName,
          district,
          districtKey,
          state: input.state || "",
        },
      })
    )
  );
  emitToAdmins("territory:unmapped_district", {
    district,
    userId: input.userId,
  });
}

/** Mark unmapped-district alerts resolved when the district is added to a territory. */
export async function resolveUnmappedDistrictNotifications(
  district: string,
  territoryId: string,
  territoryName: string
): Promise<void> {
  const districtKey = String(district || "")
    .trim()
    .toLowerCase();
  if (!districtKey) return;

  await Notification.updateMany(
    {
      type: "territory_unmapped_district",
      read: false,
      "meta.districtKey": districtKey,
    },
    {
      $set: {
        read: true,
        "meta.resolvedTerritoryId": territoryId,
        "meta.resolvedTerritoryName": territoryName,
      },
    }
  );
}
