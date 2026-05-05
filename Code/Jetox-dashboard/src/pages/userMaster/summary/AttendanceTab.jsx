import React, { useState, useMemo } from "react";
import DataTable from "../../../components/ui/table/DataTable";
import { CommonModal, Button } from "../../../components/ui/CommanUI";
import { HiOutlineDotsVertical } from "react-icons/hi";
import { Clock, Edit3, Eye, FileText } from "lucide-react";
import { tableTdClasses } from "../../../utils/tableUi";

const AttendanceTab = () => {
  const [activeMenu, setActiveMenu] = useState(null);
  const [isTimesheetOpen, setIsTimesheetOpen] = useState(false);

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
          aria-expanded={activeMenu === rowIndex}
          onClick={(e) => {
            e.stopPropagation();
            setActiveMenu(activeMenu === rowIndex ? null : rowIndex);
          }}
        >
          <HiOutlineDotsVertical size={18} />
        </button>
        {activeMenu === rowIndex && (
          <div className="absolute right-0 top-full z-200 mt-1 w-32 rounded-lg bg-slate-900 py-2 text-xs text-white shadow-xl dark:bg-slate-950">
            <button
              type="button"
              className="w-full px-3 py-1.5 text-center font-semibold hover:bg-white/10"
              onClick={() => {
                setActiveMenu(null);
                setIsTimesheetOpen(true);
              }}
            >
              Report
            </button>
            <div className="mt-1 flex items-center justify-center gap-2 border-t border-white/10 pt-1 opacity-70">
              <Eye size={12} aria-hidden /> <Clock size={12} aria-hidden />
            </div>
            <button
              type="button"
              className="w-full px-3 py-1.5 text-center font-semibold hover:bg-white/10"
              onClick={() => setActiveMenu(null)}
            >
              View | Edit
            </button>
          </div>
        )}
      </div>
    </td>
  );

  return (
    <div className="flex min-w-0 flex-col gap-3">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-6">
        {stats.map((s, i) => (
          <div
            key={i}
            className="flex flex-col gap-1 rounded-xl jitox-panel jitox-panel--shadow p-3 sm:p-4"
          >
            <div
              className={`text-[10px] font-bold uppercase tracking-wider ${
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
              className={`text-sm font-bold text-slate-900 dark:text-slate-100 ${
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
    <CommonModal open={open} onClose={onClose} width="850px" title="Timesheet">
      <div className="ds-stack-major p-1">
        <div className="grid grid-cols-2 overflow-hidden rounded-xl border-2 border-[#E6F3F0] sm:grid-cols-4 dark:border-slate-600">
          {times.map((t, i) => (
            <div
              key={i}
              className="relative flex flex-col gap-1 border-b border-[#E6F3F0] bg-white p-3 last:border-b-0 sm:border-r sm:border-b-0 sm:p-4 sm:last:border-r-0 dark:border-slate-600 dark:bg-slate-900"
            >
              <div className="absolute bottom-1/4 left-0 top-1/4 w-[3px] rounded-full bg-green-500" />
              <div className="ml-2 text-base font-bold text-dark">{t.value}</div>
              <div className="ml-2 text-[10px] font-bold uppercase text-gray-400">{t.label}</div>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-4">
          {logs.map((log, i) => (
            <div
              key={i}
              className="flex flex-wrap items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-600 dark:bg-slate-900"
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
                className="p-2 text-gray-300 hover:text-primary"
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
          className="w-40 self-start rounded-xl py-3 font-bold"
        />
      </div>
    </CommonModal>
  );
};

export default AttendanceTab;
