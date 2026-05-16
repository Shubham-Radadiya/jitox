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
import {
  TABLE_ACTION_ICON_BTN,
  tableFooterTdClasses,
  tableTdClasses,
} from "../../utils/tableUi";

import {
  objectToHtmlTable,
  buildStandalonePrintableHtml,
  downloadHtmlDocumentAsPdf,
} from "../../utils/printAndExport";
import {
  formatDayBookAmountCell,
  resolveDayBookAmounts,
} from "../../utils/dayBookSides";

function mapDayBookRow(doc) {
  const { debitAmount, creditAmount } = resolveDayBookAmounts(
    doc.voucherType,
    doc.debitAmount,
    doc.creditAmount
  );
  const ts = doc.createdAt ? new Date(doc.createdAt).getTime() : 0;
  return {
    _id: doc._id || doc.id,
    Date: doc.createdAt
      ? dayjs(doc.createdAt).format("DD MMM YYYY")
      : "—",
    Particulars: doc.particulars || "—",
    "Voucher Type": doc.voucherType || "—",
    "Voucher No": doc.voucherNumber || "—",
    "Credit (₹)": formatDayBookAmountCell(creditAmount),
    "Debit (₹)": formatDayBookAmountCell(debitAmount),
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
  const handleDocument = async (row) => {
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
    const title = `Day book — ${row["Voucher No"]}`;
    const bodyHtml = `<h2 style="font-family:sans-serif;font-size:14px">Voucher line</h2>${objectToHtmlTable(
      detail
    )}`;
    const fullHtml = buildStandalonePrintableHtml(title, bodyHtml, {
      bodyPaddingPx: 10,
      bodyFontSizePx: 12,
      h1FontSizePx: 16,
      tableCellPaddingPx: 5,
    });
    try {
      await downloadHtmlDocumentAsPdf(fullHtml, `${title}.pdf`);
      toast.success("PDF downloaded successfully.");
    } catch (err) {
      console.error("PDF generation failed:", err);
      toast.error("PDF generation failed. Please try again.");
    }
  };

  const renderProductActions = (row) => (
    <td className={tableTdClasses("Actions")}>
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
    const parseCell = (v) => {
      if (v == null || v === "—") return 0;
      const n = Number(String(v).replace(/,/g, ""));
      return Number.isFinite(n) ? n : 0;
    };
    const totalCredit = displayedRows.reduce(
      (sum, row) => sum + parseCell(row["Credit (₹)"]),
      0
    );
    const totalDebit = displayedRows.reduce(
      (sum, row) => sum + parseCell(row["Debit (₹)"]),
      0
    );
    const fmtTotal = (n) =>
      `₹${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
    const footerTop =
      "border-t-2 border-t-slate-300 dark:border-t-slate-500";
    return (
      <tfoot className="sticky bottom-0 z-20 border-t-2 border-slate-300 bg-headBg dark:border-slate-500 dark:bg-slate-800 [&_tr>td]:border-t-2 [&_tr>td]:border-slate-300 dark:[&_tr>td]:border-slate-500">
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
            if (col === "Credit (₹)") {
              return (
                <td
                  key={col}
                  className={tableFooterTdClasses(col, {
                    variant: "head",
                    extra: footerTop,
                  })}
                >
                  {fmtTotal(totalCredit)}
                </td>
              );
            }
            if (col === "Debit (₹)") {
              return (
                <td
                  key={col}
                  className={tableFooterTdClasses(col, {
                    variant: "head",
                    extra: footerTop,
                  })}
                >
                  {fmtTotal(totalDebit)}
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
              maxHeight="calc(100vh - 10rem)"
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
            <dl className="mb-0 space-y-2 text-sm">
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
