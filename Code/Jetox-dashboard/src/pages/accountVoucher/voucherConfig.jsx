import dayjs from "dayjs";
import toast from "react-hot-toast";
import customParseFormat from "dayjs/plugin/customParseFormat";
import PurchaseDetails from "./purchase/PurchaseDetails";
import SalesDetailsDrawer from "./sales/SalesDetailsDrawer";
import {
  fetchPurchaseDetail,
  fetchQuotationDetail,
  fetchPurchaseReturnDetail,
  fetchSalesOrderDetail,
  fetchJournalDetail,
  fetchPaymentDetail,
  fetchReceiptDetail,
  fetchManufacturingDetail,
} from "./voucherDetailFetchers.jsx";
import { parseRupeeCell, fmtRupee } from "../../utils/voucherRowMappers";
import {
  STATUS_CELL_INNER,
  paymentStatusBadgeClasses,
  tableFooterTdClasses,
  tableTdClasses,
} from "../../utils/tableUi";
import { mergePageAddButton } from "../../utils/pageAddButton";
import {
  buildPurchaseListRowSummary,
  downloadPurchaseListRowCsv,
  shareOrCopyText,
} from "../../utils/voucherShare";
import { getApiErrorMessage } from "../../utils/apiError";
import {
  purchaseRowHasParty,
  purchaseRowIsFullyPaid,
  purchaseReturnRowHasParty,
  purchaseReturnRowHasRefund,
} from "../../utils/purchasePaymentStatus";
import { buildUploadUrl } from "../../utils/uploadUrl";
import { IoEyeOutline, IoDocumentTextOutline } from "react-icons/io5";
import { TbEdit } from "react-icons/tb";
import {
  BadgeCheck,
  CreditCard,
  Banknote,
  FileSpreadsheet,
  Paperclip,
  Plus,
  Share2,
  Trash2,
  Play,
  CircleCheck,
  Pause,
  Square,
} from "lucide-react";
import PaymentModal from "./modals/PaymentModal";
import ReceiptModal from "./modals/ReceiptModal";
import ExpenseModal from "./modals/ExpenseModal";
import CashTransferModal from "./modals/CashTransferModal";
import BankToCashModal from "./modals/BankToCashModal";
import JournalModal from "./modals/JournalModal";
import JournalDetailsDrawer from "./JournalDetailsDrawer";
import PaymentDetailsDrawer from "./PaymentDetailsDrawer";
import ReceiptPaymentView from "./ReceiptPaymentView";
import ManufacturingDetailsDrawer from "./manufacturing/ManufacturingDetailsDrawer";

dayjs.extend(customParseFormat);

const withFooter = (columns, cells = []) => (
  <tfoot>
    <tr className="bg-headBg border-t border-light-border dark:border-slate-700">
      {columns.map((column) => {
        const cell = cells.find((item) => item.column === column);
        const cls = tableFooterTdClasses(column, {
          variant: "head",
          extra: cell?.className || "",
        });
        if (!cell) {
          return <td key={column} className={cls} />;
        }
        return (
          <td key={column} className={cls}>
            {cell.content}
          </td>
        );
      })}
    </tr>
  </tfoot>
);

const purchaseFooterRenderer = (columns, rows = []) => {
  let total = 0;
  let paid = 0;
  let remaining = 0;
  rows.forEach((r) => {
    total += parseRupeeCell(r["Total Amount"] || r["Debit Amount"]);
    paid += parseRupeeCell(r["Paid Amount"]);
    remaining += parseRupeeCell(r["Due Amount"]);
  });
  return withFooter(columns, [
    { column: "Party Name", content: "Grand Total" },
    { column: "Total Amount", content: fmtRupee(total) },
    { column: "Paid Amount", content: fmtRupee(paid) },
    { column: "Due Amount", content: fmtRupee(remaining) },
  ]);
};

const purchaseReturnFooterRenderer = (columns, rows = []) => {
  let total = 0;
  let paid = 0;
  let remaining = 0;
  rows.forEach((r) => {
    total += parseRupeeCell(r["Total Amount"] || r["Debit Amount"]);
    paid += parseRupeeCell(r["Paid Amount"]);
    remaining += parseRupeeCell(r["Due Amount"]);
  });
  return withFooter(columns, [
    { column: "Party Name", content: "Grand Total" },
    { column: "Total Amount", content: fmtRupee(total) },
    { column: "Paid Amount", content: fmtRupee(paid) },
    { column: "Due Amount", content: fmtRupee(remaining) },
  ]);
};

const salesFooterRenderer = (columns, rows = []) => {
  let amt = 0;
  rows.forEach((r) => {
    amt += parseRupeeCell(r.Amount);
  });
  return withFooter(columns, [
    { column: "Party Name", content: "Grand Total:" },
    { column: "Qty", content: "—" },
    { column: "Amount", content: fmtRupee(amt) },
  ]);
};

const cashBankFooterRenderer = (balanceColumn) => (columns, rows = []) => {
  let total = 0;
  rows.forEach((r) => {
    total += parseRupeeCell(r[balanceColumn]);
  });
  return withFooter(columns, [
    { column: "Particulars", content: "Total" },
    { column: balanceColumn, content: fmtRupee(total) },
  ]);
};

const purchaseColumns = [
  "Date",
  "Party Name",
  "Voucher No.",
  "Total Amount",
  "Paid Amount",
  "Due Amount",
  "Payment Status",
  "Actions",
];

const purchaseReturnColumns = [
  "Date",
  "Party Name",
  "Voucher No.",
  "Total Amount",
  "Paid Amount",
  "Due Amount",
  "Payment Status",
  "Actions",
];

