import {
  Bell,
  CheckCircle2,
  Clock3,
  FileText,
  Package,
  Receipt,
  RotateCcw,
  Truck,
  XCircle,
} from "lucide-react";

/** Icon component for in-app notification list rows. */
export function notificationIconForType(type) {
  switch (String(type || "")) {
    case "order_new":
      return FileText;
    case "order_pending":
      return Clock3;
    case "order_approved":
      return CheckCircle2;
    case "order_cancelled":
      return XCircle;
    case "order_dispatched":
      return Truck;
    case "order_invoice_generated":
      return Receipt;
    case "order_returned":
      return RotateCcw;
    case "product_low_stock":
      return Package;
    default:
      return Bell;
  }
}
