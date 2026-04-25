import { Document } from "mongoose";

export type NotificationType =
  | "task_assigned"
  | "task_updated"
  | "task_completed"
  | "task_overdue";

export interface INotification extends Document {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  read: boolean;
  taskId?: string;
  meta?: Record<string, unknown>;
}
