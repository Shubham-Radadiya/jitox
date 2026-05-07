import { Eye, FileText, PenLine } from "lucide-react";
import { Button, CommonModal } from "../../components/ui/CommanUI";
import DashboardLayout from "../../layouts/DashboardLayout";
import { useState, useMemo, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import CreateAccountModal from "./CreateAccountModal";
import DataTable from "../../components/ui/table/DataTable";
import { accountsApi, customersApi } from "../../services/api";
import toast from "react-hot-toast";
import { getApiErrorMessage, isEmptyListNotFound } from "../../utils/apiError";
import { mapAccountToRow } from "../../utils/accountMappers";
import { isAdminUser } from "../../utils/authSession";
import { useTableData } from "../../hooks/useTableData";
import {
  objectToHtmlTable,
  buildStandalonePrintableHtml,
  downloadHtmlDocumentAsPdf,
} from "../../utils/printAndExport";
import {
  TABLE_ACTION_ICON_BTN,
  tableTdClasses,
  tableFooterTdClasses,
} from "../../utils/tableUi";
import { mergePageAddButton } from "../../utils/pageAddButton";

function parseInrCell(v) {
  if (v == null || v === "—") return 0;
  const n = Number(String(v).replace(/[₹,\s]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

const VIEW_MODES = [
  { id: "normal", label: "Normal" },
  { id: "ledger", label: "Ledger" },
  { id: "statement", label: "Statement" },
];

const AccountIndex = () => {
  const queryClient = useQueryClient();

  const { renderRowCell: baseCell } = useTableData();
  const [viewMode, setViewMode] = useState("normal");
  const [activityValueInput, setActivityValueInput] = useState("3");
  const [activityUnit, setActivityUnit] = useState("months");

  const columnsByView = useMemo(() => {
    if (viewMode === "ledger") {
      return [
        "Party Name",
        "Account Type",
        "Credit (₹)",
        "Debit (₹)",
        "Actions",
      ];
    }
    if (viewMode === "statement") {
      return [
        "Party Name",
        "Street",
        "City",
        "State",
        "PIN",
        "Party Type",
        "Transport",
        "Delivery At",
        "Credit (₹)",
        "Debit (₹)",
        "Status",
        "Actions",
      ];
    }
    return [
      "Party Name",
      "Contact Person",
      "Territory",
      "Account Type",
      "Credit (₹)",
      "Debit (₹)",
      "Status",
      "Actions",
    ];
  }, [viewMode]);

  const navigate = useNavigate();
  const [isAddAccOpen, setIsAddAccOpen] = useState(false);

  const { data: activitySettings } = useQuery({
    queryKey: ["customerActivitySettings"],
    queryFn: async () => {
      const { data } = await customersApi.getActivitySettings();
      return data;
    },
    enabled: isAdminUser(),
    staleTime: 30_000,
  });

  useEffect(() => {
    if (activitySettings && typeof activitySettings.value === "number") {
      setActivityValueInput(String(activitySettings.value));
      setActivityUnit(
        activitySettings.unit === "days" ? "days" : "months"
      );
    }
  }, [activitySettings]);

  const {
    data: rows = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["accounts"],
    queryFn: async () => {
      try {
        const { data } = await accountsApi.getAll({});
        const list = Array.isArray(data) ? data : [];
        return list.map(mapAccountToRow);
      } catch (e) {
        if (isEmptyListNotFound(e)) return [];
        throw e;
      }
    },
  });

  useEffect(() => {
    if (isError && error) {
      toast.error(getApiErrorMessage(error, "Could not load accounts"));
    }
  }, [isError, error]);

  const fmtInr = (n) =>
    `₹${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

    const renderAccountTableFooter = useCallback(
    (displayedRows = []) => {
      if (!displayedRows.length) return null;
      let credit = 0;
      let debit = 0;
      displayedRows.forEach((row) => {
        credit += parseInrCell(row["Credit (₹)"]);
        debit += parseInrCell(row["Debit (₹)"]);
      });
      return (
        <tfoot className="sticky bottom-0 z-[1] border-t-2 border-gray-200 bg-gray-50 dark:border-slate-600 dark:bg-slate-800/95">
          <tr>
            {columnsByView.map((col) => {
              if (col === "Account Type") {
                return (
                  <td key={col} className={`${tableFooterTdClasses(col)} text-right`}>
                    Total
                  </td>
                );
              }
              if (col === "Credit (₹)") {
                return (
                  <td key={col} className={tableFooterTdClasses(col)}>
                    {fmtInr(credit)}
                  </td>
                );
              }
              if (col === "Debit (₹)") {
                return (
                  <td key={col} className={tableFooterTdClasses(col)}>
                    {fmtInr(debit)}
                  </td>
                );
              }
              return <td key={col} className={tableFooterTdClasses(col)} />;
            })}
          </tr>
        </tfoot>
      );
    },
    [columnsByView]
  );

  const [accountDetailRow, setAccountDetailRow] = useState(null);

  const handleView = (row) => {
    navigate("/dashboard/account/ledger", { state: { accountId: row._id } });
  };
  const handleEdit = (row) => setAccountDetailRow(row);
  const handleDocument = async (row) => {
    const raw = row._raw || {};
    const detail = {
      "Party Name": row["Party Name"],
      "Contact Person": row["Contact Person"],
      Territory: row.Territory,
      Street: row.Street,
      City: row.City,
      State: row.State,
      PIN: row.PIN,
      "Party Type": row["Party Type"],
      Transport: row.Transport,
      "Delivery At": row["Delivery At"],
      GST: raw.gstNumber || row.GST,
      Status: row.Status,
      "Credit (₹)": row["Credit (₹)"],
      "Debit (₹)": row["Debit (₹)"],
    };

    const title = `Account — ${row["Party Name"]}`;
    const bodyHtml = `<h2 style="font-family:sans-serif">Detail statement</h2>${objectToHtmlTable(
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

  const renderRowCell = (key, value, row) => {
    if (key === "Street") {
      return (
        <td key={key} className={`${tableTdClasses(key)} max-w-[14rem]`}>
          <span
            title={row._fullAddress || value}
            className="truncate inline-block max-w-full align-middle text-gray-800 dark:text-slate-200"
          >
            {value || "—"}
          </span>
        </td>
      );
    }
    if (key === "Status") {
      const s = String(value || "");
      const isInactive =
        s.toLowerCase().includes("inactive") || s.includes("auto");
      return (
        <td
          key={key}
          className={`${tableTdClasses(key)} whitespace-nowrap`}
        >
          <span
            className={`inline-flex max-w-full items-center rounded-md border px-2 py-1 text-sm font-medium leading-tight ${
              isInactive
                ? "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-500/80 dark:bg-rose-950 dark:text-rose-50"
                : "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-600/80 dark:bg-emerald-950 dark:text-emerald-50"
            }`}
          >
            {value || "—"}
          </span>
        </td>
      );
    }
    return baseCell(key, value, row);
  };

  const persistCustomerActivitySetting = async () => {
    const n = Number(String(activityValueInput).replace(/\D/g, "") || "3");
    const v = Number.isFinite(n) && n > 0 ? n : 3;
    const unit = activityUnit === "days" ? "days" : "months";
    try {
      await customersApi.patchActivitySettings({ value: v, unit });
      setActivityValueInput(String(v));
      setActivityUnit(unit);
      await queryClient.invalidateQueries({ queryKey: ["accounts"] });
      await queryClient.invalidateQueries({
        queryKey: ["customerStatusSummary"],
      });
      await queryClient.invalidateQueries({
        queryKey: ["customerActivitySettings"],
      });
      toast.success(
        `Customer activity window: ${v} ${unit === "days" ? "day(s)" : "month(s)"}`
      );
    } catch (e) {
      toast.error(getApiErrorMessage(e, "Could not save setting"));
    }
  };

  const renderAccountActions = (row) => (
    <td className={tableTdClasses("Actions")}>
      <div className="flex items-center justify-center gap-2">
        <button
          type="button"
          title="View ledger"
          className={TABLE_ACTION_ICON_BTN}
          onClick={(e) => {
            e.stopPropagation();
            handleView(row);
          }}
        >
          <Eye size={18} strokeWidth={2} aria-hidden />
        </button>
        <button
          type="button"
          title="Edit account"
          className={TABLE_ACTION_ICON_BTN}
          onClick={(e) => {
            e.stopPropagation();
            handleEdit(row);
          }}
        >
          <PenLine size={18} strokeWidth={2} aria-hidden />
        </button>
        <button
          type="button"
          title="Statement / print"
          className={TABLE_ACTION_ICON_BTN}
          onClick={(e) => {
            e.stopPropagation();
            handleDocument(row);
          }}
        >
          <FileText size={18} strokeWidth={2} aria-hidden />
        </button>
      </div>
    </td>
  );

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-3 2xl:gap-4">
        <div className="flex flex-wrap items-center justify-end gap-3">
          <div className="flex w-full flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
            <div className="flex h-10 w-full justify-center rounded-lg border border-light-border bg-rowBg p-1 sm:w-auto sm:justify-start sm:mr-auto dark:border-slate-700 dark:bg-slate-800/50">
              {VIEW_MODES.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setViewMode(v.id)}
                  className={`flex min-h-0 flex-1 items-center justify-center rounded-md px-2.5 text-sm font-medium sm:flex-none sm:px-3.5 ${
                    viewMode === v.id
                      ? "bg-primary text-white shadow-sm dark:bg-primary dark:text-white"
                      : "text-slate-600 hover:bg-white/70 dark:text-slate-400 dark:hover:bg-slate-800/90"
                  }`}
                >
                  {v.label}
                </button>
              ))}
            </div>

            {isAdminUser() && (
              <div className="flex h-10 w-full min-w-0 shrink-0 items-center justify-between gap-2 rounded-lg border border-light-border bg-white px-2.5 text-sm text-light sm:w-auto sm:justify-start sm:gap-2.5 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-300">
                <span className="whitespace-nowrap font-medium text-dark/90 dark:text-slate-200">
                  Customer activity
                </span>
                <div className="flex shrink-0 items-center gap-1.5">
                <input
                  type="number"
                  min={1}
                  max={activityUnit === "days" ? 3660 : 120}
                  title="Customer Activity Timeframe"
                  className="h-8 w-[3.75rem] rounded border border-light-border px-1.5 text-sm tabular-nums text-dark dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                  value={activityValueInput}
                  onChange={(e) => setActivityValueInput(e.target.value)}
                  onBlur={persistCustomerActivitySetting}
                />
                <select
                  className="h-8 min-w-[5.25rem] rounded border border-light-border bg-white px-2 py-0 text-sm text-dark dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                  value={activityUnit}
                  onChange={async (e) => {
                    const next = e.target.value === "days" ? "days" : "months";
                    setActivityUnit(next);
                    const n = Number(
                      String(activityValueInput).replace(/\D/g, "") || "3"
                    );
                    const v = Number.isFinite(n) && n > 0 ? n : 3;
                    try {
                      await customersApi.patchActivitySettings({
                        value: v,
                        unit: next,
                      });
                      await queryClient.invalidateQueries({
                        queryKey: ["accounts"],
                      });
                      await queryClient.invalidateQueries({
                        queryKey: ["customerStatusSummary"],
                      });
                      toast.success(
                        `Customer activity window: ${v} ${next === "days" ? "day(s)" : "month(s)"}`
                      );
                    } catch (err) {
                      toast.error(
                        getApiErrorMessage(err, "Could not save setting")
                      );
                    }
                  }}
                >
                  <option value="months">months</option>
                  <option value="days">days</option>
                </select>
                </div>
              </div>
            )}

            <Button
              type="button"
              label="Add account"
              {...mergePageAddButton({
                className:
                  "w-full shrink-0 !h-10 !min-h-10 !max-h-10 !py-0 !px-4 justify-center gap-1.5 !text-sm font-semibold sm:w-auto [&_svg]:!h-[17px] [&_svg]:!w-[17px]",
              })}
              onClick={() => setIsAddAccOpen(true)}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="py-16 text-center text-light text-sm dark:text-slate-400">
            Loading accounts…
          </div>
        ) : (
          <DataTable
            columns={columnsByView}
            data={rows}
            renderAction={renderAccountActions}
            renderRowCell={renderRowCell}
            maxHeight="calc(100vh - 12rem)"
            renderFooter={
              rows.length ? renderAccountTableFooter : undefined
            }
          />
        )}

        <CreateAccountModal
          open={isAddAccOpen}
          onClose={() => setIsAddAccOpen(false)}
          onSaved={() =>
            queryClient.invalidateQueries({ queryKey: ["accounts"] })
          }
        />

        <CommonModal
          open={Boolean(accountDetailRow)}
          onClose={() => setAccountDetailRow(null)}
          title={
            accountDetailRow
              ? `Account — ${accountDetailRow["Party Name"]}`
              : "Account"
          }
          width="min(520px, 96vw)"
          footer={[
            <Button
              key="close"
              label="Close"
              variant="outline"
              size="sm"
              onClick={() => setAccountDetailRow(null)}
            />,
            <Button
              key="ledger"
              label="Open ledger"
              variant="primary"
              size="sm"
              onClick={() => {
                if (accountDetailRow?._id) {
                  navigate("/dashboard/account/ledger", {
                    state: { accountId: accountDetailRow._id },
                  });
                }
                setAccountDetailRow(null);
              }}
            />,
          ]}
        >
          {accountDetailRow ? (
            <dl className="mb-0 space-y-2 text-sm">
              {[
                "Party Name",
                "Contact Person",
                "Territory",
                "Account Type",
                "Credit (₹)",
                "Debit (₹)",
                "Status",
                "Street",
                "City",
                "State",
                "PIN",
                "Party Type",
                "Transport",
                "Delivery At",
                "GST",
              ].map((col) => (
                <div
                  key={col}
                  className="grid grid-cols-2 gap-2 border-b border-light-border pb-2 last:border-0 dark:border-slate-700"
                >
                  <dt className="font-medium text-slate-500 dark:text-slate-400">
                    {col}
                  </dt>
                  <dd className="text-slate-900 dark:text-slate-100">
                    {String(accountDetailRow[col] ?? "—")}
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

export default AccountIndex;
