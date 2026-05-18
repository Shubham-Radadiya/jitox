import React from "react";
import { X, Printer } from "lucide-react";
import priceListLogoUrl from "../../assets/jitox-price-list-logo.png";
import { printHtmlDocument } from "../../utils/printAndExport";
import {
  PAYMENT_RECEIPT_COMPANY,
  buildPaymentReceiptBodyHtml,
} from "../../utils/paymentReceipt";

const MINT = "#B7D7C1";
const DARK_GREEN = "#1a5c3a";

function DottedField({ label, value, className = "" }) {
  return (
    <div className={`flex items-baseline gap-2 text-[13px] ${className}`}>
      <span className="shrink-0 font-bold text-gray-900">{label}</span>
      <span className="min-h-[20px] flex-1 border-b border-dotted border-gray-800 pb-0.5 font-semibold text-gray-900">
        {value}
      </span>
    </div>
  );
}

/**
 * Printable PAYMENT RECEIPT (matches JETOX template). Opened from Receipt Voucher → View.
 */
const ReceiptPaymentView = ({ open, onClose, data }) => {
  if (!open || !data) return null;

  const co = PAYMENT_RECEIPT_COMPANY;

  const handlePrint = () => {
    const title = `Payment Receipt ${data.voucherNo}`;
    printHtmlDocument(title, buildPaymentReceiptBodyHtml(data), {
      download: true,
      printDialog: true,
    });
  };

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 dark:bg-black/70"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Payment receipt"
        className="relative z-10 flex max-h-[95vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl dark:bg-slate-900"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-700">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            Payment receipt
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
            >
              <Printer size={16} />
              Print
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white"
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto bg-white p-4 sm:p-6">
          <article className="mx-auto max-w-[820px] font-sans text-gray-900">
            <header className="mb-2 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={priceListLogoUrl}
                  alt="JETOX"
                  className="h-[72px] w-[72px] object-contain"
                />
                <div>
                  <div
                    className="text-[34px] font-extrabold leading-none tracking-wide"
                    style={{ color: DARK_GREEN }}
                  >
                    {co.brand}
                  </div>
                  <div className="mt-0.5 text-sm font-bold tracking-wide">
                    {co.tagline}
                  </div>
                </div>
              </div>
              <div className="max-w-[340px] text-right text-[11px] leading-relaxed sm:ml-auto">
                <p>{co.address}</p>
                <p className="mt-1">{co.email}</p>
                <p className="mt-1">
                  <strong>GSTIN :</strong> {co.gstin}
                </p>
              </div>
            </header>

            <div
              className="py-2 text-center text-[15px] font-bold tracking-wide text-black"
              style={{ backgroundColor: MINT }}
            >
              PAYMENT RECEIPT
            </div>

            <section className="px-4 py-4 sm:px-5">
              <div className="mb-3 flex justify-between text-[13px] font-semibold">
                <span>
                  <strong>No. :</strong> {data.voucherNo}
                </span>
                <span>
                  <strong>Date :</strong> {data.dateLabel}
                </span>
              </div>

              <DottedField
                label="Received With Thanks From"
                value={data.receivedFrom}
                className="my-3"
              />
              <DottedField label="Amount" value={data.amountDisplay} className="my-3" />
              <DottedField label="In Word" value={data.amountWords} className="my-3" />

              <div className="my-3 flex flex-wrap items-baseline gap-x-2 gap-y-1 text-[13px]">
                <span className="font-bold">By</span>
                <span className="min-w-[80px] max-w-[38%] flex-1 border-b border-dotted border-gray-800 pb-0.5 font-semibold">
                  {data.paymentMode}
                </span>
                <span className="ml-2 font-bold">NEFT / Cheque No.</span>
                <span className="min-w-[80px] flex-1 border-b border-dotted border-gray-800 pb-0.5 font-semibold">
                  {data.chequeNo}
                </span>
              </div>

              <DottedField label="Remarks" value={data.remarks} className="my-3" />

              <footer className="mt-6 flex flex-col items-stretch justify-between gap-6 sm:flex-row sm:items-end">
                <div className="flex items-stretch">
                  <div
                    className="flex w-10 items-center justify-center rounded-l-md border border-[#8fb89a] border-r-0 text-[22px] font-bold"
                    style={{ backgroundColor: MINT }}
                  >
                    ₹
                  </div>
                  <div
                    className="min-w-[120px] rounded-r-md border border-[#8fb89a] px-4 py-2 text-center text-[22px] font-bold"
                    style={{ backgroundColor: MINT }}
                  >
                    {data.amountBox}
                  </div>
                </div>

                <div className="min-w-[140px] text-center text-xs">
                  <div className="mb-1 min-h-[20px] border-b border-dotted border-gray-800 font-medium">
                    {data.receivedBy}
                  </div>
                  <p className="text-gray-600">Received By</p>
                </div>

                <div className="min-w-[140px] text-center text-xs">
                  <div className="mb-1 min-h-[20px] border-b border-dotted border-gray-800" />
                  <p className="text-gray-600">Authorised Signature</p>
                </div>
              </footer>
            </section>
          </article>
        </div>
      </div>
    </div>
  );
};

export default ReceiptPaymentView;