const salesColumns = [
  "Invoice No.",
  "Date",
  "Party Name",
  "Qty",
  "Amount",
  "Payment Status",
  "Order Status",
  "Actions",
];

const salesReturnColumns = [
  "Return ID",
  "Invoice No.",
  "Client Name",
  "Return Date",
  "Returned QTY",
  "Reason ",
  "Amount",
  "Status",
  "Actions",
];

const paymentColumns = [
  "Voucher No",
  "Date",
  "Party",
  "Paid From",
  "Mode",
  "Amount",
  "Status",
  "Actions",
];

const receiptColumns = [
  "Voucher No",
  "Date",
  "Receipt From",
  "Received In",
  "Amount (₹)",
  "Narration",
  "Status",
  "Actions",
];

const expensesColumns = [
  "Date",
  "Expense Type",
  "Description",
  "Paid To",
  "Amount",
  "Mode",
  "Proof",
  "Actions",
];

const cashColumns = [
  "Voucher No",
  "Date",
  "Particulars",
  "Debit (Outflow)",
  "Credit (Inflow)",
  "Balance",
  "Actions",
];

const bankColumns = [
  "Voucher No",
  "Date",
  "Particulars",
  "Debit From",
  "Credit (Outflow)",
  "Balance",
  "Actions",
];

const manufacturingColumns = [
  "Batch ID",
  "Product Name",
  "Date",
  "Qty Made",
  "Cost/Unit",
  "Total Cost",
  "Status",
  "Action",
];

const journalColumns = [
  "Entry No",
  "Date",
  "Description",
  "Debit",
  "Credit",
  "Actions",
];

const quotationColumns = [
  "Quote No",
  "Date",
  "Client",
  "Amount",
  "Status",
  "Actions",
];

/** Primary CTA in voucher list toolbars — shared Add pattern */
const voucherAddButton = (overrides = {}) => {
  const { className: extraCls = "", ...rest } = overrides;
  return {
    type: "button",
    label: "Add voucher",
    ...mergePageAddButton({
      size: "sm",
      className: [
        // Narrow screens: smaller than global mergePageAddButton defaults (min-h-10 / px-4)
        "max-sm:min-h-8! max-sm:px-2.5! max-sm:py-1! max-sm:text-[12px]! max-sm:gap-1! max-sm:[&_svg]:h-3! max-sm:[&_svg]:w-3!",
        "min-h-9 px-3 sm:px-4 text-[13px] font-semibold gap-1 [&_svg]:h-3.5 [&_svg]:w-3.5",
        extraCls,
      ]
        .filter(Boolean)
        .join(" "),
      ...rest,
    }),
  };
};

