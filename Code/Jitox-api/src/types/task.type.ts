import { Document } from "mongoose";

export type TaskStatus = "todo" | "pending" | "in_progress" | "completed";

export type TaskPriority = "low" | "medium" | "high";

export interface TaskAttachment {
  name: string;
  url: string;
}

export interface ITask extends Document {
  taskName: string;
  description?: string;
  setDate?: Date;
  setTime?: string;
  setDuration?: string;
  setReminder?: string;
  status?: TaskStatus;
  /** @deprecated use assignedUserIds */
  assigneeUserId?: string;
  assignedByUserId?: string;
  assignedUserIds: string[];
  priority: TaskPriority;
  dueDate?: Date;
  attachments: TaskAttachment[];
  createdAt?: Date;
  updatedAt?: Date;
}
