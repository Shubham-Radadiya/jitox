import { Response } from "express";
import { Task, User } from "../models/index";
import { validateAndRespond } from "../utils/validateAndRespond";
import { HttpStatusCode } from "../common/errors/httpStatusCode";
import { AppError } from "../common/errors/AppError";
import { sendSuccess } from "../utils/apiResponse";
import { AuthRequest } from "../middleware/authonticated.middleware";
import { Role } from "../constants/roles";
import {
  notifyTaskAssigned,
  notifyTaskUpdated,
  notifyTaskCompleted,
  notifyAdminsTaskStatusFromAssignee,
} from "../services/notification.service";
import { emitToAdmins, emitToUser } from "../socket/io";

function reqUser(req: AuthRequest): { id: string; role: string } {
  const u = req.user as { id?: string; role?: string };
  return { id: String(u?.id || ""), role: String(u?.role || "") };
}

function normalizeStatus(s: unknown): string {
  const v = String(s || "pending").toLowerCase();
  if (v === "todo" || v === "pending") return "pending";
  if (v === "in_progress") return "in_progress";
  if (v === "completed") return "completed";
  return "pending";
}

function assignedIdsFromDoc(doc: {
  assignedUserIds?: string[];
  assigneeUserId?: string;
}): string[] {
  if (doc.assignedUserIds?.length)
    return doc.assignedUserIds.map(String);
  if (doc.assigneeUserId) return [String(doc.assigneeUserId)];
  return [];
}

function enrichTask(t: InstanceType<typeof Task> | Record<string, unknown>) {
  const o =
    typeof (t as InstanceType<typeof Task>).toObject === "function"
      ? (t as InstanceType<typeof Task>).toObject()
      : { ...(t as Record<string, unknown>) };
  const due = (o.dueDate || o.setDate) as Date | undefined;
  const st = normalizeStatus(o.status);
  let effectiveStatus: string = st === "todo" ? "pending" : st;
  if (
    due &&
    new Date(due).getTime() < Date.now() &&
    st !== "completed"
  ) {
    effectiveStatus = "overdue";
  }
  const ids = assignedIdsFromDoc(o as { assignedUserIds?: string[]; assigneeUserId?: string });
  return {
    ...o,
    assignedUserIds: ids,
    effectiveStatus,
    title: o.taskName,
  };
}

async function adminUserIds(): Promise<string[]> {
  const admins = await User.find({ role: Role.admin }).select("_id").lean();
  return admins.map((a) => String(a._id));
}

function canEditTask(
  role: string,
  userId: string,
  task: { assignedUserIds?: string[]; assigneeUserId?: string }
): boolean {
  if (role === Role.admin) return true;
  const ids = assignedIdsFromDoc(task);
  return ids.includes(userId);
}

export const createTask = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const {
    taskName,
    title,
    description,
    setDate,
    setTime,
    setDuration,
    setReminder,
    status,
    assigneeUserId,
    assignedByUserId,
    assignedUserIds,
    priority,
    dueDate,
    attachments,
  } = req.body;

  const name = taskName || title;
  validateAndRespond({ taskName: name }, ["taskName"] as const, res);

  const { id: actorId } = reqUser(req);
  const idsRaw = Array.isArray(assignedUserIds) ? assignedUserIds : [];
  const ids =
    idsRaw.length > 0
      ? idsRaw.map(String)
      : assigneeUserId
        ? [String(assigneeUserId)]
        : [];

  const newTask = new Task({
    taskName: name,
    description,
    setDate: dueDate ? new Date(dueDate) : setDate ? new Date(setDate) : undefined,
    dueDate: dueDate ? new Date(dueDate) : undefined,
    setTime,
    setDuration,
    setReminder,
    status: normalizeStatus(status) as "pending" | "in_progress" | "completed",
    assigneeUserId: ids[0],
    assignedUserIds: ids,
    assignedByUserId: assignedByUserId || actorId,
    priority: ["low", "medium", "high"].includes(String(priority))
      ? priority
      : "medium",
    attachments: Array.isArray(attachments) ? attachments : [],
  });

  const savedTask = await newTask.save();
  const actor = await User.findById(actorId).lean();
  const actorName =
    (actor as { name?: string })?.name ||
    [(actor as { firstName?: string })?.firstName, (actor as { lastName?: string })?.lastName]
      .filter(Boolean)
      .join(" ")
      .trim() ||
    "Admin";

  for (const uid of ids) {
    if (uid && uid !== actorId) {
      await notifyTaskAssigned(uid, String(savedTask._id), name, actorName);
    }
  }
  emitToAdmins("task:created", enrichTask(savedTask));

  res.status(201).json({
    message: "Task created successfully",
    task: enrichTask(savedTask),
  });
};

