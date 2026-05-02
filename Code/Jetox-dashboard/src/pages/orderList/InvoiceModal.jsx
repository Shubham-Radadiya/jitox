import React from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { CheckCircle2 } from "lucide-react";
import { CommonModal, Button } from "../../components/ui/CommanUI";
import { escapeHtml, printHtmlDocument } from "../../utils/printAndExport";

export default function InvoiceModal({ open, onClose, invoice }) {
  const navigate = useNavigate();
  if (!invoice) return null;

  const lines = invoice.lines || [];
  const termsItems = Array.isArray(invoice.terms)
    ? invoice.terms
    : String(invoice.terms || "")
        .split(/\r?\n|[;•]/)
        .map((item) => item.trim())
        .filter(Boolean);
  const displayTerms = termsItems.length
    ? termsItems
    : ["Please pay within the agreed credit period."];

  const printInvoiceSummary = () => {
    const rows = lines
      .map(
        (line) =>
          `<tr><td>${escapeHtml(line.detail)}</td><td>${escapeHtml(line.qty)}</td><td>${escapeHtml(line.rate)}</td><td>${escapeHtml(line.amount)}</td></tr>`
      )
      .join("");
    printHtmlDocument(
      `Invoice-${invoice.invoiceNo || "statement"}`,
      `<p><strong>${escapeHtml(invoice.billedTo?.name || "Client")}</strong></p>
       <p>Total: ${escapeHtml(invoice.invoiceTotalLabel || "")} · Final: ${escapeHtml(invoice.finalPayable || "")}</p>
       <table><thead><tr><th>Item</th><th>Qty</th><th>Rate</th><th>Amount</th></tr></thead><tbody>${rows}</tbody></table>`
    );
    toast.success(
      "Downloaded (.html). Open it and use Print → Save as PDF for a PDF copy."
    );
  };

  return (
    <CommonModal
      open={open}
      onClose={onClose}
      title="Invoice"
      width="720px"
      footer={[
        <Button
          key="ledger"
          label="View Ledger"
          variant="outline"
          onClick={() => {
            navigate("/dashboard/account/ledger");
            onClose?.();
          }}
        />,
        <Button
          key="stmt"
          label="Generate Statement"
          variant="outline"
          onClick={() => {
            printInvoiceSummary();
          }}
        />,
      ]}
    >
      <div className="space-y-5 text-sm">
        <div className="overflow-hidden rounded-2xl border border-emerald-200/80 bg-linear-to-r from-emerald-50 via-white to-sky-50 shadow-sm dark:border-emerald-900/40 dark:from-emerald-950/35 dark:via-slate-900 dark:to-sky-950/25">
          <div className="flex flex-wrap items-start justify-between gap-4 p-4">
            <div className="min-w-0">
              <div className="text-lg font-bold tracking-tight text-primary">
                {invoice.companyName || "Jitox Algo"}
              </div>
              <div className="mt-1 space-y-0.5 text-xs text-slate-600 dark:text-slate-400">
                {invoice.website && <div>{invoice.website}</div>}
                {invoice.email && <div>{invoice.email}</div>}
                {invoice.phone && <div>{invoice.phone}</div>}
              </div>
            </div>
            <div className="rounded-xl border border-light-border bg-white/80 px-3 py-2 text-right text-xs text-slate-600 shadow-sm dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-400">
              {invoice.taxAddress || "Business address, City, State, Pin — TAX ID"}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <section className="rounded-xl border border-light-border bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Billed To
            </p>
            <p className="text-base font-semibold text-slate-900 dark:text-slate-100">
              {invoice.billedTo?.name}
            </p>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
              {invoice.billedTo?.address}
            </p>
            {invoice.billedTo?.phone && (
              <p className="mt-1 text-xs text-slate-700 dark:text-slate-300">
                {invoice.billedTo.phone}
              </p>
            )}
          </section>

          <section className="rounded-xl border border-light-border bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Invoice Value
            </p>
            <p className="mt-1 text-2xl font-bold tracking-tight text-sky-700 dark:text-sky-300">
              {invoice.invoiceTotalLabel}
            </p>
            <div className="mt-2 space-y-0.5 text-xs text-slate-700 dark:text-slate-300">
              <p><span className="text-slate-500 dark:text-slate-400">Invoice Number:</span> {invoice.invoiceNo}</p>
              <p><span className="text-slate-500 dark:text-slate-400">Reference:</span> {invoice.reference}</p>
              <p><span className="text-slate-500 dark:text-slate-400">Order ID:</span> {invoice.orderId}</p>
              <p><span className="text-slate-500 dark:text-slate-400">Invoice Date:</span> {invoice.invoiceDate}</p>
            </div>
          </section>
        </div>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-xl border border-light-border bg-white px-4 py-2.5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="inline-flex items-center gap-1.5 text-xs">
            <span className="font-semibold text-slate-500 dark:text-slate-400">Payment Mode:</span>
            <span className="font-medium text-slate-800 dark:text-slate-200">{invoice.paymentMode}</span>
          </div>
          <div className="inline-flex items-center gap-1.5 text-xs">
            <span className="font-semibold text-slate-500 dark:text-slate-400">Payment Status:</span>
            <span className="rounded-full border border-slate-300 bg-slate-100 px-2.5 py-0.5 font-medium text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200">
              {invoice.paymentStatusBadge}
            </span>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-light-border shadow-sm dark:border-slate-700">
          <table className="w-full text-xs">
            <thead className="bg-slate-100 dark:bg-slate-800/90">
              <tr>
                <th className="px-3 py-2 text-left font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-200">Item Detail</th>
                <th className="px-3 py-2 text-center font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-200">Qty</th>
                <th className="px-3 py-2 text-right font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-200">Rate</th>
                <th className="px-3 py-2 text-right font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-200">Amount</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line, i) => (
                <tr
                  key={i}
                  className="border-t border-light-border transition-colors hover:bg-emerald-50/40 dark:border-slate-700 dark:hover:bg-slate-800/70"
                >
                  <td className="px-3 py-2 text-left text-slate-800 dark:text-slate-200">{line.detail}</td>
                  <td className="px-3 py-2 text-center text-slate-700 dark:text-slate-200">{line.qty}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-slate-700 dark:text-slate-200">{line.rate}</td>
                  <td className="px-3 py-2 text-right tabular-nums font-medium text-slate-800 dark:text-slate-100">{line.amount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <section className="rounded-xl border border-light-border bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Terms & Conditions
            </p>
            <ul className="max-h-36 space-y-2 overflow-y-auto pr-1 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
              {displayTerms.map((term, idx) => (
                <li key={`${idx}-${term}`} className="flex items-start gap-2">
                  <CheckCircle2
                    className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400"
                    strokeWidth={2}
                    aria-hidden
                  />
                  <span>{term}</span>
                </li>
              ))}
            </ul>
          </section>
          <section className="w-full max-w-xs justify-self-end space-y-2 rounded-xl border border-light-border bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Subtotal</span>
              <span className="tabular-nums text-slate-800 dark:text-slate-200">{invoice.subtotal}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Tax ({invoice.taxPct || "10%"})</span>
              <span className="tabular-nums text-slate-800 dark:text-slate-200">{invoice.taxAmount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Discount</span>
              <span className="tabular-nums text-slate-800 dark:text-slate-200">{invoice.discount}</span>
            </div>
            <div className="flex justify-between font-medium text-emerald-600 dark:text-emerald-400">
              <span>Paid Amount</span>
              <span className="tabular-nums">{invoice.paidAmount}</span>
            </div>
            <div className="flex justify-between font-medium text-rose-600 dark:text-rose-400">
              <span>Outstanding Due</span>
              <span className="tabular-nums">{invoice.outstanding}</span>
            </div>
            <div className="flex justify-between border-t border-light-border pt-2 text-base font-bold dark:border-slate-700 dark:text-slate-100">
              <span>Final Payable</span>
              <span className="tabular-nums">{invoice.finalPayable}</span>
            </div>
          </section>
        </div>
      </div>
    </CommonModal>
  );
}
