import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { X } from "lucide-react";
import { Button, CommonDropdown } from "../../components/ui/CommanUI";
import {
  orderStatusBadgeClasses,
  paymentStatusBadgeClasses,
} from "../../utils/tableUi";
import {
  ORDER_STATUS_OPTIONS,
  normalizeOrderStatus,
} from "../../constants/orderStatus";
import { quotationsApi } from "../../services/api";
import { getApiErrorMessage } from "../../utils/apiError";

export default function OrderDetailsDrawer({
  open,
  onClose,
  row,
  detail,
  invoice,
  onOrderStatusUpdated,
}) {
  const navigate = useNavigate();
  const [orderStatusValue, setOrderStatusValue] = useState("Pending");
  const [statusSaving, setStatusSaving] = useState(false);

  const orderId = row?._id || row?.["Order ID"];
  const displayStatus =
    normalizeOrderStatus(detail?.orderStatus || row?.["Order Status"]) ||
    "Pending";

  useEffect(() => {
    if (!open) return;
    setOrderStatusValue(displayStatus);
  }, [open, displayStatus]);

  if (!open || !row) return null;

  const d = detail || {};
  const mgr = d.manager || {};
  const client = d.client || {};
  const products = d.products || [];
  const fulfillment = d.fulfillment;
  const pay = d.payment || {};
  const delivery = d.delivery || {};

  const handleOrderStatusChange = async (next) => {
    const value = normalizeOrderStatus(next);
    if (!value || !orderId) {
      toast.error("This order has no id — cannot update status.");
      return;
    }
    if (value === orderStatusValue) return;
    setStatusSaving(true);
    try {
      await quotationsApi.setOrderStatus(String(orderId), value);
      setOrderStatusValue(value);
      toast.success(`Order status updated to ${value}`);
      onOrderStatusUpdated?.(value);
    } catch (e) {
      toast.error(getApiErrorMessage(e, "Could not update order status"));
    } finally {
      setStatusSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex justify-end">
      <button
        type="button"
        className="absolute inset-0 bg-black/30"
        aria-label="Close overlay"
        onClick={onClose}
      />
      <aside className="relative flex h-full w-full max-w-xl flex-col bg-white shadow-2xl dark:bg-slate-900">
        <header className="flex shrink-0 items-start justify-between gap-3 border-b border-light-border bg-headBg px-4 py-3 dark:border-slate-700 dark:bg-slate-800/80">
          <div className="min-w-0">
            <div className="text-lg font-bold tracking-tight text-dark dark:text-slate-100">
              {row["Order ID"]} — Order Details
            </div>
            {d.createdAt && (
              <div className="mt-0.5 text-xs text-light dark:text-slate-400">Created At: {d.createdAt}</div>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-light hover:bg-gray-100 dark:text-slate-400 dark:hover:bg-slate-700"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </header>

        <div className="flex-1 space-y-5 overflow-y-auto bg-slate-50/60 px-4 py-4 text-sm dark:bg-slate-950/30">
          <div className="flex flex-wrap gap-4 sm:gap-6">
            {d.paymentStatus ? (
              <div className="flex min-w-[7.5rem] flex-col gap-1">
                <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
                  Payment Status
                </span>
                <span
                  className={`inline-flex w-fit items-center rounded-full px-3 py-1 text-xs font-semibold ${paymentStatusBadgeClasses(d.paymentStatus)}`}
                >
                  {d.paymentStatus}
                </span>
              </div>
            ) : null}
            <div className="flex min-w-[10rem] flex-1 flex-col gap-1.5 sm:max-w-xs">
              <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
                Order Status
              </span>
              <CommonDropdown
                formCompact
                placeholder="Select status"
                value={orderStatusValue}
                onChange={handleOrderStatusChange}
                options={ORDER_STATUS_OPTIONS}
                disabled={statusSaving}
              />
              <span
                className={`inline-flex w-fit items-center rounded-full px-3 py-1 text-xs font-semibold ${orderStatusBadgeClasses(orderStatusValue)}`}
              >
                {orderStatusValue}
              </span>
            </div>
          </div>

          <section className="rounded-xl border border-light-border bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <h3 className="mb-2 text-base font-bold text-slate-900 dark:text-slate-100">
              Manager Details
            </h3>
            <div className="space-y-1.5 text-dark dark:text-slate-100">
              <div>
                <span className="font-medium text-light dark:text-slate-400">Full Name: </span>
                {mgr.fullName || row["Manager Name"]}
              </div>
              {mgr.region && (
                <div>
                  <span className="font-medium text-light dark:text-slate-400">Region: </span>
                  {mgr.region}
                </div>
              )}
              {mgr.area && (
                <div>
                  <span className="font-medium text-light dark:text-slate-400">Area: </span>
                  {mgr.area}
                </div>
              )}
            </div>
          </section>

          <section className="rounded-xl border border-light-border bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <h3 className="mb-2 text-base font-bold text-slate-900 dark:text-slate-100">
              Client Details
            </h3>
            <div className="space-y-1.5 text-dark dark:text-slate-100">
              <div>
                <span className="font-medium text-light dark:text-slate-400">Full Name: </span>
                {client.fullName || row["Client Name"]}
              </div>
              {client.phone && (
                <div>
                  <span className="font-medium text-light dark:text-slate-400">Phone: </span>
                  {client.phone}
                </div>
              )}
              {client.email && (
                <div>
                  <span className="font-medium text-light dark:text-slate-400">Email: </span>
                  {client.email}
                </div>
              )}
              {client.shippingAddress && (
                <div className="pt-1">
                  <span className="mb-0.5 block font-medium text-light dark:text-slate-400">Shipping Address</span>
                  {client.shippingAddress}
                </div>
              )}
            </div>
          </section>

          {fulfillment?.lines?.length > 0 && (
            <section className="rounded-xl border border-light-border bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <h3 className="mb-2 text-base font-bold text-slate-900 dark:text-slate-100">
                Sold / returned (net)
              </h3>
              {fulfillment.salesVoucherNo ? (
                <p className="mb-2 text-xs text-slate-500 dark:text-slate-400">
                  Sales voucher: {fulfillment.salesVoucherNo}
                </p>
              ) : null}
              <div className="overflow-hidden rounded-lg border border-light-border dark:border-slate-700">
                <table className="w-full text-xs">
                  <thead className="bg-headBg text-light dark:bg-slate-800 dark:text-slate-300">
                    <tr>
                      <th className="px-2 py-2 text-left">Product</th>
                      <th className="px-2 py-2 text-right">Sold</th>
                      <th className="px-2 py-2 text-right">Returned</th>
                      <th className="px-2 py-2 text-right">Net</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fulfillment.lines.map((ln) => (
                      <tr
                        key={ln.productId}
                        className="border-t border-light-border dark:border-slate-700"
                      >
                        <td className="px-2 py-2">{ln.name}</td>
                        <td className="px-2 py-2 text-right tabular-nums">{ln.soldQty}</td>
                        <td className="px-2 py-2 text-right tabular-nums">{ln.returnedQty}</td>
                        <td className="px-2 py-2 text-right tabular-nums font-medium">
                          {ln.netQty}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {fulfillment.returns?.length > 0 ? (
                <ul className="mt-2 space-y-1 text-xs text-slate-600 dark:text-slate-400">
                  {fulfillment.returns.map((r) => (
                    <li key={r.id}>
                      Return {r.voucherNo} — {r.status}
                    </li>
                  ))}
                </ul>
              ) : null}
            </section>
          )}

          {products.length > 0 && (
            <section className="rounded-xl border border-light-border bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <h3 className="mb-2 text-base font-bold text-slate-900 dark:text-slate-100">
                Product Details (order)
              </h3>
              <div className="overflow-hidden rounded-lg border border-light-border dark:border-slate-700">
                <table className="w-full text-xs">
                  <thead className="bg-headBg text-light dark:bg-slate-800 dark:text-slate-300">
                    <tr>
                      <th className="px-3 py-2 text-left">Product</th>
                      <th className="px-3 py-2">QTY</th>
                      <th className="px-3 py-2">Rate (₹)</th>
                      <th className="px-3 py-2">GST (₹)</th>
                      <th className="px-3 py-2">Subtotal (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((p, i) => (
                      <tr key={i} className="border-t border-light-border">
                        <td className="px-3 py-2 text-left">{p.name}</td>
                        <td className="px-3 py-2">{p.qty}</td>
                        <td className="px-3 py-2">{p.rate}</td>
                        <td className="px-3 py-2">{p.gst ?? "—"}</td>
                        <td className="px-3 py-2">{p.subtotal}</td>
                      </tr>
                    ))}
                  </tbody>
                  {d.productsTotal && (
                    <tfoot>
                      <tr className="bg-rowBg font-semibold dark:bg-slate-800/80">
                        <td colSpan={4} className="px-3 py-2 text-right align-middle">
                          Total
                        </td>
                        <td className="px-3 py-2 text-right align-middle tabular-nums">
                          {d.productsTotal}
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </section>
          )}

          {delivery.trackingNumber && delivery.trackingNumber !== "—" ? (
            <section className="rounded-xl border border-light-border bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <h3 className="mb-2 text-base font-bold text-slate-900 dark:text-slate-100">
                Delivery Details
              </h3>
              <div className="space-y-1.5 dark:text-slate-200">
                <div>
                  <span className="font-medium text-light dark:text-slate-400">Tracking: </span>
                  <button
                    type="button"
                    className="text-blue font-medium hover:underline"
                  >
                    {delivery.trackingNumber}
                  </button>
                </div>
                {delivery.courier && (
                  <div>
                    <span className="font-medium text-light dark:text-slate-400">Courier / Person: </span>
                    {delivery.courier}
                  </div>
                )}
              </div>
            </section>
          ) : null}

          {(pay.grandTotal || pay.totalAmount || pay.termsOfPayment) && (
            <section className="space-y-2 rounded-xl border border-light-border bg-rowBg p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800/80">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Payment Details
              </h3>
              {pay.termsOfPayment && pay.termsOfPayment !== "—" ? (
                <div className="flex justify-between gap-4 border-b border-light-border/80 pb-2 dark:border-slate-600">
                  <span className="text-light dark:text-slate-400">Terms of Payment</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                    {pay.termsOfPayment}
                  </span>
                </div>
              ) : null}
              {pay.dueKind === "refund" && pay.due && pay.due !== "—" ? (
                <div className="rounded-lg border border-amber-300/80 bg-amber-50 px-3 py-2 text-sm text-amber-950 dark:border-amber-700/60 dark:bg-amber-950/40 dark:text-amber-100">
                  Refund{" "}
                  <span className="font-semibold tabular-nums">{pay.due}</span>{" "}
                  to the customer (return reduced what you keep). Post refund from
                  the Sales Return list.
                </div>
              ) : null}
              {[
                { label: "Total Amount", value: pay.totalAmount || pay.grandTotal },
                pay.returnedAmount && pay.returnedAmount !== "—"
                  ? { label: "Return amount", value: pay.returnedAmount }
                  : null,
                pay.refundDue && pay.refundDue !== "—"
                  ? { label: "Refund due", value: pay.refundDue }
                  : null,
                pay.refunded && pay.refunded !== "—"
                  ? { label: "Refunded (paid back)", value: pay.refunded }
                  : null,
                pay.netReceivable
                  ? { label: "Net receivable", value: pay.netReceivable }
                  : null,
                { label: pay.taxLabel || "Tax", value: pay.tax },
                { label: "Discount", value: pay.discount ?? "₹0" },
                pay.paidReceived && pay.paidReceived !== pay.paid
                  ? {
                      label: "Received from customer",
                      value: pay.paidReceived,
                    }
                  : null,
                { label: "Net collected (after return)", value: pay.paid },
                {
                  label:
                    pay.dueKind === "refund"
                      ? "Refund due to customer"
                      : "Outstanding Due",
                  value: pay.due,
                },
                { label: "Payment Mode", value: pay.mode || pay.paymentMode },
                pay.dueDate
                  ? { label: "Due Date", value: pay.dueDate }
                  : null,
                {
                  label: "Transaction ID",
                  value: pay.transactionId,
                  mono: true,
                },
                {
                  label: "Final Payable",
                  value: pay.finalPayable || pay.grandTotal,
                  bold: true,
                },
              ]
                .filter(
                  (item) =>
                    item &&
                    item.value != null &&
                    String(item.value).trim() !== "" &&
                    item.value !== "—"
                )
                .map((item) => (
                  <div
                    key={item.label}
                    className={`flex justify-between gap-4 dark:text-slate-100 ${
                      item.bold
                        ? "border-t border-light-border pt-2 text-base font-bold dark:border-slate-700"
                        : "border-b border-light-border/80 pb-2 last:border-0 dark:border-slate-600/80"
                    }`}
                  >
                    <span className="text-light dark:text-slate-400">{item.label}</span>
                    <span
                      className={
                        item.mono
                          ? "max-w-[55%] truncate font-mono text-xs font-semibold tabular-nums"
                          : "font-semibold tabular-nums"
                      }
                      title={item.mono ? String(item.value) : undefined}
                    >
                      {item.value}
                    </span>
                  </div>
                ))}
            </section>
          )}
        </div>

        <footer className="shrink-0 border-t border-light-border bg-headBg/70 p-4 shadow-[0_-4px_12px_rgba(15,23,42,0.05)] dark:border-slate-700 dark:bg-slate-900/95 dark:shadow-[0_-4px_14px_rgba(0,0,0,0.35)]">
          <div className="flex gap-3">
            <Button
              label="Edit"
              variant="outline"
              className="flex-1"
              onClick={() => {
                navigate("/dashboard/order-list/invoice", {
                  state: {
                    invoice,
                    orderId: row?.["Order ID"],
                    paymentStatus: d.paymentStatus,
                    paymentMode: pay?.paymentMode || pay?.mode || invoice?.paymentMode,
                  },
                });
                onClose?.();
              }}
            />
            <button
              type="button"
              className="flex-1 rounded-lg border border-primary bg-primary py-2 text-sm font-medium text-white hover:bg-primary/90 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
              onClick={() => {
                if (!invoice) {
                  toast.error("No invoice data for this order");
                  return;
                }
                navigate("/dashboard/order-list/invoice", {
                  state: {
                    invoice,
                    orderId: row?.["Order ID"],
                    paymentStatus: d.paymentStatus,
                    paymentMode: pay?.paymentMode || pay?.mode || invoice?.paymentMode,
                  },
                });
                onClose?.();
              }}
            >
              Generate Invoice
            </button>
          </div>
        </footer>
      </aside>
    </div>
  );
}
