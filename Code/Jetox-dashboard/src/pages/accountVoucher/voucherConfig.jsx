import dayjs from "dayjs";
import toast from "react-hot-toast";
import customParseFormat from "dayjs/plugin/customParseFormat";
import PurchaseDetails from "./purchase/PurchaseDetails";
import {
  fetchPurchaseDetail,
  fetchPurchaseReturnDetail,
  fetchSalesOrderDetail,
} from "./voucherDetailFetchers.jsx";
import { parseRupeeCell, fmtRupee } from "../../utils/voucherRowMappers";
import {
  STATUS_CELL_INNER,
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

dayjs.extend(customParseFormat);
import { IoEyeOutline } from "react-icons/io5";
import { TbEdit } from "react-icons/tb";
import {
  BadgeCheck,
  CreditCard,
  FileSpreadsheet,
  Paperclip,
  Plus,
  Share2,
  Trash2,
} from "lucide-react";
import PaymentModal from "./modals/PaymentModal";
import ReceiptModal from "./modals/ReceiptModal";
import ExpenseModal from "./modals/ExpenseModal";
import CashTransferModal from "./modals/CashTransferModal";
import BankToCashModal from "./modals/BankToCashModal";
import JournalModal from "./modals/JournalModal";

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
  let debit = 0;
  let credit = 0;
  rows.forEach((r) => {
    debit += parseRupeeCell(r["Debit Amount"]);
    credit += parseRupeeCell(r["Credit Amount"]);
  });
  return withFooter(columns, [
    { column: "Party Name", content: "Grand Total" },
    { column: "Debit Amount", content: fmtRupee(debit) },
    { column: "Credit Amount", content: fmtRupee(credit) },
  ]);
};

