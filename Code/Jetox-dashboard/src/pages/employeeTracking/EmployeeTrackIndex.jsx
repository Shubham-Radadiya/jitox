import React, { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import DashboardLayout from "../../layouts/DashboardLayout";
import { useTableData } from "../../hooks/useTableData";
import { DateRangePicker, SearchBar } from "../../components/ui/CommanUI";
import Avatar from "../../assets/avtar.png";
import { MdNavigateNext } from "react-icons/md";
import { BsFillFileEarmarkPdfFill } from "react-icons/bs";
import { FaFileCsv } from "react-icons/fa";
import { FaArrowDownLong, FaArrowUpLong } from "react-icons/fa6";
import { MapPin, Route, Users } from "lucide-react";
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

function defaultDateRange() {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 30);
  return [
    from.toISOString().slice(0, 10),
    to.toISOString().slice(0, 10),
  ];
}

function formatPeriodLabel(range) {
  if (!range?.[0] || !range?.[1]) return "All dates";
  const fmt = (iso) =>
    new Date(`${iso}T12:00:00`).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  return `${fmt(range[0])} – ${fmt(range[1])}`;
}

function EmployeeListSidebar({ employees, selectedId, onSelect, search, onSearch }) {
  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return employees;
    return employees.filter(
      (e) =>
        e.name.toLowerCase().includes(s) ||
        (e.department || "").toLowerCase().includes(s)
    );
  }, [employees, search]);

  return (
    <aside className="flex max-h-[min(45vh,360px)] min-h-0 shrink-0 flex-col rounded-xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-600/60 dark:bg-slate-900/80 lg:sticky lg:top-4 lg:z-10 lg:max-h-[calc(100dvh-6rem)] lg:w-[17.5rem] lg:shrink-0">
      <div className="shrink-0 border-b border-slate-100 px-4 py-3.5 dark:border-slate-700/80">
        <div className="flex items-center gap-2 text-slate-800 dark:text-slate-100">
          <Users size={18} className="text-primary shrink-0" />
          <div>
            <h2 className="jitox-section-title">Field users</h2>
            <p className="jitox-caption">
              Select a user to view routes
            </p>
          </div>
        </div>
        <div className="mt-3">
          <SearchBar
            placeholder="Search by name or department"
            className="w-full"
            dense
            value={search}
            onChange={onSearch}
          />
        </div>
      </div>
      <div className="min-h-0 flex-1 divide-y divide-slate-100 overflow-y-auto overscroll-contain dark:divide-slate-700/80">
        {filtered.map((emp) => (
          <button
            key={emp.id}
            type="button"
            onClick={() => onSelect(emp)}
            className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors ${
              selectedId === emp.id
                ? "bg-emerald-50 dark:bg-emerald-950/40"
                : "hover:bg-slate-50 dark:hover:bg-slate-800/60"
            }`}
          >
            <img
              src={Avatar}
              alt=""
              className="h-9 w-9 shrink-0 rounded-full ring-2 ring-white dark:ring-slate-700"
              width={36}
              height={36}
            />
            <div className="min-w-0 flex-1">
              <div className="truncate text-xs font-semibold text-slate-800 dark:text-slate-100">
                {emp.name}
              </div>
              <div className="truncate text-[10px] text-slate-500 dark:text-slate-400">
                {emp.department || "Field"}
              </div>
            </div>
            {emp.online ? (
              <span
                className="h-2 w-2 shrink-0 rounded-full bg-emerald-500"
                title="Recent GPS activity"
              />
            ) : (
              <MdNavigateNext className="shrink-0 text-slate-300" size={18} />
            )}
          </button>
        ))}
        {filtered.length === 0 && (
          <p className="px-4 py-6 text-center text-xs text-slate-500">No users match</p>
        )}
      </div>
    </aside>
  );
}

function EmptySelectPrompt() {
  return (
    <div className="flex min-h-[420px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-gradient-to-b from-slate-50/90 to-white px-6 py-16 text-center dark:border-slate-600 dark:from-slate-900/50 dark:to-slate-900/30">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Route size={28} strokeWidth={1.75} />
      </div>
      <h3 className="jitox-page-title">Select a field user</h3>
      <p className="jitox-page-subtitle mt-2 max-w-sm">
        Choose someone from the list on the left. Their GPS routes and daily summary
        will appear here for the dates you select.
      </p>
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
    <div className="w-full min-w-0 overflow-x-auto rounded-lg border border-slate-200/70 bg-white dark:border-slate-600/50 dark:bg-slate-900/60">
      <table className="w-full min-w-[34rem] table-auto border-collapse text-[11px]">
        <thead>
          <tr className="bg-slate-50 text-left text-slate-600 dark:bg-slate-800/80 dark:text-slate-300">
            <th className={`px-3 py-2 font-medium ${TABLE_CELL_BORDER}`}>Time</th>
            <th className={`px-3 py-2 font-medium ${TABLE_CELL_BORDER}`}>Party / Visit</th>
            <th className={`px-3 py-2 font-medium ${TABLE_CELL_BORDER}`}>From prev.</th>
            <th className={`px-3 py-2 font-medium ${TABLE_CELL_BORDER}`}>Duration</th>
            <th className={`px-3 py-2 font-medium ${TABLE_CELL_BORDER}`}>Address</th>
          </tr>
        </thead>
        <tbody>
          {visits.map((v, i) => (
            <tr key={i} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50">
              <td className={`px-3 py-2 ${TABLE_CELL_BORDER}`}>{cell(v.time)}</td>
              <td className={`px-3 py-2 ${TABLE_CELL_BORDER}`}>{cell(v.partyName)}</td>
              <td className={`px-3 py-2 tabular-nums ${TABLE_CELL_BORDER}`}>
                {cell(formatLegKm(v))}
              </td>
              <td className={`px-3 py-2 text-slate-500 ${TABLE_CELL_BORDER}`}>
                {cell(v.duration)}
              </td>
              <td className={`px-3 py-2 text-slate-500 ${TABLE_CELL_BORDER}`}>
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
  if (!visits.length) {
    return (
      <p className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">
        No visit stops recorded for this day.
      </p>
    );
  }
  return (
    <div className="space-y-2 border-t border-slate-100 bg-slate-50/50 px-4 py-3 dark:border-slate-700/60 dark:bg-slate-900/40">
      <p className="text-[11px] font-semibold text-slate-700 dark:text-slate-200">
        Visit stops · {row.Date}
      </p>
      <VisitTable visits={visits} />
    </div>
  );
}

function TrackingToolbar({
  selected,
  dateRange,
  onDateRangeChange,
  dayOptions,
  activeDayIso,
  onActiveDayChange,
  onExportPdf,
  onExportCsv,
  stats,
}) {
  return (
    <div className="shrink-0 space-y-4 border-b border-slate-100 px-4 py-4 dark:border-slate-700/80 sm:px-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <img
            src={Avatar}
            alt=""
            className="h-11 w-11 shrink-0 rounded-full ring-2 ring-emerald-100 dark:ring-emerald-900/50"
          />
          <div className="min-w-0">
            <h2 className="jitox-page-title truncate">{selected.name}</h2>
            <p className="jitox-page-subtitle truncate">
              {selected.department || "Field"} · GPS tracking report
            </p>
          </div>
        </div>
        <div className="flex shrink-0 gap-1 rounded-lg border border-slate-200 bg-white p-0.5 dark:border-slate-600 dark:bg-slate-800">
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-md text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
            title="Export PDF"
            onClick={onExportPdf}
          >
            <BsFillFileEarmarkPdfFill size={15} />
          </button>
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-md text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
            title="Export CSV"
            onClick={onExportCsv}
          >
            <FaFileCsv size={15} />
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="space-y-1">
          <label className="jitox-label uppercase">Tracking period</label>
          <DateRangePicker
            filterBar
            pickerClassName="jitox-picker-range-dense"
            placeholder={["From date", "To date"]}
            className="w-full min-w-[13rem] sm:w-[15rem]"
            value={dateRange}
            onChange={onDateRangeChange}
          />
        </div>
        {dayOptions.length > 0 && (
          <div className="space-y-1">
            <label className="jitox-label uppercase">Route on map</label>
            <select
              value={activeDayIso || ""}
              onChange={(e) => onActiveDayChange(e.target.value || null)}
              className="h-9 w-full min-w-[13rem] rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-800 outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 sm:w-[15rem]"
            >
              {dayOptions.map((d) => (
                <option key={d.dateIso} value={d.dateIso}>
                  {d.label}
                  {d.km != null ? ` · ${d.km} km` : ""}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {stats && (
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-200">
            {stats.days} day{stats.days !== 1 ? "s" : ""} in range
          </span>
          {stats.totalKm > 0 && (
            <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200">
              {stats.totalKm.toFixed(1)} km total
            </span>
          )}
          <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-[11px] text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            {formatPeriodLabel(dateRange)}
          </span>
        </div>
      )}
    </div>
  );
}

function EmployeeTrackingPanel({
  selected,
  rows,
  loading,
  dateRange,
  onDateRangeChange,
  activeDayIso,
  onActiveDayChange,
  activeMapTrack,
  activeDayLabel,
  expandedDate,
  onToggleRow,
  onRowSelectDay,
  onExportPdf,
  onExportCsv,
  dataColumns,
  warnings,
}) {
  const { tableHeader, renderRowCell: baseCell } = useTableData();

  const dayOptions = useMemo(
    () =>
      rows
        .filter(
          (r) =>
            r._mapTrack?.path?.length >= 2 ||
            r._mapTrack?.traveledPath?.length >= 2 ||
            r._mapTrack?.path?.length > 0
        )
        .map((r) => ({
          dateIso: r.dateIso,
          label: r.Date || r.dateIso,
          km: parseFloat(String(r["Travelled KM"] || "").replace(/[^\d.]/g, "")) || null,
        })),
    [rows]
  );

  const stats = useMemo(() => {
    let totalKm = 0;
    for (const r of rows) {
      const n = parseFloat(String(r["Travelled KM"] || "").replace(/[^\d.]/g, ""));
      if (Number.isFinite(n)) totalKm += n;
    }
    return { days: rows.length, totalKm };
  }, [rows]);

  const hasMap =
    (activeMapTrack?.path?.length ?? 0) > 0 ||
    (activeMapTrack?.traveledPath?.length ?? 0) > 0;

  const renderCell = (key, value, row) => {
    if (key === "arrow") {
      const open = expandedDate === row.dateIso;
      return (
        <td
          key={key}
          className={`w-11 px-2 py-2 text-center ${TABLE_CELL_BORDER}`}
        >
          <button
            type="button"
            className="inline-flex rounded-md p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700"
            aria-expanded={open}
            onClick={(e) => {
              e.stopPropagation();
              onToggleRow(row.dateIso);
            }}
          >
            {open ? <FaArrowUpLong size={13} /> : <FaArrowDownLong size={13} />}
          </button>
        </td>
      );
    }
    return <React.Fragment key={key}>{baseCell(key, value, row)}</React.Fragment>;
  };

  return (
    <div className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-600/60 dark:bg-slate-900/50">
      <TrackingToolbar
        selected={selected}
        dateRange={dateRange}
        onDateRangeChange={onDateRangeChange}
        dayOptions={dayOptions}
        activeDayIso={activeDayIso}
        onActiveDayChange={onActiveDayChange}
        onExportPdf={onExportPdf}
        onExportCsv={onExportCsv}
        stats={stats}
      />

      {warnings}

      <div className="shrink-0 border-b border-slate-100 px-4 py-4 dark:border-slate-700/80 sm:px-5">
        <div className="mb-2 flex items-center gap-2">
          <MapPin size={16} className="text-primary" />
          <h3 className="jitox-section-title">
            Route map
            {activeDayLabel ? (
              <span className="font-normal text-slate-500 dark:text-slate-400">
                {" "}
                · {activeDayLabel}
              </span>
            ) : null}
          </h3>
        </div>
        {loading && !hasMap ? (
          <div className="flex h-52 items-center justify-center rounded-xl bg-slate-50 text-sm text-slate-500 dark:bg-slate-800/50">
            Loading route…
          </div>
        ) : hasMap ? (
          <EmployeeTrackingMap
            key={`${selected.userId || selected.id}-${activeDayIso}`}
            mapTrack={activeMapTrack}
            className="rounded-xl overflow-hidden"
          />
        ) : (
          <div className="flex h-44 flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-4 text-center dark:border-slate-600 dark:bg-slate-800/30">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
              No GPS route for this period
            </p>
            <p className="mt-1 max-w-xs text-xs text-slate-500">
              Change the date range or pick another day. Routes appear after the user
              starts their day on the mobile app.
            </p>
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1 px-1 pb-2 sm:px-2">
        <div className="px-3 pb-2 pt-3 sm:px-3">
          <h3 className="jitox-section-title">Daily summary</h3>
          <p className="jitox-caption">
            Click a row to update the map · expand for visit stops
          </p>
        </div>
        <div className="w-full overflow-x-auto overscroll-x-contain">
          <table className="w-full min-w-[640px] border-collapse text-xs">
            <thead className="sticky top-0 z-[1] bg-slate-100/95 backdrop-blur-sm dark:bg-slate-800/95">
              <tr>
                {dataColumns.map((col) =>
                  col === "arrow" ? (
                    <th key={col} className="w-11 px-2 py-2.5" />
                  ) : (
                    tableHeader(col)
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {!loading &&
                rows.map((row, idx) => {
                  const isActive = activeDayIso === row.dateIso;
                  const expanded = expandedDate === row.dateIso;
                  return (
                    <React.Fragment key={row.dateIso || idx}>
                      <tr
                        role="button"
                        tabIndex={0}
                        onClick={() => onRowSelectDay(row.dateIso)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            onRowSelectDay(row.dateIso);
                          }
                        }}
                        className={`cursor-pointer transition-colors ${
                          isActive
                            ? "bg-emerald-50/90 ring-1 ring-inset ring-emerald-200/80 dark:bg-emerald-950/35 dark:ring-emerald-800/60"
                            : idx % 2 === 0
                              ? "bg-white dark:bg-slate-900/60"
                              : "bg-slate-50/70 dark:bg-slate-800/30"
                        } hover:bg-slate-100/90 dark:hover:bg-slate-800/60`}
                      >
                        {dataColumns.map((col) => renderCell(col, row[col], row))}
                      </tr>
                      {expanded && (
                        <tr>
                          <td colSpan={dataColumns.length} className="p-0">
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
            <div className="px-4 py-10 text-center text-sm text-slate-500">
              No tracking data for {formatPeriodLabel(dateRange)}.
            </div>
          )}
          {loading && rows.length === 0 && (
            <div className="px-4 py-10 text-center text-sm text-slate-500">
              Loading tracking data…
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const EmployeeTrackIndex = () => {
  const [selected, setSelected] = useState(null);
  const [listSearch, setListSearch] = useState("");
  const [dateRange, setDateRange] = useState(defaultDateRange);
  const [activeDayIso, setActiveDayIso] = useState(null);
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
      toast.error(getApiErrorMessage(employeesErrObj, "Could not load employees"));
    }
  }, [employeesError, employeesErrObj]);

  const {
    data: rows = [],
    isLoading: loadingTrack,
    isError: trackError,
    error: trackErrObj,
  } = useQuery({
    queryKey: ["dashboard", "tracking", selected?.userId || selected?.id, dateKey],
    queryFn: async () => {
      if (!selected?.id) return [];
      const trackId = selected.userId || selected.id;
      const { data } = await dashboardUiApi.getEmployeeTracking(trackId, {
        from: dateRange?.[0] || "",
        to: dateRange?.[1] || "",
      });
      return (data?.rows || []).map((r) => ({
        ...r,
        _visits: r._visits || [],
        _mapTrack: r._mapTrack,
      }));
    },
    enabled: Boolean(selected?.id),
    placeholderData: (prev) => prev,
  });

  const activeRow = useMemo(
    () => rows.find((r) => r.dateIso === activeDayIso) || null,
    [rows, activeDayIso]
  );

  const activeMapTrack = activeRow?._mapTrack;
  const activeDayLabel = activeRow?.Date || activeDayIso;

  useEffect(() => {
    if (trackError && trackErrObj) {
      toast.error(getApiErrorMessage(trackErrObj, "Could not load tracking"));
    }
  }, [trackError, trackErrObj]);

  useEffect(() => {
    setActiveDayIso(null);
    setExpandedDate(null);
  }, [selected?.id, dateKey]);

  useEffect(() => {
    if (!rows.length) {
      setActiveDayIso(null);
      return;
    }
    const withMap = rows.find(
      (r) =>
        r._mapTrack?.path?.length >= 2 || r._mapTrack?.traveledPath?.length >= 2
    );
    const fallback = rows[0];
    const pick = withMap || fallback;
    setActiveDayIso((prev) => {
      if (prev && rows.some((r) => r.dateIso === prev)) return prev;
      return pick?.dateIso || null;
    });
  }, [rows]);

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

  const onRowSelectDay = (dateIso) => {
    setActiveDayIso(dateIso);
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
        .map((c) => `"${String(row[c] ?? "").replace(/"/g, '""')}"`)
        .join(",")
    );
    const blob = new Blob([[header, ...body].join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tracking-${String(selected.name).replace(/\s+/g, "-")}.csv`;
    a.click();
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
          `<tr>${cols.map((c) => `<td>${escapeHtml(row[c] ?? "")}</td>`).join("")}</tr>`
      )
      .join("");
    const periodLine = `<p style="color:#666;font-size:12px">Period: ${escapeHtml(formatPeriodLabel(dateRange))}</p>`;
    const html = buildStandalonePrintableHtml(
      `Tracking — ${selected.name}`,
      `${periodLine}<table style="width:100%;border-collapse:collapse"><thead>${headerRow}</thead><tbody>${dataRows}</tbody></table>`,
      { bodyFontSizePx: 12, h1FontSizePx: 15, bodyPaddingPx: 14 }
    );
    try {
      await downloadHtmlDocumentAsPdf(
        html,
        `tracking-${String(selected.name).replace(/\s+/g, "-")}.pdf`
      );
      toast.success("PDF downloaded");
    } catch {
      toast.error("Could not generate PDF");
    }
  };

  const warnings = (
    <>
      {selected?.isDemo && (
        <p className="mx-4 mt-0 rounded-lg border border-amber-200/80 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-800/60 dark:bg-amber-950/30 dark:text-amber-100 sm:mx-5">
          Sample demo user — use seeded field logins for real GPS trails.
        </p>
      )}
    </>
  );

  return (
    <DashboardLayout>
      <div className="mx-auto flex w-full max-w-[1400px] min-w-0 flex-col gap-4 lg:flex-row lg:items-start lg:gap-5">
        {loadingList ? (
          <div className="w-full rounded-xl border border-slate-200 p-6 text-sm text-slate-500 lg:w-[17.5rem]">
            Loading users…
          </div>
        ) : (
          <EmployeeListSidebar
            employees={employees}
            selectedId={selected?.id}
            onSelect={(emp) => {
              setSelected(emp);
              setActiveDayIso(null);
              setExpandedDate(null);
            }}
            search={listSearch}
            onSearch={setListSearch}
          />
        )}

        <div className="min-w-0 flex-1">
          {!selected ? (
            <EmptySelectPrompt />
          ) : (
            <EmployeeTrackingPanel
              selected={selected}
              rows={rows}
              loading={loadingTrack}
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
              activeDayIso={activeDayIso}
              onActiveDayChange={setActiveDayIso}
              activeMapTrack={activeMapTrack}
              activeDayLabel={activeDayLabel}
              expandedDate={expandedDate}
              onToggleRow={onToggleRow}
              onRowSelectDay={onRowSelectDay}
              onExportPdf={exportTrackingPdf}
              onExportCsv={exportTrackingCsv}
              dataColumns={dataColumns}
              warnings={warnings}
            />
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default EmployeeTrackIndex;
