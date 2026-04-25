import React, { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import DashboardLayout from "../../layouts/DashboardLayout";
import DataTable from "../../components/ui/table/DataTable";
import { IoDocumentTextOutline, IoEyeOutline } from "react-icons/io5";
import { TbEdit } from "react-icons/tb";
import { dayBooksApi } from "../../services/api";
import toast from "react-hot-toast";
import { getApiErrorMessage, isEmptyListNotFound } from "../../utils/apiError";
import { CommonModal, Button } from "../../components/ui/CommanUI";
import { TABLE_ACTION_ICON_BTN, tableFooterTdClasses } from "../../utils/tableUi";
import { objectToHtmlTable, printHtmlDocument } from "../../utils/printAndExport";

function mapDayBookRow(doc) {
  const credit = String(doc.creditAmount ?? "").replace(/,/g, "");
  const debit = String(doc.debitAmount ?? "").replace(/,/g, "");
  const fmt = (n) => {
    const x = Number(n);
    return Number.isFinite(x) ? x.toLocaleString("en-IN") : n;
  };
  const ts = doc.createdAt ? new Date(doc.createdAt).getTime() : 0;
  return {
    _id: doc._id || doc.id,
    Date: doc.createdAt
      ? dayjs(doc.createdAt).format("DD MMM YYYY")
      : "—",
    Particulars: doc.particulars || "—",
    "Voucher Type": doc.voucherType || "—",
    "Voucher No": doc.voucherNumber || "—",
    "Credit (₹)": fmt(credit),
    "Debit (₹)": fmt(debit),
    _sortTs: ts,
    _raw: doc,
  };
}

const DayBookIndex = () => {
  const navigate = useNavigate();
  const [detailRow, setDetailRow] = useState(null);

  const {
    data: rawDayBooks = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["dayBooks", "all"],
    queryFn: async () => {
      try {
        const { data } = await dayBooksApi.getAll({});
        const list = Array.isArray(data) ? data : [];
        return list;
      } catch (e) {
        if (isEmptyListNotFound(e)) return [];
        throw e;
      }
    },
  });

  const rows = useMemo(
    () => rawDayBooks.map(mapDayBookRow),
    [rawDayBooks]
  );

  useEffect(() => {
    if (isError && error) {
      toast.error(getApiErrorMessage(error, "Could not load day book"));
    }
  }, [isError, error]);

  const columns = useMemo(
    () => [
      "Date",
      "Particulars",
      "Voucher Type",
      "Voucher No",
      "Credit (₹)",
      "Debit (₹)",
      "Actions",
    ],
    []
  );

  const handleView = (row) => setDetailRow(row);
  const handleEdit = (_row) => {
    setDetailRow(null);
    navigate("/dashboard/accounting-voucher/purchase");
  };
  const handleDocument = (row) => {
    const raw = row._raw || {};
    const detail = {
      Date: row.Date,
      Particulars: row.Particulars,
      "Voucher Type": row["Voucher Type"],
      "Voucher No": row["Voucher No"],
      "Credit (₹)": row["Credit (₹)"],
      "Debit (₹)": row["Debit (₹)"],
      ...Object.fromEntries(
        Object.entries(raw).filter(
          ([k]) => !["_id", "__v", "createdAt", "updatedAt"].includes(k)
        )
      ),
    };
    printHtmlDocument(
      `Day book — ${row["Voucher No"]}`,
      `<h2 style="font-family:sans-serif;font-size:14px">Voucher line</h2>${objectToHtmlTable(
        detail
      )}`
    );
    toast.success(
      "Downloaded (.html). Open it and use Print → Save as PDF for a PDF copy."
    );
  };

  const renderProductActions = (row) => (
    <td className="px-3 py-2.5 align-middle border-b border-gray-200 dark:border-slate-700">
      <div className="flex items-center justify-center gap-2">
        <button
          type="button"
          title="View"
          className={TABLE_ACTION_ICON_BTN}
          onClick={(e) => {
            e.stopPropagation();
            handleView(row);
          }}
        >
          <IoEyeOutline size={18} strokeWidth={2} />
        </button>
        <button
          type="button"
          title="Edit"
          className={TABLE_ACTION_ICON_BTN}
          onClick={(e) => {
            e.stopPropagation();
            handleEdit(row);
          }}
        >
          <TbEdit size={18} strokeWidth={2} />
        </button>
        <button
          type="button"
          title="Document"
          className={TABLE_ACTION_ICON_BTN}
          onClick={(e) => {
            e.stopPropagation();
            handleDocument(row);
          }}
        >
          <IoDocumentTextOutline size={18} />
        </button>
      </div>
    </td>
  );

  const renderFooter = (displayedRows = []) => {
    const totalCredit = displayedRows.reduce((sum, row) => {
      const n = Number(String(row["Credit (₹)"]).replace(/,/g, ""));
      return sum + (Number.isFinite(n) ? n : 0);
    }, 0);
    const totalDebit = displayedRows.reduce((sum, row) => {
      const n = Number(String(row["Debit (₹)"]).replace(/,/g, ""));
      return sum + (Number.isFinite(n) ? n : 0);
    }, 0);
    return (
      <tfoot className="sticky bottom-0 z-20 border-t border-light-border bg-headBg dark:border-slate-700">
        <tr>
          {columns.map((col) => {
            if (col === "Date") {
              return (
                <td key={col} className={tableFooterTdClasses(col, { variant: "head" })}>
                  Total
                </td>
              );
            }
            if (col === "Credit (₹)") {
              return (
                <td key={col} className={tableFooterTdClasses(col, { variant: "head" })}>
                  {totalCredit.toLocaleString("en-IN")}
                </td>
              );
            }
            if (col === "Debit (₹)") {
              return (
                <td key={col} className={tableFooterTdClasses(col, { variant: "head" })}>
                  {totalDebit.toLocaleString("en-IN")}
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
      <div className="flex flex-col gap-3 2xl:gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="text-lg font-bold text-dark">Day Book List</div>
        </div>
        <div>
          {isLoading ? (
            <div className="py-16 text-center text-light text-sm">
              Loading day book…
            </div>
          ) : rawDayBooks.length === 0 ? (
            <div className="py-16 text-center text-light text-sm">
              No day book entries yet.
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={rows}
              renderAction={renderProductActions}
              renderFooter={rows.length ? renderFooter : undefined}
              maxHeight="calc(100vh - 20rem)"
              tableClassName="text-sm"
            />
          )}
        </div>

        <CommonModal
          open={Boolean(detailRow)}
          onClose={() => setDetailRow(null)}
          title={
            detailRow
              ? `Voucher — ${detailRow["Voucher No"]}`
              : "Day book entry"
          }
          width="min(520px, 96vw)"
          footer={[
            <Button
              key="close"
              label="Close"
              variant="outline"
              size="sm"
              onClick={() => setDetailRow(null)}
            />,
          ]}
        >
          {detailRow ? (
            <dl className="space-y-2 text-sm">
              {columns
                .filter((c) => c !== "Actions")
                .map((col) => (
                  <div
                    key={col}
                    className="grid grid-cols-2 gap-2 border-b border-light-border pb-2 last:border-0 dark:border-slate-700"
                  >
                    <dt className="font-medium text-slate-500 dark:text-slate-400">
                      {col}
                    </dt>
                    <dd className="text-slate-900 dark:text-slate-100">
                      {String(detailRow[col] ?? "—")}
                    </dd>
                  </div>
                ))}
            </dl>
          ) : null}
        </CommonModal>
      </div>
    </DashboardLayout>
  );
};

export default DayBookIndex;