const purchaseReturnFooterRenderer = (columns, rows = []) => {
  let debit = 0;
  rows.forEach((r) => {
    debit += parseRupeeCell(r["Debit Amount"]);
  });
  return withFooter(columns, [
    { column: "Party Name", content: "Grand Total" },
    { column: "Debit Amount", content: fmtRupee(debit) },
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
  "Debit Amount",
  "Credit Amount",
  "Due Date",
  "Payment Status",
  "Actions",
];

const purchaseReturnColumns = [
  "Date",
  "Party Name",
  "Voucher No.",
  "Debit Amount",
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
  "Mode",
  "Amount",
  "Status",
  "Actions",
];

const receiptColumns = [
  "Voucher No",
  "Date",
  "Receipt Through",
  "Receipt Form",
  "Amount (₹)",
  "Narration",
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
  "Batch",
  "Product",
  "Qty",
  "Start Date",
  "End Date",
  "Status",
  "Actions",
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
const voucherAddButton = (overrides) => ({
  type: "button",
  label: "Add voucher",
  ...mergePageAddButton(overrides),
});

// Helper function to create action buttons with tooltips
const createActionButtons = (actions, { openDetails, navigate, row, openPurchaseModal }) => {
  const tooltipLabels = {
    eye: "View",
    payNow: "Pay Now",
    payReqSend: "Request send Pay Now",
    edit: "Edit",
    revoucher: "Re-voucher",
    share: "Share / export",
    exportCsv: "Download Excel (CSV)",
    attach: "Attach",
    approve: "Approve",
    delete: "Delete",
  };

  const renderButtonWithTooltip = (button, tooltipText, key) => {
    return (
      <div key={key} className="relative group">
        {button}
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-dark text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 z-50">
          {tooltipText}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-dark"></div>
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
            // Only show if status is Pending (unless condition is disabled)
            if (action.showCondition !== false && row.Status !== "Pending") return null;
            return renderButtonWithTooltip(
              <button
                type="button"
                onClick={() => {
                  if (action.onClick) action.onClick(row, navigate);
                  else
                    toast.success(
                      `Record payment for ${row.Party || "party"} — use Add voucher on the list.`
                    );
                }}
                className="hover:text-blue transition"
                aria-label="Pay now"
              >
                <CreditCard size={18} />
              </button>,
              action.tooltip || tooltipLabels.payNow,
              index
            );
          }
          if (action.type === "payReqSend") {
            // Only show if status is Pending (unless condition is disabled)
            if (action.showCondition !== false && row.Status !== "Pending") return null;
            return renderButtonWithTooltip(
              <button
                type="button"
                onClick={() => {
                  if (action.onClick) action.onClick(row, navigate);
                  else toast.success("Payment request flow opens from Add voucher on the list.");
                }}
                className="hover:text-blue transition"
                aria-label="Request Send Pay Now"
              >
                <CreditCard size={18} />
              </button>,
              action.tooltip || tooltipLabels.payReqSend,
              index
            );
          }
          if (action.type === "revoucher") {
            return renderButtonWithTooltip(
              <button
                type="button"
                onClick={() => action.onClick?.(row)}
                className="text-xs font-semibold text-primary hover:underline px-0.5"
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
    const v = String(value).toLowerCase();
    let cls = "bg-gray-200 text-gray-700";
    if (v === "paid") cls = "bg-primary text-white";
    if (v === "pending") cls = "bg-gray-100 text-gray-600 border border-gray-200";
    return (
      <td className={tableTdClasses(key)}>
        <div className={STATUS_CELL_INNER}>
          <span
            className={`inline-flex px-3 py-1 rounded-md text-xs font-medium ${cls}`}
          >
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

const expenseTableRenderer = (key, value, defaultRenderer) => {
  if (key === "Date") {
    return formatIsoDateRow(key, value, defaultRenderer);
  }
  if (key === "Proof") {
    if (value === "view") {
      return (
        <td className={tableTdClasses(key)}>
          <button
            type="button"
            className="text-blue text-sm font-medium hover:underline"
            onClick={() =>
              toast.success("Proof opens from Documents when linked to this expense.")
            }
          >
            View
          </button>
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

export const voucherConfigs = {
  purchase: {
    title: "Purchase Voucher",
    columns: purchaseColumns,
    rowId: "Voucher No.",
    fetchDetail: fetchPurchaseDetail,
    detailsComponent: PurchaseDetails,
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
      }) =>
      (row) =>
        createActionButtons(
          [
            { type: "eye" },
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
    filterFields: [],
    footerRenderer: purchaseReturnFooterRenderer,
    buildTableAction:
      ({ openDetails, navigate, deletePurchaseReturnVoucher }) =>
      (row) =>
        createActionButtons(
          [
            { type: "eye" },
            {
              type: "edit",
              onClick: (_row, navigate) => {
                navigate("/dashboard/accounting-voucher/add-purchase");
                toast.success("Use purchase return flow when available; form opened for reference.");
              },
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
          { openDetails, navigate, row }
        ),
  },
  sales: {
    title: "Sales Voucher",
    columns: salesColumns,
    rowId: "Invoice No.",
    fetchDetail: fetchSalesOrderDetail,
    detailsComponent: PurchaseDetails,
    filterFields: [],
    renderRowCell: salesBadgeRenderer,
    buildTableAction:
      ({ navigate, openDetails }) =>
      (row) =>
        createActionButtons(
          [{ type: "eye" }, { type: "payReqSend", showCondition: false }],
          { openDetails, navigate, row }
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
    modals: [{ key: "payment-modal", component: PaymentModal }],
    filterFields: [
      voucherAddButton({
        key: "addPayment",
        action: "open-modal",
        modalKey: "payment-modal",
      }),
    ],
    buildTableAction:
      ({ openDetails, navigate }) =>
      (row) =>
        createActionButtons(
          [
            { type: "eye" },
            {
              type: "payNow",
              onClick: (_row, navigate) => {
                navigate("/dashboard/accounting-voucher/payment");
                toast.success("Use Add voucher on the list to settle this voucher.");
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
    modals: [{ key: "receipt-modal", component: ReceiptModal }],
    filterFields: [
      voucherAddButton({
        key: "addReceipt",
        action: "open-modal",
        modalKey: "receipt-modal",
      }),
    ],
    buildTableAction:
      ({ openDetails, navigate }) =>
      (row) =>
        createActionButtons([{ type: "eye" }], { openDetails, navigate, row }),
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
      ({ openDetails, navigate }) =>
      (row) =>
        createActionButtons(
          [
            {
              type: "edit",
              onClick: (_r, navigate) => {
                navigate("/dashboard/accounting-voucher/expenses");
                toast.success("Use Add voucher on the list to record adjustments.");
              },
            },
            {
              type: "attach",
              onClick: () => {
                const input = document.createElement("input");
                input.type = "file";
                input.accept = ".pdf,image/*";
                input.onchange = () => {
                  const f = input.files?.[0];
                  toast.success(f ? `Selected: ${f.name}` : "No file selected");
                };
                input.click();
              },
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
      title: "No manufacturing API",
      description:
        "Manufacturing batches are not exposed by the backend yet. Add a manufacturing route in Jitox-api to populate this list.",
    },
    rowId: "Batch",
    filterFields: [
      voucherAddButton({
        key: "addManufacturing",
        action: "navigate",
        path: "/dashboard/accounting-voucher/add-manufacturing",
      }),
    ],
  },
  journal: {
    title: "Journal",
    columns: journalColumns,
    rowId: "Entry No",
    modals: [{ key: "journal-modal", component: JournalModal }],
    filterFields: [
      voucherAddButton({
        key: "addJournal",
        action: "open-modal",
        modalKey: "journal-modal",
      }),
    ],
  },
  quotation: {
    title: "Quotation Voucher",
    columns: quotationColumns,
    rowId: "Quote No",
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
  },
};

