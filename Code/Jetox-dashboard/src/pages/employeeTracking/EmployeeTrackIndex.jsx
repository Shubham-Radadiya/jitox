import React, { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import DashboardLayout from "../../layouts/DashboardLayout";
import { useTableData } from "../../hooks/useTableData";
import { DateRangePicker, SearchBar } from "../../components/ui/CommanUI";
import { HiOutlineFilter } from "react-icons/hi";
import Avatar from "../../assets/avtar.png";
import { MdNavigateNext } from "react-icons/md";
import { BsFillFileEarmarkPdfFill } from "react-icons/bs";
import { FaFileCsv } from "react-icons/fa";
import { FaArrowDownLong, FaArrowUpLong } from "react-icons/fa6";
import { dashboardUiApi } from "../../services/api";
import { EmployeeTrackingMap } from "../../components/employee/EmployeeTrackingMap";
import toast from "react-hot-toast";
import { getApiErrorMessage } from "../../utils/apiError";
import {
  escapeHtml,
  buildStandalonePrintableHtml,
  downloadHtmlDocumentAsPdf,
} from "../../utils/printAndExport";
import { TABLE_CELL_BORDER } from "../../utils/tableUi";

function EmployeeListSidebar({ employees, selectedId, onSelect, search, onSearch }) {
  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return employees;
    return employees.filter(
      (e) =>
        e.name.toLowerCase().includes(s) ||
        e.department.toLowerCase().includes(s)
    );
  }, [employees, search]);

  return (
    <div className="flex h-full max-h-[42vh] min-h-0 shrink-0 flex-col border-b border-slate-200/70 bg-white/85 backdrop-blur-md dark:border-slate-600/45 dark:bg-slate-900/50 lg:max-h-none lg:min-w-[16rem] lg:w-[min(100%,18rem)] lg:rounded-l-xl lg:border-b-0 lg:border-r lg:shadow-[inset_-1px_0_0_rgba(15,23,42,0.06)] dark:lg:shadow-[inset_-1px_0_0_rgba(255,255,255,0.04)]">
      <div className="shrink-0 border-b border-slate-200/60 bg-gradient-to-b from-slate-50/90 to-white/60 px-3 py-3 backdrop-blur-sm dark:border-slate-600/40 dark:from-slate-800/50 dark:to-slate-900/30">
        <div className="flex flex-col gap-2">
          <div className="text-sm font-semibold leading-tight tracking-tight text-slate-800 dark:text-slate-100">
            Employee List
          </div>
          <div className="flex w-full min-w-0 items-center gap-2">
            <SearchBar
              placeholder="Search user"
              className="min-w-0 flex-1"
              dense
              value={search}
              onChange={onSearch}
            />
            <button
              type="button"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200/80 bg-white/90 text-slate-500 shadow-sm transition hover:border-slate-300 hover:text-slate-800 dark:border-slate-600/60 dark:bg-slate-800/80 dark:text-slate-400 dark:hover:border-slate-500 dark:hover:bg-slate-700/80 dark:hover:text-slate-100"
              aria-label="Filter"
              onClick={() =>
                toast.success("Use search to filter employees by name or department.")
              }
            >
              <HiOutlineFilter size={16} />
            </button>
          </div>
        </div>
      </div>
      <div className="min-h-0 flex-1 divide-y divide-slate-200/60 overflow-y-auto overscroll-contain dark:divide-slate-700/70">
        {filtered.map((emp) => (
          <button
            key={emp.id}
            type="button"
            onClick={() => onSelect(emp)}
            className={`flex w-full items-center justify-between gap-3 border-l-[3px] px-3 py-2.5 text-left transition-colors ${
              selectedId === emp.id
                ? "border-l-primary bg-emerald-50/70 dark:border-l-emerald-400 dark:bg-emerald-950/35"
                : "border-l-transparent hover:bg-slate-50/90 dark:hover:bg-slate-800/55"
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              {emp.online ? (
                <span className="w-1.5 h-1.5 rounded-full bg-sky-500 shrink-0" />
              ) : (
                <span className="w-1.5 shrink-0" />
              )}
              <img
                src={Avatar}
                alt={`${emp.name} — profile`}
                className="w-8 h-8 rounded-full shrink-0"
                width={32}
                height={32}
              />
              <div className="min-w-0 text-left">
                <div className="truncate text-[11px] font-semibold text-slate-800 dark:text-slate-100">
                  {emp.name}
                </div>
                <div className="truncate text-[10px] text-slate-500 dark:text-slate-400">{emp.department}</div>
              </div>
            </div>
            <span className="flex shrink-0 items-center gap-0.5 text-[10px] text-slate-500 dark:text-slate-400">
              {emp.time}
              <MdNavigateNext className="opacity-50" size={16} />
            </span>
          </button>
        ))}
        {filtered.length === 0 && (
          <div className="p-4 text-center text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
            No matches
          </div>
        )}
      </div>
    </div>
  );
}

function formatLegKm(v) {
  if (v.distanceFromPrevKm == null) return "—";
  return `${v.distanceFromPrevKm} km`;
}

function VisitTable({ visits }) {
  if (!visits?.length) return null;
  const cell = (text) => (
    <span className="block min-w-0 whitespace-nowrap">{text ?? "—"}</span>
  );
  return (
    <div className="w-full min-w-0 overflow-x-auto rounded-lg border border-slate-200/70 bg-white/90 shadow-sm backdrop-blur-sm [-webkit-overflow-scrolling:touch] touch-pan-x dark:border-slate-600/50 dark:bg-slate-900/60 max-sm:-mx-0.5">
      <table className="w-full min-w-[34rem] table-auto border-collapse text-[11px] sm:min-w-full">
        <thead>
          <tr className="bg-slate-50/90 text-left text-slate-600 dark:bg-slate-800/80 dark:text-slate-300">
            <th
              className={`w-[11%] px-2 py-2 align-middle text-left font-medium ${TABLE_CELL_BORDER}`}
            >
              Time
            </th>
            <th
              className={`w-[22%] px-2 py-2 align-middle text-left font-medium ${TABLE_CELL_BORDER}`}
            >
              Party / Visit Name
            </th>
            <th
              className={`w-[16%] whitespace-nowrap px-2 py-2 align-middle text-left font-medium ${TABLE_CELL_BORDER}`}
            >
              From previous stop
            </th>
            <th
              className={`w-[12%] px-2 py-2 align-middle text-left font-medium ${TABLE_CELL_BORDER}`}
            >
              Duration
            </th>
            <th
              className={`w-[39%] px-2 py-2 align-middle text-left font-medium ${TABLE_CELL_BORDER}`}
            >
              Address
            </th>
          </tr>
        </thead>
        <tbody>
          {visits.map((v, i) => (
            <tr
              key={i}
              className="transition-colors duration-200 hover:bg-emerald-50/40 dark:hover:bg-slate-800/80"
            >
              <td
                className={`px-2 py-2 align-middle text-dark dark:text-slate-100 ${TABLE_CELL_BORDER}`}
              >
                {cell(v.time)}
              </td>
              <td
                className={`px-2 py-2 align-middle text-dark dark:text-slate-100 ${TABLE_CELL_BORDER}`}
              >
                {cell(v.partyName)}
              </td>
              <td
                className={`px-2 py-2 align-middle text-dark tabular-nums dark:text-slate-100 ${TABLE_CELL_BORDER}`}
              >
                {cell(formatLegKm(v))}
              </td>
              <td
                className={`px-2 py-2 align-middle text-light dark:text-slate-400 ${TABLE_CELL_BORDER}`}
              >
                {cell(v.duration)}
              </td>
              <td
                className={`px-2 py-2 align-middle text-light dark:text-slate-400 ${TABLE_CELL_BORDER}`}
              >
                {cell(v.address)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DayDetailExpansion({ row }) {
  const visits = row._visits || [];
  const hasVisits = visits.length > 0;
  return (
    <div className="space-y-2.5 border-l-[3px] border-primary bg-gradient-to-r from-emerald-50/80 to-white/40 px-2.5 py-2.5 dark:border-emerald-500 dark:from-emerald-950/30 dark:to-slate-900/40 sm:space-y-3 sm:px-4 sm:py-3">
      <div className="text-[11px] font-semibold text-slate-800 dark:text-slate-100">
        Day detail · {row.Date}
      </div>
      {hasVisits ? (
        <div className="space-y-1.5">
          <VisitTable visits={visits} />
          <p className="text-[10px] leading-snug text-slate-500 dark:text-slate-400">
            From previous stop: straight-line distance (km) between consecutive visit GPS points.
          </p>
        </div>
      ) : (
        <p className="py-1 text-[11px] text-slate-500 dark:text-slate-400">No stop-level visits for this day.</p>
      )}
      {hasVisits && row._mapTrack?.path?.length > 0 && (
        <div className="space-y-1.5">
          <div className="text-[10px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Live route tracking
          </div>
          <EmployeeTrackingMap mapTrack={row._mapTrack} />
        </div>
      )}
    </div>
  );
}

function EmployeeDetailPanel({
  selected,
  dataColumns,
  rows,
  loading,
  dateRange,
  onDateRangeChange,
  expandedDate,
  onToggleRow,
  onExportPdf,
  onExportCsv,
}) {
  const { tableHeader, renderRowCell: baseCell } = useTableData();

  const renderCell = (key, value, row) => {
    if (key === "arrow") {
      const open = expandedDate === row.dateIso;
      return (
        <td
          key={key}
          className={`w-12 px-2 py-1.5 align-middle text-center text-slate-400 dark:text-slate-500 ${TABLE_CELL_BORDER}`}
        >
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-md p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 dark:hover:bg-slate-700/80 dark:hover:text-slate-100"
            aria-expanded={open}
            onClick={() => onToggleRow(row.dateIso)}
          >
            {open ? <FaArrowUpLong size={14} /> : <FaArrowDownLong size={14} />}
          </button>
        </td>
      );
    }
    return <React.Fragment key={key}>{baseCell(key, value, row)}</React.Fragment>;
  };

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-slate-200/70 bg-white/85 shadow-sm backdrop-blur-md dark:border-slate-600/50 dark:bg-slate-900/55 dark:shadow-lg dark:shadow-black/15">
      <div className="flex min-h-12 shrink-0 items-center justify-between gap-4 border-b border-slate-200/60 bg-gradient-to-r from-slate-50/95 via-white/80 to-slate-50/70 px-4 py-3 dark:border-slate-600/45 dark:from-slate-900/70 dark:via-slate-800/50 dark:to-slate-900/60">
        <div className="truncate text-sm font-semibold tracking-tight text-slate-800 dark:text-slate-100">
          Employee Monthly Tracking
        </div>
        <div className="flex shrink-0 gap-0.5 rounded-lg border border-slate-200/70 bg-white/90 p-0.5 shadow-sm dark:border-slate-600/55 dark:bg-slate-800/70">
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-md text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
            aria-label="Download PDF"
            title="Download PDF"
            onClick={onExportPdf}
          >
            <BsFillFileEarmarkPdfFill size={16} />
          </button>
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700/80"
            aria-label="Download CSV"
            title="Download CSV"
            onClick={onExportCsv}
          >
            <FaFileCsv size={16} />
          </button>
        </div>
      </div>

      <div className="flex shrink-0 flex-col gap-4 border-b border-slate-200/55 bg-slate-50/50 px-4 py-3 backdrop-blur-sm dark:border-slate-600/40 dark:bg-slate-800/35 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-2.5">
          <img
            src={Avatar}
            alt={
              selected?.name
                ? `${selected.name} — selected employee`
                : "Selected employee"
            }
            className="h-9 w-9 shrink-0 rounded-full ring-2 ring-white shadow-sm dark:ring-slate-700"
            width={36}
            height={36}
          />
          <div className="min-w-0">
            <div className="truncate text-xs font-semibold leading-tight text-slate-800 dark:text-slate-100">
              {selected?.name}
            </div>
            <div className="truncate text-[10px] text-slate-500 dark:text-slate-400">{selected?.department}</div>
          </div>
        </div>
        <div className="flex w-full min-w-0 flex-nowrap items-center justify-center gap-2 overflow-x-auto sm:w-auto sm:justify-end sm:overflow-visible">
          <span className="shrink-0 text-[11px] font-medium text-slate-500 dark:text-slate-400">Date</span>
          <DateRangePicker
            filterBar
            pickerClassName="jitox-picker-range-dense"
            placeholder={["From", "To"]}
            className="w-[11.75rem] shrink-0"
            value={dateRange}
            onChange={onDateRangeChange}
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-x-auto overflow-y-auto overscroll-contain">
        <table className="w-full min-w-full table-auto border-collapse text-xs [&_td]:text-xs!">
          <thead className="sticky top-0 z-2 bg-slate-100/95 shadow-[0_1px_0_rgba(15,23,42,0.06)] backdrop-blur-sm dark:bg-slate-800/95 dark:shadow-[0_1px_0_rgba(255,255,255,0.06)]">
            <tr>
              {dataColumns.map((col) =>
                col === "arrow" ? (
                  <th key={col} className="w-10 px-2.5 py-2" />
                ) : (
                  tableHeader(col)
                )
              )}
            </tr>
          </thead>
          <tbody>
            {!loading &&
              rows.map((row, idx) => {
                const expanded = expandedDate === row.dateIso;
                return (
                  <React.Fragment key={row.dateIso || idx}>
                    <tr
                      className={`align-middle text-center transition-colors duration-200 ${
                        idx % 2 === 0
                          ? "bg-white/90 dark:bg-slate-900/70"
                          : "bg-slate-50/80 dark:bg-slate-800/45"
                      } ${expanded ? "bg-emerald-50/70 dark:bg-emerald-950/30" : ""} hover:bg-slate-100/90 dark:hover:bg-slate-800/70`}
                    >
                      {dataColumns.map((col) => renderCell(col, row[col], row))}
                    </tr>
                    {expanded && (
                      <tr className="bg-slate-50/40 dark:bg-slate-900/50">
                        <td
                          colSpan={dataColumns.length}
                          className="border-b border-slate-200/60 p-0 dark:border-slate-700/60"
                        >
                          <DayDetailExpansion row={row} />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
          </tbody>
        </table>
        {!loading && rows.length === 0 && (
          <div className="p-6 text-center text-sm text-slate-500 dark:text-slate-400">
            No tracking rows for this range.
          </div>
        )}
        {loading && (
          <div className="p-6 text-center text-sm text-slate-500 dark:text-slate-400">Loading…</div>
        )}
      </div>
    </div>
  );
}

const EmployeeTrackIndex = () => {
  const [selected, setSelected] = useState(null);
  const [listSearch, setListSearch] = useState("");
  const [dateRange, setDateRange] = useState(null);
  const [expandedDate, setExpandedDate] = useState(null);

  const dateKey = dateRange
    ? `${dateRange[0] || ""}_${dateRange[1] || ""}`
    : "";

  const {
    data: employees = [],
    isLoading: loadingList,
    isError: employeesError,
    error: employeesErrObj,
  } = useQuery({
    queryKey: ["dashboard", "employees"],
    queryFn: async () => {
      const { data } = await dashboardUiApi.getEmployees();
      return data.employees || [];
    },
  });

  useEffect(() => {
    if (employeesError && employeesErrObj) {
      toast.error(
        getApiErrorMessage(employeesErrObj, "Could not load employees")
      );
    }
  }, [employeesError, employeesErrObj]);

  useEffect(() => {
    setSelected((prev) => {
      if (prev && employees.some((e) => e.id === prev.id)) return prev;
      return employees[0] || null;
    });
  }, [employees]);

  const {
    data: rows = [],
    isLoading: loadingTrack,
    isError: trackError,
    error: trackErrObj,
  } = useQuery({
    queryKey: ["dashboard", "tracking", selected?.id, dateKey],
    queryFn: async () => {
      const { data } = await dashboardUiApi.getEmployeeTracking(selected.id, {
        from: dateRange?.[0] || "",
        to: dateRange?.[1] || "",
      });
      const raw = data.rows || [];
      return raw.map((r) => ({
        ...r,
        _visits: r._visits || [],
        _mapTrack: r._mapTrack,
      }));
    },
    enabled: Boolean(selected?.id),
  });

  useEffect(() => {
    if (trackError && trackErrObj) {
      toast.error(getApiErrorMessage(trackErrObj, "Could not load tracking"));
    }
  }, [trackError, trackErrObj]);

  useEffect(() => {
    setExpandedDate(null);
  }, [selected?.id, dateKey]);

  const dataColumns = useMemo(
    () => [
      "Date",
      "Opening KM",
      "Closing KM",
      "Travelled KM",
      "Visit",
      "Working Hours",
      "arrow",
    ],
    []
  );

  const onToggleRow = (dateIso) => {
    setExpandedDate((d) => (d === dateIso ? null : dateIso));
  };

  const exportTrackingCsv = () => {
    if (!selected || !rows?.length) {
      toast.error("No tracking rows to export");
      return;
    }
    const cols = dataColumns.filter((c) => c !== "arrow");
    const header = cols.join(",");
    const body = rows.map((row) =>
      cols
        .map((c) => {
          const v = row[c] ?? "";
          return `"${String(v).replace(/"/g, '""')}"`;
        })
        .join(",")
    );
    const csv = [header, ...body].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `employee-tracking-${String(selected.name || "export").replace(/\s+/g, "-")}.csv`;
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast.success("CSV downloaded");
  };

  const exportTrackingPdf = async () => {
    if (!selected || !rows?.length) {
      toast.error("No tracking rows to export");
      return;
    }
    const cols = dataColumns.filter((c) => c !== "arrow");
    const headerRow = `<tr>${cols.map((c) => `<th>${escapeHtml(c)}</th>`).join("")}</tr>`;
    const dataRows = rows
      .map(
        (row) =>
          `<tr>${cols
            .map((c) => `<td>${escapeHtml(row[c] ?? "")}</td>`)
            .join("")}</tr>`
      )
      .join("");
    const periodLine =
      dateRange?.[0] && dateRange?.[1]
        ? `<p style="color:#666;font-size:12px;margin:0 0 10px">Period: ${escapeHtml(dateRange[0])} → ${escapeHtml(dateRange[1])}</p>`
        : "";
    const bodyInner = `${periodLine}<p><strong>${escapeHtml(selected.name)}</strong> · ${escapeHtml(selected.department || "")}</p><table style="border-collapse:collapse;width:100%"><thead>${headerRow}</thead><tbody>${dataRows}</tbody></table>`;
    const title = `Employee tracking — ${selected.name}`;
    const fullHtml = buildStandalonePrintableHtml(title, bodyInner, {
      bodyFontSizePx: 12,
      h1FontSizePx: 15,
      bodyPaddingPx: 14,
      tableCellPaddingPx: 6,
    });
    const base = `employee-tracking-${String(selected.name || "export").replace(/\s+/g, "-")}`;
    try {
      await downloadHtmlDocumentAsPdf(fullHtml, `${base}.pdf`);
      toast.success("PDF downloaded.");
    } catch (err) {
      console.error(err);
      toast.error("Could not generate PDF. Try again.");
    }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col lg:flex-row min-h-0 lg:h-[calc(100dvh-3.5rem)] lg:max-h-[calc(100dvh-3.5rem)] gap-0">
        {loadingList ? (
          <div className="w-full shrink-0 border-b border-slate-200/60 p-4 text-xs leading-relaxed text-slate-500 dark:border-slate-600/45 dark:bg-slate-900/35 dark:text-slate-400 lg:min-w-[16rem] lg:w-[min(100%,18rem)] lg:rounded-l-xl lg:border-b-0 lg:border-r lg:backdrop-blur-sm">
            Loading employees…
          </div>
        ) : (
          <EmployeeListSidebar
            employees={employees}
            selectedId={selected?.id}
            onSelect={setSelected}
            search={listSearch}
            onSearch={setListSearch}
          />
        )}
        <div className="flex min-h-0 min-w-0 flex-1 flex-col px-4 pb-4 pt-4 sm:px-6 lg:px-4">
          {selected ? (
            <EmployeeDetailPanel
              selected={selected}
              dataColumns={dataColumns}
              rows={rows}
              loading={loadingTrack}
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
              expandedDate={expandedDate}
              onToggleRow={onToggleRow}
              onExportPdf={exportTrackingPdf}
              onExportCsv={exportTrackingCsv}
            />
          ) : (
            <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-slate-300/80 bg-slate-50/40 px-4 py-12 text-sm text-slate-500 backdrop-blur-sm dark:border-slate-600/55 dark:bg-slate-900/35 dark:text-slate-400">
              Select an employee
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default EmployeeTrackIndex;
