import React, { useMemo, useState } from "react";
import DataTable from "../../../components/ui/table/DataTable";
import { Plus, Paperclip, Edit3, CalendarDays, CircleDot, Search } from "lucide-react";
import { tableTdClasses } from "../../../utils/tableUi";

const ExpensesTab = ({ expenses: expensesProp, liveData = false }) => {
  const [expenseTypeSearch, setExpenseTypeSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [modeFilter, setModeFilter] = useState("");

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
    () => {
      if (liveData) return Array.isArray(expensesProp) ? expensesProp : [];
      if (expensesProp?.length) return expensesProp;
      return [
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
    ];
    },
    [expensesProp, liveData]
  );

  const dateOptions = useMemo(() => {
    const seen = new Set(data.map((row) => String(row.Date || "").trim()).filter(Boolean));
    return [...seen].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
  }, [data]);

  const modeOptions = useMemo(() => {
    const seen = new Set(data.map((row) => String(row.Mode || "").trim()).filter(Boolean));
    return [...seen].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
  }, [data]);

  const filteredData = useMemo(() => {
    return data.filter((row) => {
      if (
        expenseTypeSearch &&
        !String(row["Expense Type"] || "")
          .toLowerCase()
          .includes(expenseTypeSearch.toLowerCase().trim())
      ) {
        return false;
      }
      if (dateFilter && String(row.Date) !== dateFilter) return false;
      if (modeFilter && String(row.Mode) !== modeFilter) return false;
      return true;
    });
  }, [data, expenseTypeSearch, dateFilter, modeFilter]);

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
      <div className="flex w-full min-w-0 flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <div className="inline-flex w-fit max-w-full flex-nowrap items-center gap-0.5 rounded-lg bg-slate-100/90 p-0.5 whitespace-nowrap dark:bg-slate-800/80">
          <button
            type="button"
            className="shrink-0 rounded-md bg-white px-2 py-0.5 text-[10px] font-semibold text-primary shadow-sm ring-1 ring-primary/15 dark:bg-slate-900 dark:ring-primary/25 sm:rounded-lg sm:px-4 sm:py-1 sm:text-[13px]"
          >
            My Data
          </button>
          <button
            type="button"
            className="shrink-0 rounded-md px-2 py-0.5 text-[10px] font-semibold text-slate-500 transition-colors hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 sm:rounded-lg sm:px-4 sm:py-1 sm:text-[13px]"
          >
            User (10)
          </button>
        </div>

        <div className="flex w-full min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-end lg:w-auto">
          <div className="relative w-full sm:w-44">
            <CalendarDays
              size={14}
              className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <select
              className="h-9 w-full rounded-lg border border-light-border bg-white pl-7 pr-2 text-[13px] text-dark dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              aria-label="Filter by date"
            >
              <option value="">Date</option>
              {dateOptions.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>

          <div className="relative w-full sm:w-44">
            <CircleDot
              size={14}
              className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <select
              className="h-9 w-full rounded-lg border border-light-border bg-white pl-7 pr-2 text-[13px] text-dark dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
              value={modeFilter}
              onChange={(e) => setModeFilter(e.target.value)}
              aria-label="Filter by mode"
            >
              <option value="">Status</option>
              {modeOptions.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>

        </div>
      </div>

      <div className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm ring-1 ring-slate-900/4 dark:border-slate-600 dark:bg-slate-900 dark:shadow-[0_2px_12px_rgba(0,0,0,0.35)] dark:ring-white/6">
        <div className="flex w-full min-w-0 flex-col gap-2 border-b border-slate-200 bg-slate-50/70 px-3 py-2 dark:border-slate-600 dark:bg-slate-800/40 sm:flex-row sm:items-center sm:justify-between sm:px-4">
          <h3 className="text-lg font-bold text-dark dark:text-slate-100">Expenses</h3>

          <div className="flex w-full min-w-0 flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:justify-end">
            <button
              type="button"
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-white shadow-sm transition-colors hover:bg-primary/90"
              title="Add expense"
            >
              <Plus size={18} />
            </button>

            <div className="relative w-full sm:w-44">
              <Search
                size={14}
                className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={expenseTypeSearch}
                onChange={(e) => setExpenseTypeSearch(e.target.value)}
                placeholder="Expense Type"
                className="h-9 w-full rounded-lg border border-light-border bg-white pl-7 pr-2 text-[13px] text-dark placeholder:text-slate-400 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                aria-label="Search by expense type"
              />
            </div>

            <select
              className="h-9 w-full rounded-lg border border-light-border bg-white px-2 text-[13px] text-dark dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 sm:w-40"
              value={modeFilter}
              onChange={(e) => setModeFilter(e.target.value)}
              aria-label="Filter by mode"
            >
              <option value="">Mode</option>
              {modeOptions.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>

            <select
              className="h-9 w-full rounded-lg border border-light-border bg-white px-2 text-[13px] text-dark dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 sm:w-40"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              aria-label="Filter by date"
            >
              <option value="">Date</option>
              {dateOptions.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={filteredData}
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
