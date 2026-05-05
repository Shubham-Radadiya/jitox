import React, { useMemo } from "react";
import DataTable from "../../../components/ui/table/DataTable";
import { Plus, Paperclip, Edit3 } from "lucide-react";
import { tableTdClasses } from "../../../utils/tableUi";

const ExpensesTab = () => {
  const columns = [
    "Date",
    "Expense Type",
    "Description",
    "Paid To",
    "Amount",
    "Mode",
    "Proof",
    "Action",
  ];

  const data = useMemo(
    () => [
      {
        Date: "02 Jan 2025",
        "Expense Type": "Logistics",
        Description: "Courier Charges",
        "Paid To": "DTDC",
        Amount: "₹3,000",
        Mode: "UPI",
        Proof: "View",
        Action: true,
      },
      {
        Date: "02 Feb 2025",
        "Expense Type": "Office Supplies",
        Description: "Printer Toner",
        "Paid To": "Stationery Mart",
        Amount: "₹2,500",
        Mode: "Cash",
        Proof: "-",
        Action: true,
      },
      {
        Date: "22 Jan 2025",
        "Expense Type": "Fuel",
        Description: "Travel To Client Site",
        "Paid To": "BP Petrol Pump",
        Amount: "₹800",
        Mode: "UPI",
        Proof: "View",
        Action: true,
      },
      {
        Date: "20 Feb 2025",
        "Expense Type": "Internet",
        Description: "Monthly Recharge",
        "Paid To": "Jio",
        Amount: "₹1,200",
        Mode: "Credit Card",
        Proof: "-",
        Action: true,
      },
    ],
    []
  );

  const renderRowCell = (colKey, value) => {
    const cell = `${tableTdClasses(colKey)} text-left!`;

    if (colKey === "Proof") {
      return (
        <td className={cell}>
          {value === "View" ? (
            <button
              type="button"
              className="text-sm font-medium text-primary underline decoration-primary/60 underline-offset-2 hover:text-primary/90"
            >
              View
            </button>
          ) : (
            <span className="text-slate-400 dark:text-slate-500">-</span>
          )}
        </td>
      );
    }

    if (colKey === "Amount") {
      return (
        <td className={cell}>
          <span className="font-bold italic text-slate-900 tabular-nums dark:text-slate-100">
            {value}
          </span>
        </td>
      );
    }

    return (
      <td className={cell}>
        <span className="text-sm text-slate-600 dark:text-slate-300">{value}</span>
      </td>
    );
  };

  const renderExpenseAction = () => (
    <td className={`${tableTdClasses("Action")} text-left!`}>
      <div className="flex items-center justify-start gap-2">
        <button
          type="button"
          title="Edit expense"
          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 shadow-sm transition-colors hover:bg-slate-50 hover:text-emerald-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-emerald-400"
          onClick={(e) => e.stopPropagation()}
        >
          <Edit3 size={16} />
        </button>
        <button
          type="button"
          title="Attachment"
          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 shadow-sm transition-colors hover:bg-slate-50 hover:text-emerald-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-emerald-400"
          onClick={(e) => e.stopPropagation()}
        >
          <Paperclip size={16} />
        </button>
      </div>
    </td>
  );

  return (
    <div className="flex min-w-0 flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3 px-0.5">
        <h3 className="text-lg font-bold text-dark">Expenses</h3>
        <button
          type="button"
          className="rounded-lg bg-primary p-2.5 text-white shadow-sm transition-colors hover:bg-primary/90"
          title="Add expense"
        >
          <Plus size={20} />
        </button>
      </div>

      <div className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm ring-1 ring-slate-900/4 dark:border-slate-600 dark:bg-slate-900 dark:shadow-[0_2px_12px_rgba(0,0,0,0.35)] dark:ring-white/6">
        <DataTable
          columns={columns}
          data={data}
          renderRowCell={renderRowCell}
          renderAction={renderExpenseAction}
          allCellsLeft
          className="rounded-none border-0 shadow-none ring-0"
        />

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-50/80 px-3 py-3 text-sm dark:border-slate-600 dark:bg-slate-800/50 sm:px-4">
          <div className="font-bold text-slate-900 dark:text-slate-100">
            Total Expenses Incurred:{" "}
            <span className="tabular-nums italic">₹1,75,000</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span>Results per page:</span>
            <select className="cursor-pointer border-0 bg-transparent font-bold text-slate-900 outline-none dark:text-slate-100">
              <option>4</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpensesTab;
