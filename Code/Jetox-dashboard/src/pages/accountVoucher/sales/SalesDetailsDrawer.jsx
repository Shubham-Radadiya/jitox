import React from "react";
import OrderDetailsDrawer from "../../orderList/OrderDetailsDrawer";

/**
 * Sales voucher view drawer — reuses the dashboard / order-list
 * `OrderDetailsDrawer` so the UI stays in lockstep.
 *
 * Adapts `{ open, onClose, data }` into `row` / `detail` / `invoice` props.
 * `data` is produced by `salesDocToOrderDetailShape` in `utils/voucherRowMappers.js`.
 */
export default function SalesDetailsDrawer({ open, onClose, data }) {
  if (!open || !data) return null;

  const headingId = data.voucherNo || data.invoiceNo || "—";
  const invoiceData = data.invoice;

  const row = {
    "Order ID": headingId,
    "Manager Name": data.manager?.fullName || "",
    "Client Name": data.client?.fullName || "",
  };

  return (
    <OrderDetailsDrawer
      open={open}
      onClose={onClose}
      row={row}
      detail={data}
      invoice={invoiceData}
    />
  );
}
