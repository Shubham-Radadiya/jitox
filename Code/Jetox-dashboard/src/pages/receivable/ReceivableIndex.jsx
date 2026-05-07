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
import {
  TABLE_ACTION_ICON_BTN,
  tableFooterTdClasses,
  tableTdClasses,
} from "../../utils/tableUi";

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
    /** Thicker top edge; matches table cell borders (slate-200 / slate-600). */
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
            if (col === "Receipt From") {
              return (
                <td
                  key={col}
                  className={tableFooterTdClasses(col, {
                    variant: "head",
                    alignClass: "text-right font-normal",
                    extra: footerTop,
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
                    extra: `${footerTop} font-bold`,
                  })}
                >
                  ₹{totalAmount.toLocaleString("en-IN")}
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

  const renderReceivableAction = (row) => (
    <td className={tableTdClasses("Actions")}>
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
      <div className="flex flex-col gap-2 sm:gap-4">
        <div className="flex min-w-0 flex-nowrap items-center justify-between gap-2 sm:gap-3">
          <h1 className="min-w-0 flex-1 truncate whitespace-nowrap text-sm font-semibold tracking-tight text-slate-900 dark:text-slate-100 sm:text-xl sm:font-bold sm:tracking-normal">
            Receivable Summary
          </h1>
          <div className="jitox-header-pill shrink-0 gap-1.5 whitespace-nowrap px-2 py-1 text-[11px] leading-none sm:gap-2 sm:px-3 sm:py-1.5 sm:text-sm sm:leading-normal">
            <span className="shrink-0">{headerTime}</span>
            <Calendar className="h-3.5 w-3.5 shrink-0 text-current opacity-80 sm:h-4 sm:w-4" aria-hidden />
          </div>
        </div>

        <div className="flex flex-col gap-1 rounded-xl jitox-panel jitox-panel--shadow p-3 sm:gap-2 sm:p-4">
          <h2 className="text-base font-semibold leading-tight text-slate-900 dark:text-slate-100 sm:text-lg">
            Receivables
          </h2>

          <DataTable
            columns={columns}
            data={rows}
            loading={isLoading}
            renderFooter={
              !isLoading && rows.length > 0 ? renderFooter : undefined
            }
            renderAction={renderReceivableAction}
            tableClassName="text-sm [&_th]:px-1.5 [&_th]:py-1 [&_td]:px-1.5 [&_td]:py-1"
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
            <dl className="mb-0 space-y-2 text-sm">
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
