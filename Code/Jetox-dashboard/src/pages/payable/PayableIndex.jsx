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
import {
  TABLE_ACTION_ICON_BTN,
  tableFooterTdClasses,
  tableTdClasses,
} from "../../utils/tableUi";
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

  const renderRowCell = (key, value, _row) => {
    if (key === "Status") {
      return (
        <td key={key} className={tableTdClasses("Status")}>
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
        className={`${tableTdClasses(key)} ${
          isAmount ? "" : "text-gray-600 dark:text-slate-300"
        }`}
      >
        {value ?? "—"}
      </td>
    );
  };

  const renderAction = (row) => {
    const isPaid = String(row.Status || "").toLowerCase() === "paid";
    return (
      <td className={tableTdClasses("Action")}>
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
          {!isPaid ? (
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
          ) : null}
        </div>
      </td>
    );
  };

  const parsePayableAmount = (row) => {
    if (typeof row?.amountValue === "number" && Number.isFinite(row.amountValue)) {
      return row.amountValue;
    }
    const n = Number(
      String(row?.["Amount (₹)"] ?? "")
        .replace(/[₹,\s]/g, "")
    );
    return Number.isFinite(n) ? n : 0;
  };

  const renderFooter = (displayedRows = []) => {
    const sum = displayedRows.reduce(
      (acc, r) => acc + parsePayableAmount(r),
      0
    );
    const footerTop =
      "border-t-2 border-t-slate-200 dark:border-t-slate-600";
    return (
      <tfoot className="sticky bottom-0 z-20 bg-headBg dark:bg-slate-800">
        <tr>
          {columns.map((col) => {
            if (col === "Voucher No") {
              return (
                <td
                  key={col}
                  className={tableFooterTdClasses(col, {
                    variant: "head",
                    extra: footerTop,
                  })}
                >
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
                    extra: footerTop,
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
                    extra: `${footerTop} font-bold`,
                  })}
                >
                  ₹{sum.toLocaleString("en-IN")}
                </td>
              );
            }
            return (
              <td
                key={col}
                className={tableFooterTdClasses(col, {
                  variant: "head",
                  extra: footerTop,
                })}
              />
            );
          })}
        </tr>
      </tfoot>
    );
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-2 sm:gap-4 min-w-0 max-w-full">
        <div className="flex min-w-0 flex-nowrap items-center justify-between gap-2 sm:gap-3">
          <h1 className="min-w-0 flex-1 truncate whitespace-nowrap text-sm font-semibold tracking-tight text-slate-900 dark:text-slate-100 sm:text-xl sm:font-bold sm:tracking-normal">
            Payable Summary
          </h1>
          <div className="jitox-header-pill shrink-0 gap-1.5 whitespace-nowrap px-2 py-1 text-[11px] leading-none sm:gap-2 sm:px-3 sm:py-1.5 sm:text-sm sm:leading-normal">
            <span className="shrink-0">{headerTime.format("DD MMM, h:mm A")}</span>
            <Calendar className="h-3.5 w-3.5 shrink-0 text-current opacity-80 sm:h-4 sm:w-4" aria-hidden />
          </div>
        </div>

        <div className="flex flex-col gap-1 rounded-xl jitox-panel jitox-panel--shadow p-3 sm:gap-2 sm:p-4">
          <h2 className="text-base font-semibold leading-tight text-slate-900 dark:text-slate-100 sm:text-lg">
            Payables
          </h2>

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
            <dl className="mb-0 space-y-2 text-sm">
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
