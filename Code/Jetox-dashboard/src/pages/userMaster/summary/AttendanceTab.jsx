import React, { useState, useMemo } from "react";
import DataTable from "../../../components/ui/table/DataTable";
import { CommonModal, Button } from "../../../components/ui/CommanUI";
import { HiOutlineDotsVertical } from "react-icons/hi";
import { Clock, Edit3, Eye, FileText } from "lucide-react";

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
    "Breck Time",
    "Productive Hour",
    "Actions",
  ];

  const data = useMemo(() => [
    {
      "Date": "Thu 29 May, 2025",
      "Attendance Status": "P",
      "Clock In": "09:20 AM",
      "Clock Out": "06:46 PM",
      "Total Time": "08 H : 31 M",
      "Breck Time": "00 H : 54 M",
      "Productive Hour": "08 H : 31 M",
      statusDetail: "P/PL"
    },
    {
      "Date": "Thu 29 May, 2025",
      "Attendance Status": "P",
      "Clock In": "09:20 AM",
      "Clock Out": "06:46 PM",
      "Total Time": "08 H : 31 M",
      "Breck Time": "00 H : 54 M",
      "Productive Hour": "08 H : 31 M"
    },
    {
       "Date": "Thu 29 May, 2025",
       "Attendance Status": "L",
       "Clock In": "-",
       "Clock Out": "-",
       "Total Time": "-",
       "Breck Time": "-",
       "Productive Hour": "-"
    }
  ], []);

  const renderRowCell = (colKey, value, row, rowIndex) => {
    if (colKey === "Attendance Status") {
      const statusColor = value === "P" ? "text-green-500" : value === "L" ? "text-red-400" : "text-gray-400";
      return (
        <td key={colKey} className="px-4 py-4">
          <div className="flex items-center justify-center gap-2">
            <span className={`text-sm font-bold ${statusColor}`}>{value}</span>
            {row.statusDetail && <span className="text-[10px] font-bold text-blue-500 flex items-center gap-1">
               <span className="w-2 h-2 rounded-full border border-blue-500"></span> {row.statusDetail}
            </span>}
          </div>
        </td>
      );
    }
    const isSpecialValue = typeof value === 'string' && value.includes('H :');
    const displayValue = colKey === "Clock Out" && value !== "-" ? (
       <span className="text-red-400">{value}</span>
    ) : isSpecialValue ? (
       <span className="text-blue-400">{value}</span>
    ) : value;

    return (
      <td key={colKey} className={`px-4 py-4 text-xs font-medium ${value === "-" ? "text-gray-300" : "text-gray-500"}`}>
        {displayValue}
      </td>
    );
  };

  const renderAction = (row, rowIndex) => (
    <td className="px-3 py-2.5 align-middle text-center border-b border-gray-200 relative">
      <div className="flex items-center justify-center">
        <button
          type="button"
          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 hover:text-dark"
          aria-label="Row menu"
          onClick={(e) => {
            e.stopPropagation();
            setActiveMenu(activeMenu === rowIndex ? null : rowIndex);
          }}
        >
          <HiOutlineDotsVertical size={18} />
        </button>
        {activeMenu === rowIndex && (
          <div className="absolute right-2 top-full mt-1 bg-slate-900 text-white rounded-lg shadow-xl py-2 z-[100] w-32 text-xs">
            <button
              type="button"
              className="w-full px-3 py-1.5 font-semibold hover:bg-white/10 text-center"
              onClick={() => {
                setActiveMenu(null);
                setIsTimesheetOpen(true);
              }}
            >
              Report
            </button>
            <div className="flex items-center justify-center gap-2 border-t border-white/10 mt-1 pt-1 opacity-70">
              <Eye size={12} aria-hidden /> <Clock size={12} aria-hidden />
            </div>
            <button
              type="button"
              className="w-full px-3 py-1.5 font-semibold hover:bg-white/10 text-center"
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
    <div className="ds-stack-major">
      {/* Stats Cards */}
      <div className="grid grid-cols-6 gap-4">
        {stats.map((s, i) => (
          <div key={i} className="rounded-xl jitox-panel jitox-panel--shadow p-4 flex flex-col gap-1">
            <div className={`text-[10px] font-bold uppercase tracking-wider ${
              s.color === "blue" ? "text-blue-500" :
              s.color === "green" ? "text-green-500" :
              s.color === "red" ? "text-red-500" :
              s.color === "orange" ? "text-orange-500" :
              "text-gray-400"
            }`}>
              {s.label}
            </div>
            <div className={`text-sm font-bold text-dark ${s.color === "blue" ? "text-blue-500" : ""}`}>
              {s.value}
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={data}
        renderRowCell={renderRowCell}
        renderAction={renderAction}
        className="border-none shadow-sm"
      />

      {/* Timesheet Modal */}
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
        {/* Stats Header */}
        <div className="grid grid-cols-4 border-2 border-[#E6F3F0] rounded-xl overflow-hidden">
          {times.map((t, i) => (
            <div key={i} className="flex flex-col gap-1 p-4 border-r last:border-r-0 border-[#E6F3F0] bg-white relative">
               <div className="absolute left-0 top-1/4 bottom-1/4 w-[3px] bg-green-500 rounded-full"></div>
               <div className="text-base font-bold text-dark ml-2">{t.value}</div>
               <div className="text-[10px] font-bold text-gray-400 uppercase ml-2">{t.label}</div>
            </div>
          ))}
        </div>

        {/* Logs List */}
        <div className="flex flex-col gap-4">
          {logs.map((log, i) => (
            <div key={i} className="flex items-center gap-4 bg-white border border-gray-100 p-4 rounded-xl shadow-sm">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${log.icon === "clock" ? "bg-blue-50 text-blue-500" : "bg-orange-50 text-orange-400"}`}>
                 {log.icon === "clock" ? <Clock size={20} /> : <FileText size={20} />}
              </div>
              <div className="grid grid-cols-3 flex-1 gap-4">
                <div className="flex flex-col">
                   <div className="text-sm font-bold text-dark">{log.in}</div>
                   <div className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">{log.icon === "clock" ? "Clock In" : "Break In"}</div>
                </div>
                <div className="flex flex-col">
                   <div className="text-sm font-bold text-dark">{log.out}</div>
                   <div className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">{log.icon === "clock" ? "Clock Out" : "Break Out"}</div>
                </div>
                <div className="flex flex-col">
                   <div className="text-sm font-bold text-dark">{log.total}</div>
                   <div className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Total Time</div>
                </div>
              </div>
              <button className="text-gray-300 hover:text-primary p-2">
                 <Edit3 size={18} />
              </button>
            </div>
          ))}
        </div>

        {/* Action Button */}
        <Button 
          label="Save" 
          variant="primary" 
          onClick={onClose} 
          className="w-40 self-start py-3 rounded-xl font-bold"
        />
      </div>
    </CommonModal>
  );
};

export default AttendanceTab;
