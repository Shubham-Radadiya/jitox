import React, { useState } from "react";
import toast from "react-hot-toast";
import OrderDetailsDrawer from "../../orderList/OrderDetailsDrawer";
import InvoiceModal from "../../orderList/InvoiceModal";

/**
 * Sales voucher view drawer — reuses the dashboard / order-list
 * `OrderDetailsDrawer` (so the UI stays in lockstep) and owns the
 * `InvoiceModal` so the "Generate Invoice" button works without any
 * additional wiring from `VoucherPage`.
 *
 * Adapts our `{ open, onClose, data }` voucher-page contract into the
 * `row` / `detail` / `invoice` / `onGenerateInvoice` props expected by
 * `OrderDetailsDrawer`. `data` is produced by `salesDocToOrderDetailShape`
 * in `utils/voucherRowMappers.js`, which already includes an `invoice`
 * sub-payload matching `InvoiceModal`'s expected shape.
 */
export default function SalesDetailsDrawer({
  open,
  onClose,
  data,
  onGenerateInvoice,
}) {
  const [invoiceOpen, setInvoiceOpen] = useState(false);

  if (!open || !data) return null;

  const headingId = data.voucherNo || data.invoiceNo || "—";
  const invoiceData = data.invoice;

  /**
   * `OrderDetailsDrawer` only reads three keys off `row`:
   *   - "Order ID"     → header title
   *   - "Manager Name" → Manager fallback
   *   - "Client Name"  → Client fallback
   */
  const row = {
    "Order ID": headingId,
    "Manager Name": data.manager?.fullName || "",
    "Client Name": data.client?.fullName || "",
  };

  const handleGenerateInvoice = () => {
    if (onGenerateInvoice) {
      onGenerateInvoice(data);
      return;
    }
    if (!invoiceData) {
      toast.error("No invoice data for this voucher");
      return;
    }
    setInvoiceOpen(true);
  };

  return (
    <>
      <OrderDetailsDrawer
        open={open}
        onClose={onClose}
        row={row}
        detail={data}
        invoice={invoiceData}
        onGenerateInvoice={handleGenerateInvoice}
      />
      <InvoiceModal
        open={invoiceOpen}
        onClose={() => setInvoiceOpen(false)}
        invoice={invoiceData}
      />
    </>
  );
}