// Helper function to create action buttons with tooltips
const createActionButtons = (actions, { openDetails, navigate, row, openPurchaseModal }) => {
  const tooltipLabels = {
    eye: "View",
    payNow: "Mark as Paid",
    payNowPaid: "Already paid",
    payReqSend: "Request send Pay Now",
    edit: "Edit",
    revoucher: "Re-voucher",
    share: "Share / export",
    exportCsv: "Download Excel (CSV)",
    attach: "Attach",
    approve: "Approve",
    delete: "Delete",
    voucherDocument: "Document",
    mfgStart: "Start manufacturing",
    mfgComplete: "Complete / add to stock",
    mfgPause: "Pause",
    mfgStop: "Mark failed",
    purchaseMarkPaid: "Create payment voucher",
    purchaseReturnRefund: "Refund money — create receipt",
    receiptReceive: "Record refund — bank/cash and Received",
    receiptReceived: "Already received",
  };

  /** Named group so tooltips only react to this wrapper, not the `<tr class="group">` in TableContent */
  const renderButtonWithTooltip = (button, tooltipText, key) => {
    return (
      <div key={key} className="relative group/acttip">
        {button}
        <div className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 rounded-lg bg-slate-900 px-2 py-1 text-xs whitespace-nowrap text-white shadow-md opacity-0 transition-opacity duration-200 group-hover/acttip:opacity-100 dark:bg-slate-800 dark:text-slate-50 dark:ring-1 dark:ring-white/10">
          {tooltipText}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-900 dark:border-t-slate-800" aria-hidden />
        </div>
      </div>
    );
  };

  return (
    <td className={tableTdClasses("Actions")}>
      <div className="flex items-center justify-center gap-3 text-gray-700 dark:text-slate-200">
        {actions.map((action, index) => {
          if (action.type === "eye") {
            return renderButtonWithTooltip(
              <button
                type="button"
                onClick={() => {
                  if (action.onClick) {
                    action.onClick(row, navigate);
                  } else {
                    openDetails(row);
                  }
                }}
                className="hover:text-blue transition"
                aria-label="View"
              >
                <IoEyeOutline size={18} />
              </button>,
              action.tooltip || tooltipLabels.eye,
              index
            );
          } 
          if (action.type === "payNow") {
            const isPaid = String(row.Status || "").trim() === "Paid";
            const disabled =
              (action.showCondition !== false && isPaid) ||
              (typeof action.isDisabled === "function" &&
                !!action.isDisabled(row));
            let tooltip = action.tooltip || tooltipLabels.payNow;
            if (disabled) {
              if (isPaid) {
                tooltip = action.paidTooltip || tooltipLabels.payNowPaid;
              } else if (action.disabledTooltip) {
                tooltip = action.disabledTooltip;
              }
            }
            return renderButtonWithTooltip(
              <button
                type="button"
                onClick={() => {
                  if (disabled) return;
                  if (action.onClick) action.onClick(row, navigate);
                  else
                    toast.success(
                      `Record payment for ${row.Party || "party"} — use Add voucher on the list.`
                    );
                }}
                disabled={disabled}
                className={
                  disabled
                    ? "cursor-not-allowed text-slate-400 dark:text-slate-600"
                    : "hover:text-blue transition"
                }
                aria-label="Pay now"
                aria-disabled={disabled || undefined}
              >
                <CreditCard size={18} />
              </button>,
              tooltip,
              index
            );
          }
          if (action.type === "payReqSend") {
            // Only show if status is Pending (unless condition is disabled)
            if (action.showCondition !== false && row.Status !== "Pending") return null;
            /**
             * `isDisabled(row)` lets a per-row config gate the click (e.g. a
             * sales row that already has a linked Payment Voucher). When
             * disabled we render a muted, no-op button with an explanatory
             * tooltip so the user understands why it's inert.
             */
            const disabled =
              typeof action.isDisabled === "function" && !!action.isDisabled(row);
            const tooltip =
              disabled && action.disabledTooltip
                ? action.disabledTooltip
                : action.tooltip || tooltipLabels.payReqSend;
            return renderButtonWithTooltip(
              <button
                type="button"
                onClick={() => {
                  if (disabled) return;
                  if (action.onClick) action.onClick(row, navigate);
                  else toast.success("Payment request flow opens from Add voucher on the list.");
                }}
                disabled={disabled}
                className={
                  disabled
                    ? "cursor-not-allowed text-slate-400 dark:text-slate-600"
                    : "hover:text-blue transition"
                }
                aria-label="Request Send Pay Now"
                aria-disabled={disabled || undefined}
              >
                <CreditCard size={18} />
              </button>,
              tooltip,
              index
            );
          }
          if (action.type === "revoucher") {
            return renderButtonWithTooltip(
              <button
                type="button"
                onClick={() => action.onClick?.(row)}
                className="text-xs font-semibold text-primary hover:underline px-0.5 dark:text-emerald-400 dark:hover:text-emerald-300"
                aria-label="Re-voucher"
              >
                Re-voucher
              </button>,
              action.tooltip || tooltipLabels.revoucher,
              index
            );
          }
          if (action.type === "share") {
            return renderButtonWithTooltip(
              <button
                type="button"
                onClick={() => action.onClick?.(row)}
                className="hover:text-blue transition"
                aria-label="Share or export"
              >
                <Share2 size={18} />
              </button>,
              action.tooltip || tooltipLabels.share,
              index
            );
          }
          if (action.type === "edit") {
            return renderButtonWithTooltip(
              <button
                type="button"
                onClick={() => action.onClick?.(row, navigate)}
                className="hover:text-blue transition"
                aria-label="Edit"
              >
                <TbEdit size={18} />
              </button>,
              action.tooltip || tooltipLabels.edit,
              index
            );
          }
          if (action.type === "exportCsv") {
            return renderButtonWithTooltip(
              <button
                type="button"
                onClick={() => action.onClick?.(row, navigate)}
                className="hover:text-blue transition"
                aria-label="Download Excel CSV"
              >
                <FileSpreadsheet size={18} />
              </button>,
              action.tooltip || tooltipLabels.exportCsv,
              index
            );
          }
          if (action.type === "attach") {
            return renderButtonWithTooltip(
              <button
                type="button"
                onClick={() => action.onClick?.(row, navigate)}
                className="hover:text-blue transition"
                aria-label="Attach"
              >
                <Paperclip size={18} />
              </button>,
              action.tooltip || tooltipLabels.attach,
              index
            );
          }
          if (action.type === "approve") {
            return renderButtonWithTooltip(
              <button
                type="button"
                onClick={() => action.onClick?.(row, navigate)}
                className="hover:text-blue transition"
                aria-label="Approve"
              >
                <BadgeCheck size={18} />
              </button>,
              action.tooltip || tooltipLabels.approve,
              index
            );
          }
          if (action.type === "delete") {
            return renderButtonWithTooltip(
              <button
                type="button"
                onClick={() => action.onClick?.(row, navigate)}
                className="hover:text-red-500 transition"
                aria-label="Delete"
              >
                <Trash2 size={18} />
              </button>,
              action.tooltip || tooltipLabels.delete,
              index
            );
          }
          if (action.type === "voucherDocument") {
            return renderButtonWithTooltip(
              <button
                type="button"
                onClick={() => action.onClick?.(row, navigate)}
                className="hover:text-blue transition"
                aria-label="Document"
              >
                <IoDocumentTextOutline size={18} />
              </button>,
              action.tooltip || tooltipLabels.voucherDocument,
              index
            );
          }
          if (action.type === "mfgStart") {
            return renderButtonWithTooltip(
              <button
                type="button"
                onClick={() => action.onClick?.(row, navigate)}
                className="hover:text-emerald-600 transition"
                aria-label="Start manufacturing"
              >
                <Play size={18} />
              </button>,
              action.tooltip || tooltipLabels.mfgStart,
              index
            );
          }
          if (action.type === "mfgComplete") {
            return renderButtonWithTooltip(
              <button
                type="button"
                onClick={() => action.onClick?.(row, navigate)}
                className="hover:text-emerald-600 transition"
                aria-label="Complete manufacturing"
              >
                <CircleCheck size={18} />
              </button>,
              action.tooltip || tooltipLabels.mfgComplete,
              index
            );
          }
          if (action.type === "mfgPause") {
            return renderButtonWithTooltip(
              <button
                type="button"
                onClick={() => action.onClick?.(row, navigate)}
                className="hover:text-blue transition"
                aria-label="Pause"
              >
                <Pause size={18} />
              </button>,
              action.tooltip || tooltipLabels.mfgPause,
              index
            );
          }
          if (action.type === "mfgStop") {
            return renderButtonWithTooltip(
              <button
                type="button"
                onClick={() => action.onClick?.(row, navigate)}
                className="hover:text-red transition"
                aria-label="Stop"
              >
                <Square size={16} fill="currentColor" />
              </button>,
              action.tooltip || tooltipLabels.mfgStop,
              index
            );
          }
          if (action.type === "purchaseReturnRefund") {
            const hasRefund =
              typeof action.hasRefund === "function"
                ? action.hasRefund(row)
                : false;
            const noParty =
              typeof action.hasParty === "function"
                ? !action.hasParty(row)
                : false;
            const disabled =
              hasRefund ||
              noParty ||
              (typeof action.isDisabled === "function" &&
                !!action.isDisabled(row));
            let tooltip =
              action.tooltip || tooltipLabels.purchaseReturnRefund;
            if (disabled) {
              if (hasRefund) {
                tooltip = action.refundTooltip || "Refund receipt already created";
              } else if (noParty) {
                tooltip =
                  action.noPartyTooltip ||
                  "Set Party Name on purchase return first";
              } else if (action.disabledTooltip) {
                tooltip = action.disabledTooltip;
              }
            }
            return renderButtonWithTooltip(
              <button
                type="button"
                onClick={() => {
                  if (disabled) return;
                  action.onClick?.(row);
                }}
                disabled={disabled}
                className={
                  disabled
                    ? "cursor-not-allowed text-slate-400 dark:text-slate-600"
                    : "text-emerald-500 hover:text-emerald-600 transition dark:text-emerald-400 dark:hover:text-emerald-300"
                }
                aria-label="Refund from supplier"
                aria-disabled={disabled || undefined}
              >
                <Banknote size={18} />
              </button>,
              tooltip,
              index
            );
          }
          if (action.type === "receiptReceive") {
            const isReceived = String(row.Status || "").trim() === "Received";
            const disabled = isReceived;
            let tooltip = action.tooltip || tooltipLabels.receiptReceive;
            if (disabled) {
              tooltip = action.receivedTooltip || tooltipLabels.receiptReceived;
            }
            return renderButtonWithTooltip(
              <button
                type="button"
                onClick={() => {
                  if (disabled) return;
                  action.onClick?.(row);
                }}
                disabled={disabled}
                className={
                  disabled
                    ? "cursor-not-allowed text-slate-400 dark:text-slate-600"
                    : "text-emerald-500 hover:text-emerald-600 transition dark:text-emerald-400 dark:hover:text-emerald-300"
                }
                aria-label="Record refund / receipt"
                aria-disabled={disabled || undefined}
              >
                <Banknote size={18} />
              </button>,
              tooltip,
              index
            );
          }
          if (action.type === "purchaseMarkPaid") {
            const current = String(row["Payment Status"] || "").trim();
            const isPaid = current === "Paid";
            const noParty =
              typeof action.hasParty === "function"
                ? !action.hasParty(row)
                : false;
            const disabled =
              isPaid ||
              noParty ||
              (typeof action.isDisabled === "function" &&
                !!action.isDisabled(row));
            let tooltip = action.tooltip || tooltipLabels.purchaseMarkPaid;
            if (disabled) {
              if (isPaid) {
                tooltip = action.paidTooltip || "Already paid";
              } else if (noParty) {
                tooltip =
                  action.noPartyTooltip ||
                  "Select Party Name on purchase (Edit), then pay";
              } else if (action.disabledTooltip) {
                tooltip = action.disabledTooltip;
              }
            }
            return renderButtonWithTooltip(
              <button
                type="button"
                onClick={() => {
                  if (disabled) return;
                  action.onClick?.(row);
                }}
                disabled={disabled}
                className={
                  disabled
                    ? "cursor-not-allowed text-slate-400 dark:text-slate-600"
                    : "hover:text-blue transition"
                }
                aria-label="Create payment voucher"
                aria-disabled={disabled || undefined}
              >
                <CreditCard size={18} />
              </button>,
              tooltip,
              index
            );
          }
          return null;
        })}
      </div>
    </td>
  );
};

