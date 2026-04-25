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
import { escapeHtml, printHtmlDocument } from "../../utils/printAndExport";

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
    <div className="flex flex-col min-h-0 h-full max-h-[42vh] lg:max-h-none border-b lg:border-b-0 lg:border-r border-light-border bg-white dark:border-slate-700 dark:bg-slate-900 lg:w-[15.5rem] shrink-0">
      <div className="shrink-0 border-b border-light-border px-3 py-3 dark:border-slate-700">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-3">
          <div className="text-xs font-semibold text-dark sm:w-[7.25rem] shrink-0 leading-tight">
            Employee List
          </div>
          <div className="flex gap-2 items-center flex-1 min-w-0">
            <SearchBar
              placeholder="Search user"
              className="flex-1 min-w-0"
              dense
              value={search}
              onChange={onSearch}
            />
            <button
              type="button"
              className="shrink-0 h-9 w-9 bg-white border border-light-border rounded-lg flex items-center justify-center text-light hover:text-dark dark:bg-slate-800 dark:border-slate-600 dark:text-slate-400 dark:hover:text-slate-100"
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
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain divide-y divide-light-border dark:divide-slate-700">
        {filtered.map((emp) => (
          <button
            key={emp.id}
            type="button"
            onClick={() => onSelect(emp)}
            className={`w-full text-left flex justify-between items-center gap-3 py-2 px-3 transition border-l-4 ${
              selectedId === emp.id
                ? "bg-primary/10 border-l-primary dark:bg-primary/20"
                : "hover:bg-rowBg border-l-transparent dark:hover:bg-slate-800"
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
                <div className="text-dark text-xs font-semibold truncate">
                  {emp.name}
                </div>
                <div className="text-[11px] text-light truncate">{emp.department}</div>
              </div>
            </div>
            <span className="flex items-center gap-0.5 text-[11px] text-light shrink-0">
              {emp.time}
              <MdNavigateNext className="opacity-50" size={16} />
            </span>
          </button>
        ))}
        {filtered.length === 0 && (
          <div className="p-4 text-xs text-light text-center leading-relaxed">
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
    <div className="w-full min-w-0 overflow-x-auto rounded-md border border-light-border bg-white dark:border-slate-700 dark:bg-slate-900">
      <table className="w-full min-w-full table-auto border-collapse text-xs">
        <thead>
          <tr className="text-left text-light border-b border-light-border bg-headBg/80 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
            <th className="w-[11%] px-3 py-2.5 align-middle font-medium text-left">
              Time
            </th>
            <th className="w-[22%] px-3 py-2.5 align-middle font-medium text-left">
              Party / Visit Name
            </th>
            <th className="w-[16%] px-3 py-2.5 align-middle font-medium text-left whitespace-nowrap">
              From previous stop
            </th>
            <th className="w-[12%] px-3 py-2.5 align-middle font-medium text-left">
              Duration
            </th>
            <th className="w-[39%] px-3 py-2.5 align-middle font-medium text-left">
              Address
            </th>
          </tr>
        </thead>
        <tbody>
          {visits.map((v, i) => (
            <tr
              key={i}
              className="border-b border-light-border/50 transition-colors duration-200 last:border-0 hover:bg-emerald-50/40 dark:border-slate-700/60 dark:hover:bg-slate-800/80"
            >
              <td className="px-3 py-2.5 align-middle text-dark dark:text-slate-100">{cell(v.time)}</td>
              <td className="px-3 py-2.5 align-middle text-dark dark:text-slate-100">{cell(v.partyName)}</td>
              <td className="px-3 py-2.5 align-middle text-dark tabular-nums dark:text-slate-100">
                {cell(formatLegKm(v))}
              </td>
              <td className="px-3 py-2.5 align-middle text-light dark:text-slate-400">{cell(v.duration)}</td>
              <td className="px-3 py-2.5 align-middle text-light dark:text-slate-400">{cell(v.address)}</td>
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
    <div className="border-l-4 border-primary bg-primary/[0.06] px-4 py-3 space-y-3 dark:border-emerald-500 dark:bg-emerald-950/20">
      <div className="text-xs font-semibold text-dark dark:text-slate-100">
        Day detail · {row.Date}
      </div>
      {hasVisits ? (
        <div className="space-y-1">
          <VisitTable visits={visits} />
          <p className="text-[10px] text-light leading-snug">
            From previous stop: straight-line distance (km) between consecutive visit GPS points.
          </p>
        </div>
      ) : (
        <p className="text-xs text-light py-1">No stop-level visits for this day.</p>
      )}
      {hasVisits && row._mapTrack?.path?.length > 0 && (
        <div className="space-y-1">
          <div className="text-[10px] uppercase tracking-wide text-light font-medium">
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
        <td key={key} className="px-3 py-2 text-light w-12 dark:text-slate-400">
          <button
            type="button"
            className="p-2 rounded-md hover:bg-rowBg text-light hover:text-dark inline-flex items-center justify-center dark:hover:bg-slate-800 dark:hover:text-slate-100"
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
    <div className="flex-1 min-w-0 min-h-0 flex flex-col bg-white border border-light-border rounded-lg overflow-hidden shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:shadow-md">
      <div className="shrink-0 flex items-center justify-between gap-4 border-b border-light-border px-4 py-3 min-h-12 dark:border-slate-700">
        <div className="text-dark text-sm font-semibold truncate dark:text-slate-100">
          Employee Monthly Tracking
        </div>
        <div className="flex gap-1.5 shrink-0">
          <button
            type="button"
            className="h-8 w-8 flex items-center justify-center border border-light-border rounded-md text-red-600 hover:bg-rowBg dark:border-slate-600 dark:text-red-400 dark:hover:bg-slate-800"
            aria-label="Export PDF"
            onClick={onExportPdf}
          >
            <BsFillFileEarmarkPdfFill size={16} />
          </button>
          <button
            type="button"
            className="h-8 w-8 flex items-center justify-center border border-light-border rounded-md text-light hover:bg-rowBg dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-800"
            aria-label="Export CSV"
            onClick={onExportCsv}
          >
            <FaFileCsv size={16} />
          </button>
        </div>
      </div>

      <div className="shrink-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-4 py-3 border-b border-light-border bg-rowBg/40 dark:border-slate-700 dark:bg-slate-800/50">
        <div className="flex items-center gap-2 min-w-0">
          <img
            src={Avatar}
            alt={
              selected?.name
                ? `${selected.name} — selected employee`
                : "Selected employee"
            }
            className="w-8 h-8 rounded-full shrink-0"
            width={32}
            height={32}
          />
          <div className="min-w-0">
            <div className="text-dark text-sm font-semibold truncate leading-tight">
              {selected?.name}
            </div>
            <div className="text-[11px] text-light truncate">{selected?.department}</div>
          </div>
        </div>
        <div className="flex flex-wrap items-end gap-2 sm:justify-end">
          <span className="text-xs text-light shrink-0 leading-[2.25rem] sm:leading-none sm:pb-2">
            Date
          </span>
          <DateRangePicker
            placeholder={["From", "To"]}
            className="w-full sm:w-[16.5rem] shrink-0 [&_.ant-picker]:py-1"
            value={dateRange}
            onChange={onDateRangeChange}
          />
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-x-auto overflow-y-auto overscroll-contain">
        <table className="w-full min-w-full table-auto border-collapse text-sm">
          <thead className="sticky top-0 z-[2]">
            <tr>
              {dataColumns.map((col) =>
                col === "arrow" ? (
                  <th key={col} className="px-3 py-2 w-10" />
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
                      className={`text-center align-middle border-b border-light-border/60 transition-colors duration-200 dark:border-slate-700/60 ${
                        idx % 2 === 0
                          ? "bg-white dark:bg-slate-900"
                          : "bg-rowBg dark:bg-slate-800/50"
                      } ${expanded ? "bg-primary/[0.07] dark:bg-emerald-950/25" : ""} hover:bg-gray-50/80 dark:hover:bg-slate-800/80`}
                    >
                      {dataColumns.map((col) => renderCell(col, row[col], row))}
                    </tr>
                    {expanded && (
                      <tr className="bg-white dark:bg-slate-900">
                        <td colSpan={dataColumns.length} className="p-0 border-b border-light-border dark:border-slate-700">
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
          <div className="p-4 text-center text-light text-sm dark:text-slate-400">
            No tracking rows for this range.
          </div>
        )}
        {loading && (
          <div className="p-4 text-center text-light text-sm dark:text-slate-400">Loading…</div>
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

  const exportTrackingPdf = () => {
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
    printHtmlDocument(
      `Tracking — ${selected.name}`,
      `<p><strong>${escapeHtml(selected.name)}</strong> · ${escapeHtml(selected.department || "")}</p><table style="border-collapse:collapse;width:100%"><thead>${headerRow}</thead><tbody>${dataRows}</tbody></table>`
    );
    toast.success(
      "Downloaded (.html). Open it and use Print → Save as PDF for a PDF copy."
    );
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col lg:flex-row min-h-0 lg:h-[calc(100dvh-4.5rem)] lg:max-h-[calc(100dvh-4.5rem)] gap-0">
        {loadingList ? (
          <div className="p-4 text-xs text-light w-full lg:w-[15.5rem] border-b lg:border-b-0 lg:border-r border-light-border shrink-0 leading-relaxed dark:border-slate-700 dark:text-slate-400">
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
        <div className="flex-1 min-w-0 min-h-0 flex flex-col pt-4 pb-4 px-4 sm:px-6 lg:px-4">
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
            <div className="flex-1 flex items-center justify-center text-light text-sm border border-dashed border-light-border rounded-lg dark:border-slate-600 dark:text-slate-400">
              Select an employee
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default EmployeeTrackIndex;
