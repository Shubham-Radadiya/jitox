import mongoose, { Schema } from "mongoose";
import { ITask } from "../types/task.type";

const attachmentSchema = new Schema(
  {
    name: { type: String, trim: true },
    url: { type: String, trim: true },
  },
  { _id: false }
);

const taskSchema = new Schema<ITask>(
  {
    taskName: { type: String, required: true, trim: true },
    description: { type: String },
    setDate: { type: Date },
    setTime: { type: String, trim: true },
    setDuration: { type: String, trim: true },
    setReminder: { type: String, trim: true },
    status: {
      type: String,
      enum: ["todo", "pending", "in_progress", "completed"],
      default: "pending",
    },
    assigneeUserId: { type: String, trim: true },
    assignedByUserId: { type: String, trim: true },
    assignedUserIds: { type: [String], default: [] },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    dueDate: { type: Date },
    attachments: { type: [attachmentSchema], default: [] },
  },
  {
    timestamps: true,
  }
);

taskSchema.pre("save", function (next) {
  const doc = this as ITask;
  if (
    (!doc.assignedUserIds || doc.assignedUserIds.length === 0) &&
    doc.assigneeUserId
  ) {
    doc.assignedUserIds = [String(doc.assigneeUserId)];
  }
  if (doc.assignedUserIds?.length && !doc.assigneeUserId) {
    doc.assigneeUserId = String(doc.assignedUserIds[0]);
  }
  next();
});

const Task = mongoose.model<ITask>("Task", taskSchema);

export default Task;
