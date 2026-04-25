import React, { useMemo, useState, useEffect, useCallback } from "react";
import dayjs from "dayjs";
import DashboardLayout from "../../layouts/DashboardLayout";
import DataTable from "../../components/ui/table/DataTable";
import { CommonModal } from "../../components/ui/CommanUI";
import { Calendar } from "lucide-react";
import { IoEyeOutline } from "react-icons/io5";
import { CreditCard } from "lucide-react";
import PayNowModal from "./PayNowModal";
import { dashboardUiService } from "../../services/dashboardUi.service";
import { TABLE_ACTION_ICON_BTN, tableFooterTdClasses } from "../../utils/tableUi";
import toast from "react-hot-toast";

const PayableIndex = () => {
  const [isPayNowOpen, setIsPayNowOpen] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [headerTime, setHeaderTime] = useState(() => dayjs());
  const [viewRow, setViewRow] = useState(null);

  useEffect(() => {
    const id = setInterval(() => setHeaderTime(dayjs()), 60_000);
    return () => clearInterval(id);
  }, []);

  const columns = useMemo(
    () => [
      "Voucher No",
      "Date",
      "Payment Through",
      "Payment To",
      "Amount (₹)",
      "Narration",
      "Status",
      "Action",
    ],
    []
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await dashboardUiService.getPayables({});
      setRows(data.payables || []);
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to load payables");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handlePayNow = (row) => {
    setSelectedVoucher(row);
    setIsPayNowOpen(true);
  };

  const statusClass = (status) => {
    const s = String(status).toLowerCase();
    if (s === "paid")
      return "bg-[#E6FFFA] text-[#2C8C7E] dark:bg-emerald-950 dark:text-emerald-300";
    return "bg-gray-100 text-gray-700 dark:bg-slate-700 dark:text-slate-200";
  };

  const renderRowCell = (key, value, row) => {
    if (key === "Status") {
      return (
        <td
          key={key}
          className="px-3 py-2.5 text-center align-middle border-b border-gray-200 dark:border-slate-700"
        >
          <span
            className={`px-3 py-1 rounded-md text-xs font-medium inline-flex ${statusClass(
              value
            )}`}
          >
            {value}
          </span>
        </td>
      );
    }
    const isAmount = key === "Amount (₹)";
    return (
      <td
        key={key}
        className={`px-3 py-2.5 align-middle border-b border-gray-200 text-sm text-gray-800 dark:border-slate-700 dark:text-slate-200 ${
          isAmount ? "text-right tabular-nums" : "text-left text-gray-600 dark:text-slate-300"
        }`}
      >
        {value ?? "—"}
      </td>
    );
  };

  const renderAction = (row) => {
    if (row.Status === "Paid") {
      return (
        <td className="px-3 py-2.5 text-center text-gray-400 border-b border-gray-200 align-middle dark:border-slate-700 dark:text-slate-500">
          —
        </td>
      );
    }
    return (
      <td className="px-3 py-2.5 align-middle border-b border-gray-200 dark:border-slate-700">
        <div className="flex items-center justify-center gap-2">
          <button
            type="button"
            title="View"
            className={TABLE_ACTION_ICON_BTN}
            onClick={(e) => {
              e.stopPropagation();
              setViewRow(row);
            }}
          >
            <IoEyeOutline size={18} strokeWidth={2} />
          </button>
          <button
            type="button"
            title="Pay now"
            className={TABLE_ACTION_ICON_BTN}
            onClick={(e) => {
              e.stopPropagation();
              handlePayNow(row);
            }}
          >
            <CreditCard size={18} strokeWidth={2} />
          </button>
        </div>
      </td>
    );
  };

  const renderFooter = (displayedRows = []) => {
    const sum = displayedRows.reduce((acc, r) => {
      const n = Number(String(r["Amount (₹)"] ?? "").replace(/,/g, ""));
      return acc + (Number.isFinite(n) ? n : 0);
    }, 0);
    return (
      <tfoot className="sticky bottom-0 z-20 border-t border-light-border bg-headBg dark:border-slate-700 dark:bg-slate-800">
        <tr>
          {columns.map((col) => {
            if (col === "Voucher No") {
              return (
                <td key={col} className={tableFooterTdClasses(col, { variant: "head" })}>
                  Total
                </td>
              );
            }
            if (col === "Payment To") {
              return (
                <td
                  key={col}
                  className={tableFooterTdClasses(col, {
                    variant: "head",
                    alignClass: "text-right font-normal",
                  })}
                >
                  Total Payables (₹)
                </td>
              );
            }
            if (col === "Amount (₹)") {
              return (
                <td
                  key={col}
                  className={tableFooterTdClasses(col, {
                    variant: "head",
                    extra: "font-bold",
                  })}
                >
                  ₹{sum.toLocaleString("en-IN")}
                </td>
              );
            }
            return <td key={col} className={tableFooterTdClasses(col, { variant: "head" })} />;
          })}
        </tr>
      </tfoot>
    );
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-3 min-w-0 max-w-full">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Payable Summary</h1>
          <div className="jitox-header-pill">
            <span>{headerTime.format("DD MMM, h:mm A")}</span>
            <Calendar size={16} className="shrink-0 text-current" />
          </div>
        </div>

        <div className="rounded-xl jitox-panel jitox-panel--shadow p-3 sm:p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Payables</h2>
          </div>

          <DataTable
            columns={columns}
            data={rows}
            loading={loading}
            renderRowCell={renderRowCell}
            renderAction={renderAction}
            renderFooter={renderFooter}
            maxHeight="none"
          />
        </div>

        <PayNowModal
          open={isPayNowOpen}
          onClose={() => setIsPayNowOpen(false)}
          voucherData={selectedVoucher}
          onSaved={load}
        />

        <CommonModal
          open={Boolean(viewRow)}
          onClose={() => setViewRow(null)}
          title="Payable voucher"
          width="480px"
        >
          {viewRow && (
            <dl className="space-y-2 text-sm">
              {columns
                .filter((c) => c !== "Action")
                .map((col) => (
                  <div
                    key={col}
                    className="grid grid-cols-2 gap-2 border-b border-light-border pb-2 last:border-0 dark:border-slate-700"
                  >
                    <dt className="text-light font-medium dark:text-slate-400">{col}</dt>
                    <dd className="text-dark dark:text-slate-100">
                      {String(viewRow[col] ?? "—")}
                    </dd>
                  </div>
                ))}
            </dl>
          )}
        </CommonModal>
      </div>
    </DashboardLayout>
  );
};

export default PayableIndex;
