import React from "react";
import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";
import { Button } from "../../components/ui/CommanUI";

export default function OrderDetailsDrawer({
  open,
  onClose,
  row,
  detail,
  invoice,
  onGenerateInvoice,
}) {
  const navigate = useNavigate();
  if (!open || !row) return null;

  const d = detail || {};
  const mgr = d.manager || {};
  const client = d.client || {};
  const products = d.products || [];
  const pay = d.payment || {};
  const dispatch = d.dispatch || {};
  const delivery = d.delivery || {};

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
          <div className="flex flex-wrap gap-3">
            {d.paymentStatus && (
              <span className="rounded-full border border-emerald-300/80 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:border-emerald-700/60 dark:bg-emerald-950/35 dark:text-emerald-300">
                {d.paymentStatus}
              </span>
            )}
            {d.orderStatus && (
              <span className="rounded-full border border-sky-300/80 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700 dark:border-sky-700/60 dark:bg-sky-950/35 dark:text-sky-300">
                {d.orderStatus}
              </span>
            )}
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

          {products.length > 0 && (
            <section className="rounded-xl border border-light-border bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <h3 className="mb-2 text-base font-bold text-slate-900 dark:text-slate-100">
                Product Details
              </h3>
              <div className="overflow-hidden rounded-lg border border-light-border dark:border-slate-700">
                <table className="w-full text-xs">
                  <thead className="bg-headBg text-light dark:bg-slate-800 dark:text-slate-300">
                    <tr>
                      <th className="px-3 py-2 text-left">Product</th>
                      <th className="px-3 py-2">QTY</th>
                      <th className="px-3 py-2">Rate (₹)</th>
                      <th className="px-3 py-2">Subtotal (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((p, i) => (
                      <tr key={i} className="border-t border-light-border">
                        <td className="px-3 py-2 text-left">{p.name}</td>
                        <td className="px-3 py-2">{p.qty}</td>
                        <td className="px-3 py-2">{p.rate}</td>
                        <td className="px-3 py-2">{p.subtotal}</td>
                      </tr>
                    ))}
                  </tbody>
                  {d.productsTotal && (
                    <tfoot>
                      <tr className="bg-rowBg font-semibold dark:bg-slate-800/80">
                        <td colSpan={3} className="px-3 py-2 text-right align-middle">
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

          {dispatch.status && (
            <section className="rounded-xl border border-light-border bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <h3 className="mb-1 text-base font-bold text-slate-900 dark:text-slate-100">
                Dispatch Details
              </h3>
              <div className="font-medium text-primary">{dispatch.status}</div>
            </section>
          )}

          {delivery.trackingNumber && (
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
          )}

          {pay.grandTotal && (
            <section className="space-y-2 rounded-xl border border-light-border bg-rowBg p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800/80">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Payment Details
              </h3>
              {pay.subTotal && (
                <div className="flex justify-between dark:text-slate-100">
                  <span className="text-light dark:text-slate-400">Sub Total</span>
                  <span>{pay.subTotal}</span>
                </div>
              )}
              {pay.tax && (
                <div className="flex justify-between dark:text-slate-100">
                  <span className="text-light dark:text-slate-400">Tax</span>
                  <span>{pay.tax}</span>
                </div>
              )}
              {pay.discount && (
                <div className="flex justify-between dark:text-slate-100">
                  <span className="text-light dark:text-slate-400">Discount</span>
                  <span>{pay.discount}</span>
                </div>
              )}
              {pay.mode && (
                <div className="flex justify-between dark:text-slate-100">
                  <span className="text-light dark:text-slate-400">Payment Mode</span>
                  <span>{pay.mode}</span>
                </div>
              )}
              {pay.transactionId && (
                <div className="flex items-center justify-between dark:text-slate-100">
                  <span className="text-light dark:text-slate-400">Transaction ID</span>
                  <span className="font-mono text-xs" title={pay.transactionId}>
                    {pay.transactionId}
                  </span>
                </div>
              )}
              <div className="flex justify-between border-t border-light-border pt-2 text-base font-bold dark:border-slate-700 dark:text-slate-100">
                <span>Grand Total</span>
                <span>{pay.grandTotal}</span>
              </div>
            </section>
          )}
        </div>

        <footer className="shrink-0 border-t border-light-border bg-headBg/70 p-4 shadow-[0_-4px_12px_rgba(15,23,42,0.05)] dark:border-slate-700 dark:bg-slate-900/95 dark:shadow-[0_-4px_14px_rgba(0,0,0,0.35)]">
          <div className="flex flex-col gap-2">
          <div className="flex gap-3">
            <Button
              label="Edit"
              variant="outline"
              className="flex-1"
              onClick={() => {
                navigate("/dashboard/order-list/invoice", {
                  state: { invoice, orderId: row?.["Order ID"] },
                });
                onClose?.();
              }}
            />
            <button
              type="button"
              className="flex-1 rounded-lg border border-primary bg-primary py-2 text-sm font-medium text-white hover:bg-primary/90 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
              onClick={onGenerateInvoice}
            >
              Generate Invoice
            </button>
          </div>
          <Button
            label="Open invoice workspace"
            variant="ghost"
            className="w-full text-xs"
            onClick={() => {
              navigate("/dashboard/order-list/invoice", {
                state: { invoice, orderId: row?.["Order ID"] },
              });
              onClose?.();
            }}
          />
          </div>
        </footer>
      </aside>
    </div>
  );
}