const purchasePaymentRenderer = (key, value, defaultRenderer) => {
  if (key === "Date" && value && /^\d{4}-\d{2}-\d{2}/.test(String(value))) {
    return (
      <td className={`${tableTdClasses(key)} tabular-nums`}>
        {dayjs(value).format("DD-MMM-YY")}
      </td>
    );
  }
  if (key === "Payment Status") {
    return (
      <td className={tableTdClasses(key)}>
        <div className={STATUS_CELL_INNER}>
          <span className={paymentStatusBadgeClasses(value)}>
            {value}
          </span>
        </div>
      </td>
    );
  }
  return defaultRenderer(key, value);
};

const purchaseReturnRowRenderer = (key, value, defaultRenderer) => {
  if (key === "Date" && value && /^\d{4}-\d{2}-\d{2}/.test(String(value))) {
    return (
      <td className={`${tableTdClasses(key)} text-slate-500 dark:text-slate-400`}>
        {dayjs(value).format("DD-MMM-YY")}
      </td>
    );
  }
  if (key === "Payment Status") {
    const label = String(value || "Pending").trim() || "Pending";
    return (
      <td className={tableTdClasses(key)}>
        <div className="flex justify-center">
          <span className={paymentStatusBadgeClasses(label)}>
            {label}
          </span>
        </div>
      </td>
    );
  }
  return defaultRenderer(key, value);
};

const formatIsoDateRow = (key, value, defaultRenderer) => {
  if (key === "Date" && value && /^\d{4}-\d{2}-\d{2}/.test(String(value))) {
    return (
      <td className={`${tableTdClasses(key)} text-slate-500 dark:text-slate-400`}>
        {dayjs(value).format("DD MMM YYYY")}
      </td>
    );
  }
  return defaultRenderer(key, value);
};