export const getAllTasks = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const { date } = req.query;
  const { id: uid, role } = reqUser(req);
  let filter: Record<string, unknown> = {};

  if (date) {
    const startOfDay = new Date(date as string);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date as string);
    endOfDay.setHours(23, 59, 59, 999);
    filter.setDate = { $gte: startOfDay, $lte: endOfDay };
  }

  if (role !== Role.admin) {
    filter = {
      ...filter,
      $or: [{ assignedUserIds: uid }, { assigneeUserId: uid }],
    };
  }

  const tasks = await Task.find(filter).sort({ createdAt: -1 });
  const enriched = tasks.map((t) => enrichTask(t));
  sendSuccess(res, enriched, enriched.length ? "" : "No tasks found.");
};

export const getTaskAnalytics = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const tasks = await Task.find({}).lean();
  const enriched = tasks.map((t) => enrichTask(t as InstanceType<typeof Task>));
  const total = enriched.length;
  const byEffective: Record<string, number> = {};
  enriched.forEach((t) => {
    const k = String(t.effectiveStatus || "pending");
    byEffective[k] = (byEffective[k] || 0) + 1;
  });
  const completed = enriched.filter((t) => t.effectiveStatus === "completed").length;
  const pending = enriched.filter((t) =>
    ["pending", "in_progress"].includes(String(t.effectiveStatus))
  ).length;
  const overdue = enriched.filter((t) => t.effectiveStatus === "overdue").length;

  const byUser: Record<string, { total: number; completed: number; name: string }> = {};
  for (const t of enriched) {
    const assignees = (t.assignedUserIds as string[]) || [];
    for (const aid of assignees) {
      if (!byUser[aid])
        byUser[aid] = { total: 0, completed: 0, name: aid };
      byUser[aid].total += 1;
      if (t.effectiveStatus === "completed") byUser[aid].completed += 1;
    }
  }
  const users = await User.find({
    _id: { $in: Object.keys(byUser) },
  })
    .select("name firstName lastName email")
    .lean();
  const userMap = Object.fromEntries(
    users.map((u) => [
      String(u._id),
      (u as { name?: string }).name ||
        [(u as { firstName?: string }).firstName, (u as { lastName?: string }).lastName]
          .filter(Boolean)
          .join(" ") ||
        (u as { email?: string }).email ||
        String(u._id),
    ])
  );
  Object.keys(byUser).forEach((k) => {
    byUser[k].name = userMap[k] || byUser[k].name;
  });

  const byDay: Record<string, number> = {};
  enriched.forEach((t) => {
    const c = (t as { createdAt?: Date }).createdAt;
    if (c) {
      const d = new Date(c).toISOString().slice(0, 10);
      byDay[d] = (byDay[d] || 0) + 1;
    }
  });

  res.status(200).json({
    summary: { total, completed, pending, overdue },
    byStatus: byEffective,
    byUser: Object.entries(byUser).map(([userId, v]) => ({
      userId,
      ...v,
      completionRate: v.total ? Math.round((v.completed / v.total) * 100) : 0,
    })),
    byDay,
  });
};

