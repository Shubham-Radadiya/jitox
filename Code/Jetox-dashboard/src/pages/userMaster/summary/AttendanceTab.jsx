import React, { useState, useMemo, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import DataTable from "../../../components/ui/table/DataTable";
import { CommonModal, Button } from "../../../components/ui/CommanUI";
import { HiOutlineDotsVertical } from "react-icons/hi";
import { Clock, Edit3, Eye, FileText } from "lucide-react";
import { tableTdClasses } from "../../../utils/tableUi";

const AttendanceTab = () => {
  const [activeMenu, setActiveMenu] = useState(null);
  const [isTimesheetOpen, setIsTimesheetOpen] = useState(false);
  const menuRef = useRef(null);
  const menuTriggerRef = useRef(null);

  const stats = [
    { label: "Total Hours Worked", value: "170 H : 19 M : 57 S", color: "blue" },
    { label: "Total Present Days", value: "21", color: "green" },
    { label: "Total Absent Days", value: "5", color: "red" },
    { label: "Total Half Days", value: "1", color: "orange" },
    { label: "On Leave", value: "2.5", color: "gray" },
    { label: "Early Out", value: "1", color: "black" },
  ];

  const columns = [
    "Date",
    "Attendance Status",
    "Clock In",
    "Clock Out",
    "Total Time",
    "Break Time",
    "Productive Hour",
    "Actions",
  ];

  const data = useMemo(
    () => [
      {
        Date: "Thu 29 May, 2025",
        "Attendance Status": "P",
        "Clock In": "09:20 AM",
        "Clock Out": "06:46 PM",
        "Total Time": "08 H : 31 M",
        "Break Time": "00 H : 54 M",
        "Productive Hour": "08 H : 31 M",
        statusDetail: "P/PL",
      },
      {
        Date: "Thu 29 May, 2025",
        "Attendance Status": "P",
        "Clock In": "09:20 AM",
        "Clock Out": "06:46 PM",
        "Total Time": "08 H : 31 M",
        "Break Time": "00 H : 54 M",
        "Productive Hour": "08 H : 31 M",
      },
      {
        Date: "Thu 29 May, 2025",
        "Attendance Status": "L",
        "Clock In": "-",
        "Clock Out": "-",
        "Total Time": "-",
        "Break Time": "-",
        "Productive Hour": "-",
      },
    ],
    []
  );

  useEffect(() => {
    const handlePointerDown = (event) => {
      const t = event.target;
      if (menuRef.current?.contains(t)) return;
      if (menuTriggerRef.current?.contains(t)) return;
      setActiveMenu(null);
    };
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  const cellBase = (colKey) => `${tableTdClasses(colKey, { dense: true })} text-left!`;

  const renderRowCell = (colKey, value, row) => {
    if (colKey === "Attendance Status") {
      const statusColor =
        value === "P"
          ? "text-emerald-600 dark:text-emerald-400"
          : value === "L"
            ? "text-red-500 dark:text-red-400"
            : "text-slate-400";
      return (
        <td className={cellBase(colKey)}>
          <div className="flex min-w-0 flex-wrap items-center justify-start gap-2">
            <span className={`text-sm font-bold ${statusColor}`}>{value}</span>
            {row.statusDetail ? (
              <span className="flex items-center gap-1 text-[10px] font-bold text-primary">
                <span className="h-2 w-2 rounded-full border border-primary" aria-hidden />
                {row.statusDetail}
              </span>
            ) : null}
          </div>
        </td>
      );
    }

    const isSpecialValue = typeof value === "string" && value.includes("H :");
    const displayValue =
      colKey === "Clock Out" && value !== "-" ? (
        <span className="text-red-500 dark:text-red-400">{value}</span>
      ) : isSpecialValue ? (
        <span className="text-sky-600 dark:text-sky-400">{value}</span>
      ) : (
        value
      );

    const muted = value === "-";

    return (
      <td className={cellBase(colKey)}>
        <span
          className={
            muted
              ? "text-sm text-slate-300 dark:text-slate-600"
              : "text-sm text-slate-600 dark:text-slate-300"
          }
        >
          {displayValue}
        </span>
      </td>
    );
  };

  const renderAction = (row, rowIndex) => (
    <td className={`${tableTdClasses("Actions", { dense: true })} text-left!`}>
      <div className="relative flex items-center justify-start">
        <button
          type="button"
          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-100"
          aria-label="Row menu"
          aria-expanded={activeMenu?.rowIndex === rowIndex}
          onClick={(e) => {
            e.stopPropagation();
            const rect = e.currentTarget.getBoundingClientRect();
            menuTriggerRef.current = e.currentTarget;
            setActiveMenu((prev) => {
              if (prev?.rowIndex === rowIndex) {
                menuTriggerRef.current = null;
                return null;
              }
              return {
                rowIndex,
                top: rect.top - 6,
                right: window.innerWidth - rect.right,
              };
            });
          }}
        >
          <HiOutlineDotsVertical size={18} />
        </button>
      </div>
    </td>
  );

  return (
    <div className="flex min-w-0 flex-col gap-3">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3 lg:grid-cols-6">
        {stats.map((s, i) => (
          <div
            key={i}
            className="flex items-center justify-between gap-3 rounded-xl jitox-panel jitox-panel--shadow p-2.5 sm:flex-col sm:items-start sm:justify-start sm:gap-1 sm:p-4"
          >
            <div
              className={`min-w-0 flex-1 whitespace-normal break-words pr-2 text-[10px] font-bold uppercase leading-tight tracking-wider sm:flex-none sm:pr-0 ${
                s.color === "blue"
                  ? "text-blue-500"
                  : s.color === "green"
                    ? "text-green-500"
                    : s.color === "red"
                      ? "text-red-500"
                      : s.color === "orange"
                        ? "text-orange-500"
                        : "text-slate-400 dark:text-slate-500"
              }`}
            >
              {s.label}
            </div>
            <div
              className={`shrink-0 text-base font-bold text-slate-900 sm:text-sm dark:text-slate-100 ${
                s.color === "blue" ? "text-blue-600 dark:text-blue-400" : ""
              }`}
            >
              {s.value}
            </div>
          </div>
        ))}
      </div>

      <div className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm ring-1 ring-slate-900/4 dark:border-slate-600 dark:bg-slate-900 dark:shadow-[0_2px_12px_rgba(0,0,0,0.35)] dark:ring-white/6">
        <DataTable
          columns={columns}
          data={data}
          renderRowCell={renderRowCell}
          renderAction={renderAction}
          allCellsLeft
          className="rounded-none border-0 shadow-none ring-0"
        />
      </div>

      {activeMenu &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={menuRef}
            className="fixed z-200 w-32 rounded-lg border border-slate-700 bg-slate-950 p-1 text-white shadow-2xl"
            style={{
              top: activeMenu.top,
              right: activeMenu.right,
              transform: "translateY(-100%)",
            }}
          >
            <button
              type="button"
              className="flex w-full items-center gap-1.5 rounded-md px-2 py-1 text-left text-[11px] font-semibold leading-tight hover:bg-white/10"
              onClick={() => {
                setActiveMenu(null);
                setIsTimesheetOpen(true);
              }}
            >
              <FileText
                aria-hidden
                strokeWidth={2}
                className="h-3.5 w-3.5 shrink-0 opacity-80"
              />
              Report
            </button>
            <button
              type="button"
              className="mt-0.5 flex w-full items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-1 text-left text-[11px] font-semibold leading-tight hover:bg-white/10"
              onClick={() => setActiveMenu(null)}
            >
              <Clock
                aria-hidden
                strokeWidth={2}
                className="h-3.5 w-3.5 shrink-0 opacity-80"
              />
              Edit
            </button>
            <button
              type="button"
              className="mt-0.5 flex w-full items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-1 text-left text-[11px] font-semibold leading-tight hover:bg-white/10"
              onClick={() => setActiveMenu(null)}
            >
              <Eye
                aria-hidden
                strokeWidth={2}
                className="h-3.5 w-3.5 shrink-0 opacity-80"
              />
              View
            </button>
          </div>,
          document.body
        )}

      <TimesheetModal open={isTimesheetOpen} onClose={() => setIsTimesheetOpen(false)} />
    </div>
  );
};

const TimesheetModal = ({ open, onClose }) => {
  const times = [
    { label: "Clock In", value: "09:42 AM", color: "green" },
    { label: "Clock Out", value: "01:53 PM", color: "green" },
    { label: "Total Time", value: "04:11:30", color: "green" },
    { label: "Total Break Time", value: "00:11:17", color: "green" },
  ];

  const logs = [
    { type: "Clock In/Out", in: "09:42 AM", out: "01:53 PM", total: "04 H : 11 M", icon: "clock" },
    { type: "Break In/Out", in: "01:56 PM", out: "02:40 PM", total: "00 H : 18 M", icon: "break" },
    { type: "Clock In/Out", in: "09:42 AM", out: "01:53 PM", total: "04 H : 11 M", icon: "clock" },
  ];

  return (
    <CommonModal
      open={open}
      onClose={onClose}
      width="min(720px, 94vw)"
      title="Timesheet"
      headerClassName="py-2.5 sm:py-3"
      titleClassName="text-base sm:text-lg"
      bodyClassName="px-2.5 sm:px-5 pb-3 sm:pb-8 pt-2 sm:pt-4"
      footerClassName="hidden"
    >
      <div className="ds-stack-major p-0.5">
        <div className="grid grid-cols-2 overflow-hidden rounded-xl border-2 border-[#E6F3F0] sm:grid-cols-4 dark:border-slate-600">
          {times.map((t, i) => (
            <div
              key={i}
              className="relative flex flex-col gap-1 border-b border-[#E6F3F0] bg-white p-2.5 last:border-b-0 sm:border-r sm:border-b-0 sm:p-4 sm:last:border-r-0 dark:border-slate-600 dark:bg-slate-900"
            >
              <div className="absolute bottom-1/4 left-0 top-1/4 w-[3px] rounded-full bg-green-500" />
              <div className="ml-2 text-sm font-bold text-dark sm:text-base">{t.value}</div>
              <div className="ml-2 text-[10px] font-bold uppercase text-gray-400">{t.label}</div>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3 sm:gap-4">
          {logs.map((log, i) => (
            <div
              key={i}
              className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:gap-4 sm:p-4 dark:border-slate-600 dark:bg-slate-900"
            >
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                  log.icon === "clock"
                    ? "bg-sky-50 text-sky-500 dark:bg-sky-950/50 dark:text-sky-400"
                    : "bg-orange-50 text-orange-400 dark:bg-orange-950/40 dark:text-orange-300"
                }`}
              >
                {log.icon === "clock" ? <Clock size={20} /> : <FileText size={20} />}
              </div>
              <div className="grid min-w-0 flex-1 grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
                <div className="flex flex-col">
                  <div className="text-sm font-bold text-dark">{log.in}</div>
                  <div className="text-[10px] font-bold uppercase tracking-tighter text-gray-400">
                    {log.icon === "clock" ? "Clock In" : "Break In"}
                  </div>
                </div>
                <div className="flex flex-col">
                  <div className="text-sm font-bold text-dark">{log.out}</div>
                  <div className="text-[10px] font-bold uppercase tracking-tighter text-gray-400">
                    {log.icon === "clock" ? "Clock Out" : "Break Out"}
                  </div>
                </div>
                <div className="flex flex-col">
                  <div className="text-sm font-bold text-dark">{log.total}</div>
                  <div className="text-[10px] font-bold uppercase tracking-tighter text-gray-400">
                    Total Time
                  </div>
                </div>
              </div>
              <button
                type="button"
                className="ml-auto p-1.5 text-gray-300 hover:text-primary sm:ml-0 sm:p-2"
                aria-label="Edit log"
              >
                <Edit3 size={18} />
              </button>
            </div>
          ))}
        </div>

        <Button
          label="Save"
          variant="primary"
          onClick={onClose}
          className="w-24 self-end rounded-lg py-2 text-sm font-semibold sm:w-36 sm:rounded-xl sm:py-2.5"
        />
      </div>
    </CommonModal>
  );
};

export default AttendanceTab;
