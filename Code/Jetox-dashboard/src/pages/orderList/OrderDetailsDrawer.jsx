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
      <aside className="relative h-full w-full max-w-xl bg-white shadow-2xl flex flex-col">
        <header className="flex items-center justify-between px-4 py-3 border-b border-light-border bg-headBg shrink-0">
          <div>
            <div className="text-lg font-semibold text-dark">
              {row["Order ID"]} — Order Details
            </div>
            {d.createdAt && (
              <div className="text-xs text-light mt-0.5">Created At: {d.createdAt}</div>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 text-light"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 text-sm">
          <div className="flex flex-wrap gap-3">
            {d.paymentStatus && (
              <span className="px-3 py-1 rounded-full bg-primary text-white text-xs font-medium">
                {d.paymentStatus}
              </span>
            )}
            {d.orderStatus && (
              <span className="px-3 py-1 rounded-md text-xs font-medium text-blue border border-blue/30">
                {d.orderStatus}
              </span>
            )}
          </div>

          <section>
            <h3 className="text-xs font-semibold text-light uppercase tracking-wide mb-2">
              Manager Details
            </h3>
            <div className="space-y-1 text-dark">
              <div>
                <span className="text-light">Full Name: </span>
                {mgr.fullName || row["Manager Name"]}
              </div>
              {mgr.region && (
                <div>
                  <span className="text-light">Region: </span>
                  {mgr.region}
                </div>
              )}
              {mgr.area && (
                <div>
                  <span className="text-light">Area: </span>
                  {mgr.area}
                </div>
              )}
            </div>
          </section>

          <hr className="border-light-border" />

          <section>
            <h3 className="text-xs font-semibold text-light uppercase tracking-wide mb-2">
              Client Details
            </h3>
            <div className="space-y-1 text-dark">
              <div>
                <span className="text-light">Full Name: </span>
                {client.fullName || row["Client Name"]}
              </div>
              {client.phone && (
                <div>
                  <span className="text-light">Phone: </span>
                  {client.phone}
                </div>
              )}
              {client.email && (
                <div>
                  <span className="text-light">Email: </span>
                  {client.email}
                </div>
              )}
              {client.shippingAddress && (
                <div className="pt-1">
                  <span className="text-light block mb-0.5">Shipping Address</span>
                  {client.shippingAddress}
                </div>
              )}
            </div>
          </section>

          <hr className="border-light-border" />

          {products.length > 0 && (
            <section>
              <h3 className="text-xs font-semibold text-light uppercase tracking-wide mb-2">
                Product Details
              </h3>
              <div className="border border-light-border rounded-lg overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-headBg text-light">
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
                      <tr className="bg-rowBg font-semibold">
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
            <section>
              <h3 className="text-xs font-semibold text-light uppercase tracking-wide mb-1">
                Dispatch Details
              </h3>
              <div className="text-primary font-medium">{dispatch.status}</div>
            </section>
          )}

          {delivery.trackingNumber && (
            <section>
              <h3 className="text-xs font-semibold text-light uppercase tracking-wide mb-2">
                Delivery Details
              </h3>
              <div className="space-y-1">
                <div>
                  <span className="text-light">Tracking: </span>
                  <button
                    type="button"
                    className="text-blue font-medium hover:underline"
                  >
                    {delivery.trackingNumber}
                  </button>
                </div>
                {delivery.courier && (
                  <div>
                    <span className="text-light">Courier / Person: </span>
                    {delivery.courier}
                  </div>
                )}
              </div>
            </section>
          )}

          {pay.grandTotal && (
            <section className="bg-rowBg rounded-xl p-4 space-y-2">
              <h3 className="text-xs font-semibold text-light uppercase tracking-wide">
                Payment Details
              </h3>
              {pay.subTotal && (
                <div className="flex justify-between">
                  <span className="text-light">Sub Total</span>
                  <span>{pay.subTotal}</span>
                </div>
              )}
              {pay.tax && (
                <div className="flex justify-between">
                  <span className="text-light">Tax</span>
                  <span>{pay.tax}</span>
                </div>
              )}
              {pay.discount && (
                <div className="flex justify-between">
                  <span className="text-light">Discount</span>
                  <span>{pay.discount}</span>
                </div>
              )}
              {pay.mode && (
                <div className="flex justify-between">
                  <span className="text-light">Payment Mode</span>
                  <span>{pay.mode}</span>
                </div>
              )}
              {pay.transactionId && (
                <div className="flex justify-between items-center">
                  <span className="text-light">Transaction ID</span>
                  <span className="font-mono text-xs" title={pay.transactionId}>
                    {pay.transactionId}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold pt-2 border-t border-light-border">
                <span>Grand Total</span>
                <span>{pay.grandTotal}</span>
              </div>
            </section>
          )}
        </div>

        <footer className="p-4 border-t border-light-border flex flex-col gap-2 shrink-0 bg-white">
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
              className="flex-1 rounded-lg bg-dark text-white py-2 text-sm font-medium hover:opacity-90"
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
        </footer>
      </aside>
    </div>
  );
}