const expenseTableRenderer = (key, value, defaultRenderer, row) => {
  if (key === "Date") {
    return formatIsoDateRow(key, value, defaultRenderer);
  }
  if (key === "Proof") {
    const storedPath = row?._raw?.uploadProof;
    if (value === "view" && storedPath) {
      const url = buildUploadUrl(storedPath);
      return (
        <td className={tableTdClasses(key)}>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue text-sm font-medium hover:underline"
          >
            View
          </a>
        </td>
      );
    }
    return (
      <td className={`${tableTdClasses(key)} text-slate-500 dark:text-slate-400`}>-</td>
    );
  }
  return defaultRenderer(key, value);
};

const salesBadgeRenderer = (key, value, defaultRenderer) => {
  if (key === "Payment Status" || key === "Order Status") {
    const isPaid = value === "Paid";
    const isCompleted = value === "Completed";
    const isPending = value === "Pending";
    const isProcessing = value === "Processing";
    let badgeClass = "bg-gray text-gray2";
    if (key === "Payment Status") {
      badgeClass = isPaid
        ? "bg-primary text-white"
        : value === "Partial"
        ? "bg-yellow-500 text-white"
        : "bg-gray text-gray2";
    } else if (key === "Order Status") {
      badgeClass = isCompleted
        ? "bg-primary/20 text-primary"
        : isProcessing
        ? "bg-blue/20 text-blue"
        : isPending
        ? "bg-yellow/20 text-yellow"
        : "bg-gray text-gray2";
    }
    return (
      <td className={tableTdClasses(key)}>
        <span className={`px-3 py-1 rounded-md text-xs font-medium ${badgeClass}`}>
          {value}
        </span>
      </td>
    );
  }
  return defaultRenderer(key, value);
};

function manufacturingStatusBadgeClasses(status) {
  const s = String(status ?? "").trim();
  if (s === "Completed") {
    return "inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300";
  }
  if (s === "Failed") {
    return "inline-flex items-center rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700 dark:bg-red-900/40 dark:text-red-300";
  }
  if (s === "Planned") {
    return "inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300";
  }
  if (s === "In Progress") {
    return "text-sm font-medium text-blue";
  }
  if (s === "Paused") {
    return "inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800 dark:bg-amber-900/40 dark:text-amber-200";
  }
  return "inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600";
}

const manufacturingTableRenderer = (key, value, defaultRenderer) => {
  if (key === "Date" && value && /^\d{4}-\d{2}-\d{2}/.test(String(value))) {
    return (
      <td className={`${tableTdClasses(key)} text-slate-600 dark:text-slate-400`}>
        {dayjs(value).format("DD-MMM-YY")}
      </td>
    );
  }
  if (key === "Status") {
    return (
      <td className={tableTdClasses(key)}>
        <div className={STATUS_CELL_INNER}>
          <span className={manufacturingStatusBadgeClasses(value)}>{value}</span>
        </div>
      </td>
    );
  }
  return defaultRenderer(key, value);
};

