import { Quotation } from "../models/index";
import Notification from "../models/notification.model";
import {
  createAndPushNotification,
  getAdminUserIds,
} from "./notification.service";
import { emitToAdmins } from "../socket/io";

type OrderNotificationType =
  | "order_new"
  | "order_pending"
  | "order_approved"
  | "order_cancelled"
  | "order_dispatched"
  | "order_invoice_generated"
  | "order_returned";

type QuotationNotifyDoc = {
  _id?: unknown;
  voucherNo?: unknown;
  partyName?: unknown;
  invoiceNo?: unknown;
  transportDetails?: unknown;
  addedToOrder?: unknown;
  dashboardOrderStatus?: unknown;
};

function str(v: unknown, fallback = ""): string {
  return String(v ?? fallback).trim();
}

function orderLabel(doc: QuotationNotifyDoc): string {
  const no = str(doc.voucherNo) || str(doc._id).slice(-6) || "—";
  return `#${no.replace(/^#/, "")}`;
}

async function countPendingOrders(): Promise<number> {
  return Quotation.countDocuments({
    addedToOrder: true,
    dashboardOrderStatus: "Pending",
  });
}

async function hasUnreadNotification(
  type: OrderNotificationType,
  quotationId?: string
): Promise<boolean> {
  const filter: Record<string, unknown> = {
    type,
    read: false,
  };
  if (quotationId) {
    filter["meta.quotationId"] = quotationId;
  }
  const existing = await Notification.findOne(filter).lean();
  return Boolean(existing);
}

async function notifyAdminsOrderEvent(
  type: OrderNotificationType,
  title: string,
  body: string,
  meta: Record<string, unknown>
): Promise<void> {
  const quotationId = meta.quotationId ? String(meta.quotationId) : "";
  if (quotationId && (await hasUnreadNotification(type, quotationId))) {
    return;
  }

  const adminIds = await getAdminUserIds();
  if (!adminIds.length) return;

  await Promise.all(
    adminIds.map((uid) =>
      createAndPushNotification({
        userId: uid,
        type,
        title,
        body,
        meta,
      })
    )
  );

  emitToAdmins("order:updated", { type, ...meta });
}

export async function notifyOrderNew(doc: QuotationNotifyDoc): Promise<void> {
  const quotationId = String(doc._id);
  const label = orderLabel(doc);
  await notifyAdminsOrderEvent(
    "order_new",
    `New Order ${label} Arrive`,
    "New orders are waiting your approval.",
    {
      quotationId,
      voucherNo: str(doc.voucherNo),
      partyName: str(doc.partyName),
      orderStatus: str(doc.dashboardOrderStatus, "Pending"),
    }
  );
}

export async function notifyOrderPendingSummary(): Promise<void> {
  const count = await countPendingOrders();
  if (count <= 0) return;

  if (await hasUnreadNotification("order_pending")) {
    return;
  }

  const adminIds = await getAdminUserIds();
  if (!adminIds.length) return;

  const body =
    count === 1
      ? "You have 1 new order awaiting your approval."
      : `You have ${count} new orders awaiting your approval.`;

  await Promise.all(
    adminIds.map((uid) =>
      createAndPushNotification({
        userId: uid,
        type: "order_pending",
        title: "Order Pending",
        body,
        meta: { pendingCount: count },
      })
    )
  );
}

export async function notifyOrderApproved(doc: QuotationNotifyDoc): Promise<void> {
  const label = orderLabel(doc);
  await notifyAdminsOrderEvent(
    "order_approved",
    "Order Approved",
    `Order ${label} has been approved and is ready for dispatch.`,
    {
      quotationId: String(doc._id),
      voucherNo: str(doc.voucherNo),
      partyName: str(doc.partyName),
    }
  );
}

export async function notifyOrderCancelled(
  doc: QuotationNotifyDoc,
  cancelledBy?: string
): Promise<void> {
  const label = orderLabel(doc);
  const who = cancelledBy ? ` by ${cancelledBy}` : "";
  await notifyAdminsOrderEvent(
    "order_cancelled",
    "Order Cancelled",
    `Order ${label} was cancelled${who}.`,
    {
      quotationId: String(doc._id),
      voucherNo: str(doc.voucherNo),
      partyName: str(doc.partyName),
    }
  );
}

export async function notifyOrderDispatched(
  doc: QuotationNotifyDoc,
  via?: string
): Promise<void> {
  const label = orderLabel(doc);
  const transport = str(via || doc.transportDetails);
  const viaPart = transport ? ` via ${transport}` : "";
  await notifyAdminsOrderEvent(
    "order_dispatched",
    "Order Dispatched",
    `Order ${label} has been dispatched${viaPart}.`,
    {
      quotationId: String(doc._id),
      voucherNo: str(doc.voucherNo),
      partyName: str(doc.partyName),
      transportDetails: transport,
    }
  );
}

export async function notifyOrderInvoiceGenerated(input: {
  quotationId: string;
  orderVoucherNo: string;
  invoiceNo: string;
  partyName?: string;
}): Promise<void> {
  const orderNo = str(input.orderVoucherNo) || "—";
  const inv = str(input.invoiceNo) || "—";
  await notifyAdminsOrderEvent(
    "order_invoice_generated",
    "Invoice Generated",
    `Invoice ${inv} generated for order #${orderNo.replace(/^#/, "")}.`,
    {
      quotationId: input.quotationId,
      voucherNo: orderNo,
      invoiceNo: inv,
      partyName: str(input.partyName),
    }
  );
}

export async function notifyOrderReturned(doc: QuotationNotifyDoc): Promise<void> {
  const label = orderLabel(doc);
  await notifyAdminsOrderEvent(
    "order_returned",
    "Order Returned",
    `Return request received for order ${label}.`,
    {
      quotationId: String(doc._id),
      voucherNo: str(doc.voucherNo),
      partyName: str(doc.partyName),
    }
  );
}

/** Compare quotation before/after update and emit order notifications. */
export async function handleQuotationOrderNotifications(
  before: QuotationNotifyDoc | null,
  after: QuotationNotifyDoc
): Promise<void> {
  const wasOnList =
    before?.addedToOrder === true ||
    String(before?.addedToOrder).toLowerCase() === "true";
  const isOnList =
    after.addedToOrder === true ||
    String(after.addedToOrder).toLowerCase() === "true";

  if (!isOnList) return;

  const prevStatus = str(before?.dashboardOrderStatus, "Pending");
  const nextStatus = str(after.dashboardOrderStatus, "Pending");

  if (!wasOnList && isOnList) {
    await notifyOrderNew(after);
    if (nextStatus === "Pending") {
      await notifyOrderPendingSummary();
    }
    return;
  }

  if (prevStatus === nextStatus) return;

  switch (nextStatus) {
    case "Approved":
      await notifyOrderApproved(after);
      break;
    case "Cancelled":
      await notifyOrderCancelled(after);
      break;
    case "Dispatched":
      await notifyOrderDispatched(after);
      break;
    case "Return":
      await notifyOrderReturned(after);
      break;
    case "Pending":
      await notifyOrderPendingSummary();
      break;
    default:
      break;
  }
}
