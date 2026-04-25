import React, { useMemo, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import DashboardLayout from "../../layouts/DashboardLayout";
import DataTable from "../../components/ui/table/DataTable";
import { CommonModal } from "../../components/ui/CommanUI";
import { IoEyeOutline } from "react-icons/io5";
import { Calendar } from "lucide-react";
import dayjs from "dayjs";
import { receiptVouchersApi } from "../../services/api";
import toast from "react-hot-toast";
import { getApiErrorMessage, isEmptyListNotFound } from "../../utils/apiError";
import { TABLE_ACTION_ICON_BTN, tableFooterTdClasses } from "../../utils/tableUi";

function mapReceiptRow(v) {
  const id = v._id || v.id;
  const d = v.date ? dayjs(v.date) : null;
  const amt = v.amount != null ? String(v.amount).replace(/,/g, "") : "0";
  const n = Number(amt);
  return {
    _id: id,
    rawDate: v.date,
    "Voucher No": v.voucherNo || "—",
    Date: d && d.isValid() ? d.format("DD MMM YYYY") : "—",
    "Receipt Through": v.receiptThrough || "—",
    "Receipt From": v.receiptFrom || "—",
    "Amount (₹)": Number.isFinite(n) ? n.toLocaleString("en-IN") : amt,
    Narration: v.remarks || "—",
  };
}

const ReceivableIndex = () => {
  const [viewRow, setViewRow] = useState(null);

  const {
    data: payload,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["receiptVouchers"],
    queryFn: async () => {
      try {
        const { data } = await receiptVouchersApi.getAll({});
        const list = Array.isArray(data?.data) ? data.data : [];
        return {
          rows: list.map(mapReceiptRow),
          totalAmount: data?.totalAmount ?? 0,
        };
      } catch (e) {
        if (isEmptyListNotFound(e)) {
          return { rows: [], totalAmount: 0 };
        }
        throw e;
      }
    },
  });

  const rows = payload?.rows ?? [];

  useEffect(() => {
    if (isError && error) {
      toast.error(getApiErrorMessage(error, "Could not load receivables"));
    }
  }, [isError, error]);

  const columns = useMemo(
    () => [
      "Voucher No",
      "Date",
      "Receipt Through",
      "Receipt From",
      "Amount (₹)",
      "Narration",
      "Actions",
    ],
    []
  );

  const headerTime = dayjs().format("DD MMM, h:mm A");

  const renderFooter = (displayedRows = []) => {
    const totalAmount = displayedRows.reduce((sum, item) => {
      const val = Number(String(item["Amount (₹)"]).replace(/,/g, ""));
      return sum + (Number.isFinite(val) ? val : 0);
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
            if (col === "Receipt From") {
              return (
                <td
                  key={col}
                  className={tableFooterTdClasses(col, {
                    variant: "head",
                    alignClass: "text-right font-normal",
                  })}
                >
                  Total Receipts (₹)
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
                  ₹{totalAmount.toLocaleString("en-IN")}
                </td>
              );
            }
            return <td key={col} className={tableFooterTdClasses(col, { variant: "head" })} />;
          })}
        </tr>
      </tfoot>
    );
  };

  const renderReceivableAction = (row) => (
    <td className="px-3 py-2.5 align-middle text-center border-b border-gray-200 dark:border-slate-700">
      <button
        type="button"
        title="View voucher"
        className={TABLE_ACTION_ICON_BTN}
        onClick={(e) => {
          e.stopPropagation();
          setViewRow(row);
        }}
      >
        <IoEyeOutline size={18} strokeWidth={2} />
      </button>
    </td>
  );

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Receivable Summary</h1>
          <div className="jitox-header-pill">
            <span>{headerTime}</span>
            <Calendar size={16} className="shrink-0 text-current" />
          </div>
        </div>

        <div className="rounded-xl jitox-panel jitox-panel--shadow p-4 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Receivables</h2>
          </div>

          <DataTable
            columns={columns}
            data={rows}
            loading={isLoading}
            renderFooter={
              !isLoading && rows.length > 0 ? renderFooter : undefined
            }
            renderAction={renderReceivableAction}
            tableClassName="text-sm"
            maxHeight="calc(100vh - 16rem)"
          />
        </div>

        <CommonModal
          open={Boolean(viewRow)}
          onClose={() => setViewRow(null)}
          title="Receipt voucher"
          width="min(480px, 96vw)"
        >
          {viewRow && (
            <dl className="space-y-2 text-sm">
              {columns
                .filter((c) => c !== "Actions")
                .map((col) => (
                  <div
                    key={col}
                    className="flex justify-between gap-4 border-b border-gray-100 pb-2 last:border-0 dark:border-slate-700"
                  >
                    <dt className="text-gray-500 shrink-0 dark:text-slate-400">{col}</dt>
                    <dd className="text-right font-medium text-dark break-words min-w-0 dark:text-slate-100">
                      {viewRow[col] ?? "—"}
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

export default ReceivableIndex;