export const voucherConfigs = {
  purchase: {
    title: "Purchase Voucher",
    columns: purchaseColumns,
    rowId: "Voucher No.",
    fetchDetail: fetchPurchaseDetail,
    detailsComponent: PurchaseDetails,
    /** Credit-card pay action opens this modal from the purchase list. */
    modals: [{ key: "payment-modal", component: PaymentModal }],
    enableColumnPicker: true,
    renderRowCell: purchasePaymentRenderer,
    filterFields: [
      voucherAddButton({
        key: "addPurchase",
        action: "purchase-open",
      }),
    ],
    footerRenderer: purchaseFooterRenderer,
    buildTableAction:
      ({
        openDetails,
        navigate,
        openPurchaseModal,
        deletePurchaseVoucher,
        createPaymentRequestForPurchase,
      }) =>
      (row) =>
        createActionButtons(
          [
            { type: "eye" },
            {
              type: "purchaseMarkPaid",
              tooltip: "Add payment voucher — select payee, then Save",
              paidTooltip: "Already paid",
              hasParty: (r) => purchaseRowHasParty(r),
              noPartyTooltip:
                "Select Party Name (supplier) on purchase — use Edit first",
              isDisabled: (r) => purchaseRowIsFullyPaid(r),
              disabledTooltip: "Purchase bill fully paid",
              onClick: (r) => createPaymentRequestForPurchase?.(r),
            },
            {
              type: "share",
              onClick: async (r) => {
                const text = buildPurchaseListRowSummary(r);
                const r0 = await shareOrCopyText(
                  `Purchase ${r["Voucher No."] || ""}`,
                  text
                );
                if (r0 === "shared") toast.success("Shared");
                else if (r0 === "copied")
                  toast.success("Voucher summary copied");
                else toast.error("Could not share or copy");
              },
            },
            {
              type: "exportCsv",
              onClick: (r) => {
                downloadPurchaseListRowCsv(r);
                toast.success("CSV downloaded");
              },
            },
            {
              type: "revoucher",
              onClick: (r) => openPurchaseModal?.(r, "revoucher"),
            },
            {
              type: "edit",
              onClick: (r) => openPurchaseModal?.(r, "edit"),
            },
            {
              type: "delete",
              onClick: async (r) => {
                if (
                  !window.confirm(
                    `Delete purchase voucher ${r["Voucher No."] || ""}?`
                  )
                ) {
                  return;
                }
                const id = r?._id;
                if (!id || typeof deletePurchaseVoucher !== "function") {
                  toast.error("Cannot delete this row (missing id).");
                  return;
                }
                try {
                  await deletePurchaseVoucher(id);
                  toast.success("Purchase voucher deleted.");
                } catch (e) {
                  toast.error(getApiErrorMessage(e, "Delete failed"));
                }
              },
            },
          ],
          { openDetails, navigate, row, openPurchaseModal }
        ),
  },
  "purchase-return": {
    title: "Purchase Return Voucher",
    columns: purchaseReturnColumns,
    rowId: "Voucher No.",
    fetchDetail: fetchPurchaseReturnDetail,
    detailsComponent: PurchaseDetails,
    enableColumnPicker: false,
    renderRowCell: purchaseReturnRowRenderer,
    /** Refund button opens receipt modal — must be registered on this slug too. */
    modals: [{ key: "receipt-modal", component: ReceiptModal }],
    filterFields: [
      voucherAddButton({
        key: "addPurchaseReturn",
        action: "purchase-return-open",
      }),
    ],
    footerRenderer: purchaseReturnFooterRenderer,
    buildTableAction:
      ({
        openDetails,
        navigate,
        openPurchaseReturnModal,
        deletePurchaseReturnVoucher,
        createRefundReceiptForPurchaseReturn,
      }) =>
      (row) =>
        createActionButtons(
          [
            { type: "eye" },
            {
              type: "purchaseReturnRefund",
              tooltip: "Refund from supplier — create receipt",
              refundTooltip: "Refund receipt already created",
              hasParty: (r) => purchaseReturnRowHasParty(r),
              hasRefund: (r) => purchaseReturnRowHasRefund(r),
              noPartyTooltip:
                "Set Party Name (supplier) on purchase return — use Edit first",
              onClick: (r) => createRefundReceiptForPurchaseReturn?.(r),
            },
            {
              type: "revoucher",
              onClick: (r) => openPurchaseReturnModal?.(r, "revoucher"),
            },
            {
              type: "edit",
              onClick: (r) => openPurchaseReturnModal?.(r, "edit"),
            },
            {
              type: "delete",
              onClick: async (r) => {
                if (
                  !window.confirm(
                    `Delete purchase return ${r["Voucher No."] || ""}?`
                  )
                ) {
                  return;
                }
                const id = r?._id;
                if (!id || typeof deletePurchaseReturnVoucher !== "function") {
                  toast.error("Cannot delete this row (missing id).");
                  return;
                }
                try {
                  await deletePurchaseReturnVoucher(id);
                  toast.success("Purchase return deleted.");
                } catch (e) {
                  toast.error(getApiErrorMessage(e, "Delete failed"));
                }
              },
            },
          ],
          { openDetails, navigate, row, openPurchaseReturnModal }
        ),
  },
  sales: {
    title: "Sales Voucher",
    columns: salesColumns,
    rowId: "Invoice No.",
    fetchDetail: fetchSalesOrderDetail,
    detailsComponent: SalesDetailsDrawer,
    enableColumnPicker: true,
    filterFields: [
      voucherAddButton({
        key: "addSales",
        action: "sales-open",
      }),
    ],
    renderRowCell: salesBadgeRenderer,
    buildTableAction:
      ({
        navigate,
        openDetails,
        openSalesModal,
        deleteSalesVoucher,
        createPaymentRequestForSale,
      }) =>
      (row) =>
        createActionButtons(
          [
            { type: "eye" },
            {
              type: "payReqSend",
              showCondition: false,
              tooltip: "Send payment request — adds a row to Payment Voucher",
              /**
               * Disable when this sale already has a linked Payment Voucher
               * (created via this same button). Backend also rejects a
               * duplicate request server-side as a defence in depth.
               */
              isDisabled: (r) => Boolean(r?._raw?.paymentRequestId),
              disabledTooltip: "Payment request already sent",
              onClick: (r) => createPaymentRequestForSale?.(r),
            },
            {
              type: "revoucher",
              onClick: (r) => openSalesModal?.(r, "revoucher"),
            },
            {
              type: "edit",
              onClick: (r) => openSalesModal?.(r, "edit"),
            },
            {
              type: "delete",
              onClick: async (r) => {
                if (
                  !window.confirm(
                    `Delete sales voucher ${r["Invoice No."] || ""}?`
                  )
                ) {
                  return;
                }
                const id = r?._id;
                if (!id || typeof deleteSalesVoucher !== "function") {
                  toast.error("Cannot delete this row (missing id).");
                  return;
                }
                try {
                  await deleteSalesVoucher(id);
                  toast.success("Sales voucher deleted.");
                } catch (e) {
                  toast.error(getApiErrorMessage(e, "Delete failed"));
                }
              },
            },
          ],
          { openDetails, navigate, row, openSalesModal }
        ),
    footerRenderer: salesFooterRenderer,
  },
"sales-return": {
  title: "Sales Return Voucher",
  columns: salesReturnColumns,
  rowId: "Invoice No.",
  emptyState: {
    title: "Sales returns not available",
    description:
      "There is no sales-return API in the backend yet. This screen will list returns once an endpoint is added.",
  },
  detailsComponent: PurchaseDetails,
  filterFields: [],
  renderRowCell: salesBadgeRenderer,
  buildTableAction:
    ({ navigate, openDetails }) =>
    (row) =>
      createActionButtons([], { openDetails, navigate, row }),
},
  payment: {
    title: "Payment Voucher",
    columns: paymentColumns,
    rowId: "Voucher No",
    fetchDetail: fetchPaymentDetail,
    detailsComponent: PaymentDetailsDrawer,
    modals: [{ key: "payment-modal", component: PaymentModal }],
    filterFields: [
      voucherAddButton({
        key: "addPayment",
        action: "open-modal",
        modalKey: "payment-modal",
      }),
    ],
    buildTableAction:
      ({ openDetails, navigate, markPaymentVoucherPaid, openPaymentEdit }) =>
      (row) =>
        createActionButtons(
          [
            { type: "eye" },
            {
              type: "edit",
              onClick: (r) => openPaymentEdit?.(r),
            },
            {
              type: "payNow",
              tooltip: "Mark voucher as Paid",
              paidTooltip: "Already paid",
              onClick: async (r) => {
                const id = r?._id;
                const voucherNo = r?.["Voucher No"] || "";
                const payTo = String(r.Party || "").trim();
                const paidFrom = String(
                  r["Paid From"] || r?._raw?.paymentFrom || ""
                ).trim();
                if (!payTo || payTo === "—") {
                  toast.error(
                    "Please select Payment To on this voucher (use Edit)."
                  );
                  return;
                }
                if (!paidFrom || paidFrom === "—") {
                  toast.error(
                    "Select Paid from (bank or cash) using Edit before marking Paid."
                  );
                  return;
                }
                if (!id || typeof markPaymentVoucherPaid !== "function") {
                  toast.error("Cannot update this voucher (missing id).");
                  return;
                }
                if (
                  !window.confirm(
                    `Mark payment voucher ${voucherNo} as Paid?`
                  )
                ) {
                  return;
                }
                try {
                  await markPaymentVoucherPaid(id);
                  toast.success(
                    voucherNo
                      ? `Voucher ${voucherNo} marked as Paid.`
                      : "Payment voucher marked as Paid."
                  );
                } catch (e) {
                  toast.error(getApiErrorMessage(e, "Could not update status"));
                }
              },
            },
          ],
          { openDetails, navigate, row }
        ),
    calculateSummary: (rows) => {
      const parseAmount = (amountStr) => {
        if (!amountStr) return 0;
        const numericStr = amountStr.replace(/[₹,\s]/g, "");
        return parseFloat(numericStr) || 0;
      };

      let totalAmount = 0;
      let cashAmount = 0;
      let bankAmount = 0;

      rows.forEach((row) => {
        const amount = parseAmount(row.Amount);
        totalAmount += amount;
        
        const mode = String(row.Mode || "").toLowerCase();
        if (mode === "cash") {
          cashAmount += amount;
        } else if (mode === "bank" || mode === "upi" || mode.includes("bank")) {
          bankAmount += amount;
        }
      });

      const formatCurrency = (amount) => {
        return `₹${amount.toLocaleString("en-IN")}`;
      };

      return {
        totalAmount: formatCurrency(totalAmount),
        cashAmount: formatCurrency(cashAmount),
        bankAmount: formatCurrency(bankAmount),
      };
    },
  },
  receipt: {
    title: "Receipt Voucher",
    columns: receiptColumns,
    rowId: "Voucher No",
    fetchDetail: fetchReceiptDetail,
    detailsComponent: ReceiptPaymentView,
    modals: [{ key: "receipt-modal", component: ReceiptModal }],
    filterFields: [
      voucherAddButton({
        key: "addReceipt",
        action: "open-modal",
        modalKey: "receipt-modal",
      }),
    ],
    buildTableAction:
      ({ openDetails, navigate, openReceiptEdit, openReceiptRecordReceived }) =>
      (row) =>
        createActionButtons(
          [
            { type: "eye" },
            {
              type: "receiptReceive",
              tooltip:
                "Record refund — select Received in (bank/cash) and save",
              receivedTooltip: "Already received",
              onClick: (r) => openReceiptRecordReceived?.(r),
            },
            {
              type: "edit",
              tooltip: "Edit receipt voucher",
              onClick: (r) => openReceiptEdit?.(r),
            },
          ],
          { openDetails, navigate, row }
        ),
  },
  expenses: {
    title: "Expense Voucher",
    columns: expensesColumns,
    rowId: "Date",
    modals: [{ key: "expense-modal", component: ExpenseModal }],
    renderRowCell: expenseTableRenderer,
    filterFields: [
      voucherAddButton({
        key: "addExpense",
        action: "open-modal",
        modalKey: "expense-modal",
      }),
    ],
    buildTableAction:
      ({ openDetails, navigate, openExpenseEdit, attachExpenseProof }) =>
      (row) =>
        createActionButtons(
          [
            {
              type: "edit",
              onClick: () => openExpenseEdit?.(row),
            },
            {
              type: "attach",
              onClick: () => attachExpenseProof?.(row),
            },
          ],
          { openDetails, navigate, row }
        ),
  },
  cash: {
    title: "Cash Voucher",
    columns: cashColumns,
    rowId: "Voucher No",
    renderRowCell: formatIsoDateRow,
    modals: [{ key: "cash-transfer-modal", component: CashTransferModal }],
    filterFields: [
      voucherAddButton({
        key: "cashTransfer",
        action: "open-modal",
        modalKey: "cash-transfer-modal",
      }),
    ],
    footerRenderer: cashBankFooterRenderer("Debit (Outflow)"),
    buildTableAction:
      ({ openDetails, navigate }) =>
      (row) =>
        createActionButtons([{ type: "eye" }], { openDetails, navigate, row }),
  },
  bank: {
    title: "Bank Voucher",
    columns: bankColumns,
    rowId: "Voucher No",
    modals: [{ key: "bank-to-cash-modal", component: BankToCashModal }],
    renderRowCell: formatIsoDateRow,
    filterFields: [
      voucherAddButton({
        key: "addBank",
        action: "open-modal",
        modalKey: "bank-to-cash-modal",
      }),
    ],
    footerRenderer: cashBankFooterRenderer("Balance"),
    buildTableAction:
      ({ openDetails, navigate }) =>
      (row) =>
        createActionButtons([{ type: "eye" }], { openDetails, navigate, row }),
  },
  manufacturing: {
    title: "Manufacturing",
    columns: manufacturingColumns,
    emptyState: {
      title: "No manufacturing batches yet",
      description:
        "Use Add to start a batch. Save as planned, then start from the list when raw stock is available.",
    },
    rowId: "Batch ID",
    renderRowCell: manufacturingTableRenderer,
    filterFields: [
      voucherAddButton({
        key: "addManufacturing",
        action: "navigate",
        path: "/dashboard/accounting-voucher/add-manufacturing",
      }),
    ],
    fetchDetail: fetchManufacturingDetail,
    detailsComponent: ManufacturingDetailsDrawer,
    buildTableAction:
      ({
        openDetails,
        navigate,
        startManufacturingBatch,
        completeManufacturingBatch,
        deleteManufacturingBatch,
        openFailManufacturingForm,
        openMfgBlockedModal,
      }) =>
      (row) => {
        const status = String(row?.Status ?? "");
        const stockBlocked =
          Boolean(row?.stockBlocked) ||
          (Array.isArray(row?.stockIssues) && row.stockIssues.length > 0) ||
          (Array.isArray(row?._raw?.stockIssues) &&
            row._raw.stockIssues.length > 0);
        if (status === "Failed") {
          return createActionButtons(
            [
              {
                type: "eye",
                tooltip: "View reason",
                onClick: () => openDetails?.(row),
              },
            ],
            { openDetails, navigate, row }
          );
        }
        if (status === "Paused" || stockBlocked) {
          const blockedActions = [
            {
              type: "eye",
              tooltip: "View batch",
              onClick: () => openDetails?.(row),
            },
            {
              type: "mfgPause",
              tooltip: "Low stock — view details",
              onClick: () => openMfgBlockedModal?.(row),
            },
            {
              type: "mfgStop",
              tooltip: "Mark failed",
              onClick: () => openFailManufacturingForm?.(row),
            },
          ];
          return createActionButtons(blockedActions, {
            openDetails,
            navigate,
            row,
          });
        }
        const actions = [
          {
            type: "eye",
            tooltip: "View batch",
            onClick: () => openDetails?.(row),
          },
        ];
        const rawStatus = String(row?._raw?.status ?? "");
        if (rawStatus === "Planned" || status === "Planned") {
          actions.push({
            type: "mfgStart",
            onClick: () => startManufacturingBatch?.(row),
          });
          actions.push({
            type: "delete",
            tooltip: "Delete planned batch",
            onClick: () => deleteManufacturingBatch?.(row),
          });
        }
        if (rawStatus === "In Progress" || status === "In Progress") {
          actions.push({
            type: "mfgStop",
            tooltip: "Mark failed",
            onClick: () => openFailManufacturingForm?.(row),
          });
          actions.push({
            type: "mfgComplete",
            tooltip: "Add warehouse / complete",
            onClick: () => completeManufacturingBatch?.(row),
          });
        }
        return createActionButtons(actions, { openDetails, navigate, row });
      },
  },
  journal: {
    title: "Journal",
    columns: journalColumns,
    rowId: "Entry No",
    fetchDetail: fetchJournalDetail,
    detailsComponent: JournalDetailsDrawer,
    modals: [{ key: "journal-modal", component: JournalModal }],
    filterFields: [
      voucherAddButton({
        key: "addJournal",
        action: "open-modal",
        modalKey: "journal-modal",
      }),
    ],
    buildTableAction:
      ({ openDetails, navigate, openJournalEdit, onVoucherDocument }) =>
      (row) =>
        createActionButtons(
          [
            { type: "eye" },
            {
              type: "edit",
              onClick: () => openJournalEdit?.(row),
            },
            {
              type: "voucherDocument",
              onClick: () => onVoucherDocument?.(row),
            },
          ],
          { openDetails, navigate, row }
        ),
  },
  quotation: {
    title: "Quotation Voucher",
    columns: quotationColumns,
    rowId: "Quote No",
    fetchDetail: fetchQuotationDetail,
    detailsComponent: PurchaseDetails,
    emptyState: {
      title: "No quotations yet",
      description:
        "Use Add voucher to create a quotation. Filters apply once you have records.",
    },
    filterFields: [
      voucherAddButton({
        key: "addQuotation",
        action: "navigate",
        path: "/dashboard/accounting-voucher/add-quotation",
      }),
    ],
    buildTableAction:
      ({ openDetails, navigate, deleteQuotationVoucher }) =>
      (row) =>
        createActionButtons(
          [
            { type: "eye" },
            {
              type: "edit",
              onClick: (r) => {
                const id = r?._id;
                if (!id) {
                  toast.error("Cannot edit this row (missing id).");
                  return;
                }
                navigate(
                  `/dashboard/accounting-voucher/add-quotation?editId=${encodeURIComponent(id)}`
                );
              },
            },
            {
              type: "delete",
              onClick: async (r) => {
                if (
                  !window.confirm(
                    `Delete quotation ${r["Quote No"] || ""}?`
                  )
                ) {
                  return;
                }
                const id = r?._id;
                if (!id || typeof deleteQuotationVoucher !== "function") {
                  toast.error("Cannot delete this row (missing id).");
                  return;
                }
                try {
                  await deleteQuotationVoucher(id);
                  toast.success("Quotation deleted.");
                } catch (e) {
                  toast.error(getApiErrorMessage(e, "Delete failed"));
                }
              },
            },
          ],
          { openDetails, navigate, row }
        ),
  },
};

