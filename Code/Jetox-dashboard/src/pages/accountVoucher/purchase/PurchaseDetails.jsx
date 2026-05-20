import React from "react";
import toast from "react-hot-toast";
import { X, FileSpreadsheet, Printer, Share2 } from "lucide-react";
import { useLocation } from "react-router-dom";
import {
  buildPurchaseDetailShareText,
  downloadPurchaseDetailCsv,
  downloadPurchaseDetailBillPdf,
  shareOrCopyText,
} from "../../../utils/voucherShare";
import { paymentStatusBadgeClasses } from "../../../utils/tableUi";

const PurchaseDetails = ({ open, onClose, data }) => {
  const { pathname = "" } = useLocation();
  if (!open || !data) return null;
  const isPurchaseReturn =
    data.isPurchaseReturn === true ||
    String(pathname).includes("purchase-return");

  const {
    voucherNo,
    status,
    paymentTerms,
    purchaseDate,
    customer,
    party,
    products,
    totals,
  } = data;

  return (
    <div className="fixed inset-0 z-[1000] flex justify-end">
      <div
        className="absolute inset-0 bg-black/25 transition-opacity dark:bg-black/65"
        onClick={onClose}
        aria-hidden="true"
      />
      <aside className="relative flex h-full w-full max-w-xl flex-col border-l border-slate-200/90 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900 dark:shadow-black/40">
        {/* Header */}
        <header className="flex shrink-0 items-center justify-between border-b border-slate-200/90 bg-gradient-to-r from-slate-50 to-white px-4 py-3.5 dark:border-slate-700 dark:from-slate-800 dark:to-slate-900">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-primary dark:text-emerald-400">
              {isPurchaseReturn ? "Purchase Return Details" : "Purchase Details"}
            </p>
            <div className="truncate text-lg font-bold tracking-tight text-slate-900 dark:text-slate-50">
              {voucherNo}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg p-2 text-slate-500 transition hover:bg-slate-200/90 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-white"
            aria-label="Close"
          >
            <X size={20} strokeWidth={2} />
          </button>
        </header>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4">
          {/* Purchase Date & Status */}
          <section className="rounded-xl border border-slate-200/90 bg-slate-50/80 p-4 shadow-sm ring-1 ring-slate-900/[0.03] dark:border-slate-700 dark:bg-slate-800/40 dark:ring-white/5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Purchase Date
                </div>
                <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {purchaseDate}
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  {isPurchaseReturn ? "Refund / Received Status" : "Payment Status"}
                </div>
                <span className={paymentStatusBadgeClasses(status)}>
                  {status}
                </span>
              </div>
              {(pathname === "/dashboard/accounting-voucher/sales" ||
                pathname === "/sales-return") && (
                <div className="flex flex-col gap-1">
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Status
                  </div>
                  <span className="inline-flex items-center rounded-md bg-primary px-3 py-1 text-xs font-semibold text-white shadow-sm dark:shadow-none">
                    {status}
                  </span>
                </div>
              )}
            </div>
          </section>

          {customer && customer.length > 0 ? (
            <InfoSection title="Customer Details" rows={customer} />
          ) : null}
          {party && party.length > 0 ? (
            <InfoSection title="Party Details" rows={party} />
          ) : null}

          {/* Product table */}
          <section className="flex flex-col gap-2">
            <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Product Details
            </div>
            <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-600">
              <div className="max-h-[min(40vh,22rem)] overflow-auto">
                <table className="w-full min-w-[420px] text-sm">
                  <thead className="sticky top-0 z-[1] bg-slate-100 text-xs dark:bg-slate-800">
                    <tr className="border-b border-slate-200 dark:border-slate-600">
                      <th className="px-3 py-2.5 text-left font-semibold text-slate-700 dark:text-slate-200">
                        Product Name ({products.length})
                      </th>
                      <th className="px-3 py-2.5 text-right font-semibold text-slate-700 dark:text-slate-200">
                        Qty
                      </th>
                      <th className="px-3 py-2.5 text-right font-semibold text-slate-700 dark:text-slate-200">
                        Rate (₹)
                      </th>
                      <th className="px-3 py-2.5 text-right font-semibold text-slate-700 dark:text-slate-200">
                        GST (₹)
                      </th>
                      <th className="px-3 py-2.5 text-right font-semibold text-slate-700 dark:text-slate-200">
                        Subtotal (₹)
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((item, i) => (
                      <tr
                        key={`${item.name}-${i}`}
                        className="border-t border-slate-100 dark:border-slate-700/80"
                      >
                        <td className="border-r border-slate-100 px-3 py-2 text-slate-800 dark:border-slate-700 dark:text-slate-200">
                          {item.name}
                        </td>
                        <td className="border-r border-slate-100 px-3 py-2 text-right tabular-nums text-slate-700 dark:border-slate-700 dark:text-slate-300">
                          {item.qty}
                        </td>
                        <td className="border-r border-slate-100 px-3 py-2 text-right tabular-nums text-slate-700 dark:border-slate-700 dark:text-slate-300">
                          {item.rate}
                        </td>
                        <td className="border-r border-slate-100 px-3 py-2 text-right tabular-nums text-slate-700 dark:border-slate-700 dark:text-slate-300">
                          {item.gst}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums font-medium text-slate-900 dark:text-slate-100">
                          {item.subtotal}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-slate-200 bg-slate-50 dark:border-slate-600 dark:bg-slate-800/90">
                      <td className="px-3 py-2.5 align-middle text-left text-sm font-bold text-slate-900 dark:text-slate-50">
                        Total
                      </td>
                      <td className="px-3 py-2.5" />
                      <td className="px-3 py-2.5" />
                      <td className="px-3 py-2.5" />
                      <td className="border-l border-slate-200 px-3 py-2.5 text-right text-sm font-bold tabular-nums text-primary dark:border-slate-600 dark:text-emerald-400">
                        {totals.totalAmount}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </section>

          {/* Payment */}
          <section className="rounded-xl border border-slate-200/90 bg-slate-50/80 p-4 dark:border-slate-700 dark:bg-slate-800/40">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Payment Details
              </div>
              {totals.reference && (
                <a
                  href="#"
                  className="text-sm font-semibold text-primary underline-offset-2 hover:underline dark:text-emerald-400"
                  onClick={(e) => e.preventDefault()}
                >
                  {totals.reference}
                </a>
              )}
            </div>

            <div className="flex flex-col gap-2">
              {paymentTerms && paymentTerms !== "—" ? (
                <div className="flex items-center justify-between gap-4 border-b border-slate-200/70 pb-2 text-sm dark:border-slate-600/80">
                  <span className="font-medium text-slate-600 dark:text-slate-400">
                    Terms of Payment
                  </span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                    {paymentTerms}
                  </span>
                </div>
              ) : null}
              {[
                { label: "Total Amount", value: totals.totalAmount },
                {
                  label: totals.taxLabel || "Tax",
                  value: totals.tax,
                },
                { label: "Discount", value: totals.discount ?? "₹0" },
                {
                  label: isPurchaseReturn ? "Received Amount" : "Paid Amount",
                  value: totals.paid,
                },
                {
                  label: isPurchaseReturn ? "Refund Due" : "Outstanding Due",
                  value: totals.due,
                },
                { label: "Final Payable", value: totals.finalPayable },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between gap-4 border-b border-slate-200/70 pb-2 text-sm last:border-0 last:pb-0 dark:border-slate-600/80"
                >
                  <span className="font-medium text-slate-600 dark:text-slate-400">
                    {item.label}
                  </span>
                  <span className="font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Footer — share & exports */}
        <footer className="grid shrink-0 grid-cols-3 divide-x divide-slate-200 border-t border-slate-200 bg-slate-50 dark:divide-slate-600 dark:border-slate-700 dark:bg-slate-800/95">
          <button
            type="button"
            className="flex flex-col items-center justify-center gap-1 py-3 text-xs font-semibold text-slate-800 transition hover:bg-slate-200/80 dark:text-slate-200 dark:hover:bg-slate-700 md:py-3.5 md:text-sm"
            onClick={async () => {
              const text = buildPurchaseDetailShareText(data);
              const r = await shareOrCopyText(`Purchase ${voucherNo}`, text);
              if (r === "shared") toast.success("Shared");
              else if (r === "copied") toast.success("Summary copied");
              else toast.error("Could not share or copy");
            }}
          >
            <Share2 size={18} className="text-primary dark:text-emerald-400" aria-hidden />
            Share
          </button>
          <button
            type="button"
            className="flex flex-col items-center justify-center gap-1 py-3 text-xs font-semibold text-slate-800 transition hover:bg-slate-200/80 dark:text-slate-200 dark:hover:bg-slate-700 md:py-3.5 md:text-sm"
            onClick={() => {
              downloadPurchaseDetailCsv(data);
              toast.success("CSV downloaded");
            }}
          >
            <FileSpreadsheet size={18} className="text-primary dark:text-emerald-400" aria-hidden />
            Excel
          </button>
          <button
            type="button"
            className="flex flex-col items-center justify-center gap-1 py-3 text-xs font-semibold text-slate-800 transition hover:bg-slate-200/80 dark:text-slate-200 dark:hover:bg-slate-700 md:py-3.5 md:text-sm"
            onClick={async () => {
              try {
                await downloadPurchaseDetailBillPdf(data);
                toast.success("PDF downloaded successfully.");
              } catch (err) {
                console.error("Purchase detail PDF generation failed:", err);
                toast.error("Could not generate PDF. Please try again.");
              }
            }}
          >
            <Printer size={18} className="text-primary dark:text-emerald-400" aria-hidden />
            PDF
          </button>
        </footer>
      </aside>
    </div>
  );
};

const InfoSection = ({ title, rows }) => (
  <section className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800/30">
    <div className="text-sm font-bold text-slate-900 dark:text-slate-100">{title}</div>
    <div className="mt-3 flex flex-col gap-2.5">
      {rows.map((row) => (
        <div
          key={row.label}
          className="flex flex-wrap items-baseline gap-x-1.5 text-xs"
        >
          <span className="font-medium tracking-wide text-slate-500 dark:text-slate-400">
            {row.label}:
          </span>
          <span className="font-medium text-slate-900 dark:text-slate-100">
            {row.value}
          </span>
        </div>
      ))}
    </div>
  </section>
);

export default PurchaseDetails;
