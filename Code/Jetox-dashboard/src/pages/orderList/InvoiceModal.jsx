import React from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { CommonModal, Button } from "../../components/ui/CommanUI";
import { escapeHtml, printHtmlDocument } from "../../utils/printAndExport";

export default function InvoiceModal({ open, onClose, invoice }) {
  const navigate = useNavigate();
  if (!invoice) return null;

  const lines = invoice.lines || [];

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
      <div className="space-y-6 text-sm">
        <div className="flex justify-between gap-4 border-b border-light-border pb-4">
          <div>
            <div className="text-lg font-bold text-primary">
              {invoice.companyName || "Jitox Algo"}
            </div>
            <div className="text-light text-xs mt-1 space-y-0.5">
              {invoice.website && <div>{invoice.website}</div>}
              {invoice.email && <div>{invoice.email}</div>}
              {invoice.phone && <div>{invoice.phone}</div>}
            </div>
          </div>
          <div className="text-right text-xs text-light max-w-[200px]">
            {invoice.taxAddress || "Business address, City, State, Pin — TAX ID"}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-xs text-light mb-1">Billed to</div>
            <div className="font-semibold text-dark">
              {invoice.billedTo?.name}
            </div>
            <div className="text-light text-xs mt-1">
              {invoice.billedTo?.address}
            </div>
            {invoice.billedTo?.phone && (
              <div className="text-xs mt-1">{invoice.billedTo.phone}</div>
            )}
          </div>
          <div className="text-right space-y-1">
            <div className="text-xs text-light">Invoice of (₹)</div>
            <div className="text-2xl font-bold text-blue">
              {invoice.invoiceTotalLabel}
            </div>
            <div className="text-xs text-left space-y-0.5 pt-2">
              <div>
                <span className="text-light">Invoice Number: </span>
                {invoice.invoiceNo}
              </div>
              <div>
                <span className="text-light">Reference: </span>
                {invoice.reference}
              </div>
              <div>
                <span className="text-light">Order ID: </span>
                {invoice.orderId}
              </div>
              <div>
                <span className="text-light">Invoice Date: </span>
                {invoice.invoiceDate}
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-4 text-xs">
          <div>
            <span className="text-light">Payment Mode: </span>
            {invoice.paymentMode}
          </div>
          <div>
            <span className="text-light">Payment Status: </span>
            <span className="px-2 py-0.5 rounded-md bg-gray-200 text-gray-700 text-xs">
              {invoice.paymentStatusBadge}
            </span>
          </div>
        </div>

        <div className="border border-light-border rounded-lg overflow-hidden">
          <table className="w-full text-xs">
            <thead className="bg-headBg">
              <tr>
                <th className="px-3 py-2 text-left font-semibold">ITEM DETAIL</th>
                <th className="px-3 py-2 font-semibold">QTY</th>
                <th className="px-3 py-2 font-semibold">RATE</th>
                <th className="px-3 py-2 font-semibold">AMOUNT</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line, i) => (
                <tr key={i} className="border-t border-light-border">
                  <td className="px-3 py-2 text-left">{line.detail}</td>
                  <td className="px-3 py-2">{line.qty}</td>
                  <td className="px-3 py-2">{line.rate}</td>
                  <td className="px-3 py-2">{line.amount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end">
          <div className="w-64 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-light">Subtotal</span>
              <span>{invoice.subtotal}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-light">Tax ({invoice.taxPct || "10%"})</span>
              <span>{invoice.taxAmount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-light">Discount</span>
              <span>{invoice.discount}</span>
            </div>
            <div className="flex justify-between text-green-600 font-medium">
              <span>Paid Amount</span>
              <span>{invoice.paidAmount}</span>
            </div>
            <div className="flex justify-between text-red-500 font-medium">
              <span>Outstanding Due</span>
              <span>{invoice.outstanding}</span>
            </div>
            <div className="flex justify-between font-bold text-base pt-2 border-t border-light-border">
              <span>Final Payable</span>
              <span>{invoice.finalPayable}</span>
            </div>
          </div>
        </div>

        {invoice.terms && (
          <p className="text-xs text-light border-t border-light-border pt-4">
            {invoice.terms}
          </p>
        )}
      </div>
    </CommonModal>
  );
}