export const getTaskById = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const { id } = req.params;
  const { id: uid, role } = reqUser(req);
  const task = await Task.findById(id);
  if (!task) {
    throw new AppError(HttpStatusCode.NOT_FOUND, "Task not found.");
  }
  if (role !== Role.admin && !canEditTask(role, uid, task)) {
    throw new AppError(HttpStatusCode.FORBIDDEN, "Not allowed to view this task.");
  }
  res.status(200).json(enrichTask(task));
};

export const updateTask = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const { id } = req.params;
  const { id: uid, role } = reqUser(req);
  const task = await Task.findById(id);
  if (!task) {
    throw new AppError(HttpStatusCode.NOT_FOUND, "Task not found.");
  }
  if (!canEditTask(role, uid, task)) {
    throw new AppError(HttpStatusCode.FORBIDDEN, "Not allowed to update this task.");
  }

  const prevStatus = normalizeStatus(task.status);
  let body = { ...req.body };

  if (role !== Role.admin) {
    const allowed = ["status"];
    body = Object.fromEntries(
      Object.entries(body).filter(([k]) => allowed.includes(k))
    );
  }

  if (body.status !== undefined) {
    body.status = normalizeStatus(body.status);
  }

  const updatedTask = await Task.findByIdAndUpdate(id, body, {
    new: true,
    runValidators: true,
  });

  if (!updatedTask) {
    throw new AppError(HttpStatusCode.NOT_FOUND, "Task not found.");
  }

  const actor = await User.findById(uid).lean();
  const actorName =
    (actor as { name?: string })?.name ||
    [(actor as { firstName?: string })?.firstName, (actor as { lastName?: string })?.lastName]
      .filter(Boolean)
      .join(" ")
      .trim() ||
    "Someone";

  const assignees = assignedIdsFromDoc(updatedTask);
  const admins = await adminUserIds();
  const newStatus = body.status !== undefined ? normalizeStatus(body.status) : prevStatus;

  if (body.status !== undefined && newStatus !== prevStatus) {
    // Other assignees (not the editor); skip admins here when a non-admin updated — admins get a dedicated alert below.
    for (const aid of assignees) {
      if (aid !== uid && !(role !== Role.admin && admins.includes(aid))) {
        await notifyTaskUpdated(
          aid,
          String(updatedTask._id),
          updatedTask.taskName,
          `${actorName} updated status to ${newStatus}.`
        );
      }
    }

    // Creator who is not an assignee (e.g. manager) should still see the update; skip if they are admin (already notified).
    const creatorId = updatedTask.assignedByUserId
      ? String(updatedTask.assignedByUserId)
      : "";
    if (
      creatorId &&
      creatorId !== uid &&
      !assignees.includes(creatorId) &&
      !admins.includes(creatorId)
    ) {
      await notifyTaskUpdated(
        creatorId,
        String(updatedTask._id),
        updatedTask.taskName,
        `${actorName} updated status to ${newStatus}.`
      );
    }

    if (role !== Role.admin) {
      const notifyAdminIds = admins.filter((a) => a !== uid);
      await notifyAdminsTaskStatusFromAssignee(
        notifyAdminIds,
        String(updatedTask._id),
        updatedTask.taskName,
        prevStatus,
        newStatus,
        actorName
      );
    } else if (newStatus === "completed") {
      const notifyIds = admins.filter((a) => a !== uid);
      await notifyTaskCompleted(
        notifyIds,
        String(updatedTask._id),
        updatedTask.taskName,
        actorName
      );
    }
  }

  const payload = enrichTask(updatedTask);
  emitToAdmins("task:updated", payload);
  assignees.forEach((a) => emitToUser(a, "task:updated", payload));

  res.status(200).json({ message: "Task updated successfully", task: payload });
};

export const deleteTask = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const { id } = req.params;
  const deletedTask = await Task.findByIdAndDelete(id);
  if (!deletedTask) {
    throw new AppError(HttpStatusCode.NOT_FOUND, "Task not found.");
  }
  emitToAdmins("task:deleted", { id });
  res.status(200).json({ message: "Task deleted successfully" });
};
