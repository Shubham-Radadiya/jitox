import mongoose, { Schema } from "mongoose";
import { INotification } from "../types/notification.type";

const notificationSchema = new Schema<INotification>(
  {
    userId: { type: String, required: true, index: true },
    type: {
      type: String,
      required: true,
      enum: [
        "task_assigned",
        "task_updated",
        "task_completed",
        "task_overdue",
        "territory_unmapped_district",
        "product_low_stock",
        "order_new",
        "order_pending",
        "order_approved",
        "order_cancelled",
        "order_dispatched",
        "order_invoice_generated",
        "order_returned",
      ],
    },
    title: { type: String, required: true, trim: true },
    body: { type: String, default: "", trim: true },
    read: { type: Boolean, default: false, index: true },
    taskId: { type: String, trim: true },
    meta: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

notificationSchema.index({ userId: 1, createdAt: -1 });

const Notification = mongoose.model<INotification>(
  "Notification",
  notificationSchema
);

export default Notification;
