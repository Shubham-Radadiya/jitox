import React from "react";
import toast from "react-hot-toast";
import { X, FileSpreadsheet, Printer, Share2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  buildPurchaseDetailShareText,
  downloadPurchaseDetailCsv,
  printPurchaseDetailBill,
  shareOrCopyText,
} from "../../../utils/voucherShare";

const PurchaseDetails = ({ open, onClose, data }) => {
  if (!open || !data) return null;
  const navigation = useNavigate();
  const path = navigation.pathname;

  const {
    voucherNo,
    status,
    purchaseDate,
    customer,
    party,
    products,
    totals,
    narration,
  } = data;

  return (
    <div className="fixed inset-0 z-[1000] flex justify-end">
      <div
        className="absolute inset-0 bg-black/20"
        onClick={onClose}
        aria-hidden="true"
      />
      <aside className="relative h-full w-full max-w-xl bg-white shadow-2xl flex flex-col">
        {/* Header */}
        <header className="flex items-center justify-between px-4 py-3 bg-headBg">
          <div>
            <div className="text-xl font-semibold text-dark">{voucherNo}</div>
            <div className="text-xs text-light">Purchase Details</div>
          </div>
          <button
            onClick={onClose}
            className="text-light hover:text-dark transition bg-headBg rounded-md"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {/* Purchase Date & Status */}
          <section className="flex justify-between">
            <div>
              <div className="text-xs text-light tracking-wide">
                Purchase Date
              </div>
              <div className="text-sm text-dark font-semibold">
                {purchaseDate}
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <div className="text-xs  text-light tracking-wide">Payment</div>
              <span className="inline-flex items-center px-3 py-1 rounded-md bg-primary text-white text-xs font-medium">
                {status}
              </span>
            </div>
            {(path === "/dashboard/accounting-voucher/sales" ||
              path === "/sales-return") && (
              <div className="flex flex-col gap-1">
                <div className="text-xs text-light tracking-wide">Status</div>
                <span className="inline-flex items-center px-3 py-1 rounded-md bg-primary text-white text-xs font-medium">
                  {status}
                </span>
              </div>
            )}
          </section>
          <hr className="border-light-border" />

          {narration ? (
            <>
              <section className="flex flex-col gap-1">
                <div className="text-xs font-semibold uppercase tracking-wide text-light">
                  Narration
                </div>
                <p className="whitespace-pre-wrap text-sm text-dark">{narration}</p>
              </section>
              <hr className="border-light-border" />
            </>
          ) : null}

          {/* Customer */}
          <InfoSection title="Customer Details" rows={customer} />
          <hr className="border-light-border" />

          {/* Party */}
          <InfoSection title="Party Details" rows={party} />
          <hr className="border-light-border" />

          {/* Product table */}
          <section className="flex flex-col gap-2">
            <div className="text-sm font-semibold text-dark">
              Product Details
            </div>
            <div className="border border-light-border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-headBg text-xs  text-light">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium text-dark">
                      Product Name ({products.length})
                    </th>
                    <th className="px-4 py-2 text-left font-medium text-dark">
                      Qty
                    </th>
                    <th className="px-4 py-2 text-left font-medium text-dark">
                      Rate (₹)
                    </th>
                    <th className="px-4 py-2 text-left font-medium text-dark">
                      GST (₹)
                    </th>
                    <th className="px-4 py-2 text-left font-medium text-dark">
                      Subtotal (₹)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((item) => (
                    <tr
                      key={item.name}
                      className="border-t border-light-border"
                    >
                      <td className="px-4 py-2 text-light border-r border-light-border">
                        {item.name}
                      </td>
                      <td className="px-4 py-2 text-light border-r border-light-border">
                        {item.qty}
                      </td>
                      <td className="px-4 py-2 text-light border-r border-light-border">
                        {item.rate}
                      </td>
                      <td className="px-4 py-2 text-light border-r border-light-border">
                        {item.gst}
                      </td>
                      <td className="px-4 py-2 text-light">{item.subtotal}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-light-border">
                    <td className="px-4 py-2 text-left align-middle font-medium text-dark">
                      Total
                    </td>
                    <td className="px-4 py-2 text-right align-middle tabular-nums text-light" />
                    <td className="px-4 py-2 text-right align-middle tabular-nums text-light" />
                    <td className="px-4 py-2 text-right align-middle tabular-nums text-light" />
                    <td className="px-4 py-2 text-right align-middle font-semibold tabular-nums border-l border-light-border text-dark">
                      {totals.totalAmount}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </section>
          <hr className="border-light-border" />

          {/* Payment */}
          <section className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-dark">
                Payment Details
              </div>
              {totals.reference && (
                <a
                  href="#"
                  className="text-blue underline text-sm font-medium hover:underline"
                >
                  {totals.reference}
                </a>
              )}
            </div>

            <div className="flex flex-col gap-2">
              {[
                { label: "Total Amount", value: totals.totalAmount },
                { label: "Tax (5%)", value: totals.tax },
                { label: "Discount", value: totals.discount },
                { label: "Paid Amount", value: totals.paid },
                { label: "Outstanding Due", value: totals.due },
                { label: "Final Payable", value: totals.finalPayable },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between text-sm text-dark font-medium"
                >
                  <span>{item.label}</span>
                  <span>{item.value}</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Footer — share & exports */}
        <footer className="grid grid-cols-3 divide-x divide-light-border border-t border-light-border bg-headBg">
          <button
            type="button"
            className="flex flex-col items-center justify-center gap-1 py-3 text-xs font-semibold text-dark transition hover:bg-slate-200/80 md:py-3.5 md:text-sm"
            onClick={async () => {
              const text = buildPurchaseDetailShareText(data);
              const r = await shareOrCopyText(`Purchase ${voucherNo}`, text);
              if (r === "shared") toast.success("Shared");
              else if (r === "copied") toast.success("Summary copied");
              else toast.error("Could not share or copy");
            }}
          >
            <Share2 size={18} className="text-primary" aria-hidden />
            Share
          </button>
          <button
            type="button"
            className="flex flex-col items-center justify-center gap-1 py-3 text-xs font-semibold text-dark transition hover:bg-slate-200/80 md:py-3.5 md:text-sm"
            onClick={() => {
              downloadPurchaseDetailCsv(data);
              toast.success("CSV downloaded");
            }}
          >
            <FileSpreadsheet size={18} className="text-primary" aria-hidden />
            Excel
          </button>
          <button
            type="button"
            className="flex flex-col items-center justify-center gap-1 py-3 text-xs font-semibold text-dark transition hover:bg-slate-200/80 md:py-3.5 md:text-sm"
            onClick={() => {
              const ok = printPurchaseDetailBill(data);
              if (ok) {
                toast.success(
                  "Downloaded (.html). Open it and use Print → Save as PDF for a PDF copy."
                );
              } else {
                toast.error("Allow downloads in your browser to save the bill.");
              }
            }}
          >
            <Printer size={18} className="text-primary" aria-hidden />
            PDF
          </button>
        </footer>
      </aside>
    </div>
  );
};

const InfoSection = ({ title, rows }) => (
  <section className="flex flex-col gap-2">
    <div className="text-sm font-semibold text-dark">{title}</div>
    <div className="flex flex-col text-sm gap-2">
      {rows.map((row) => (
        <div
          key={row.label}
          className="flex items-start justify-between text-dark text-xs gap-4"
        >
          <span className="tracking-wide">{row.label}:</span>
          <span className="text-right">{row.value}</span>
        </div>
      ))}
    </div>
  </section>
);

export default PurchaseDetails;
