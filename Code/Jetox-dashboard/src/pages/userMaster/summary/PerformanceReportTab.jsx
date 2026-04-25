import React, { useState } from "react";
import { Download, CheckCircle2, ShoppingBag, Landmark, Wallet, CalendarDays, Clock } from "lucide-react";
import toast from "react-hot-toast";
import {
  downloadPrintableDocument,
  objectToHtmlTable,
} from "../../../utils/printAndExport";
import { downloadCsv } from "../../../utils/voucherShare";

/**
 * PerformanceReportTab Component
 * Displays metrics, performance bars, and status cards.
 */
const PerformanceReportTab = () => {
  const [activeFilter, setActiveFilter] = useState("Month");
  const [isExportOpen, setIsExportOpen] = useState(false);

  const stats = [
    { label: "Total Visits", value: "05", icon: CheckCircle2, color: "text-green-500", bgColor: "bg-green-50 dark:bg-green-950/50" },
    { label: "Total Orders", value: "08", icon: ShoppingBag, color: "text-green-600", bgColor: "bg-green-50 dark:bg-green-950/50" },
    { label: "Total Sales Amount", value: "₹3,20,000", icon: Landmark, color: "text-green-600", bgColor: "bg-green-50 dark:bg-green-950/50" },
    { label: "Total Expenses", value: "₹12,500", icon: Wallet, color: "text-green-600", bgColor: "bg-green-50 dark:bg-green-950/50" },
    { label: "Attendance Summary", value: "24 Present / 2 Absent", icon: CalendarDays, color: "text-green-600", bgColor: "bg-green-50 dark:bg-green-950/50" },
    { label: "Pending Follow-ups", value: "05", icon: Clock, color: "text-green-600", bgColor: "bg-green-50 dark:bg-green-950/50" },
  ];

  const exportPerformancePdf = () => {
    const flat = Object.fromEntries(stats.map((s) => [s.label, s.value]));
    downloadPrintableDocument(
      `Jitox-performance-${activeFilter.toLowerCase()}`,
      objectToHtmlTable(flat)
    );
    toast.success("Summary downloaded (.html)");
    setIsExportOpen(false);
  };

  const exportPerformanceExcel = () => {
    const rows = stats.map((s) => [s.label, s.value]);
    downloadCsv(
      `performance-summary-${activeFilter.toLowerCase()}.csv`,
      ["Metric", "Value"],
      rows
    );
    toast.success("CSV downloaded");
    setIsExportOpen(false);
  };

  return (
    <div className="ds-stack-major">
      {/* Top Action Bar */}
      <div className="flex justify-end relative">
        <button 
          onClick={() => setIsExportOpen(!isExportOpen)}
          className="p-2 bg-white border border-light-border rounded-lg shadow-sm hover:bg-gray-50 transition-colors dark:bg-slate-800 dark:border-slate-600 dark:hover:bg-slate-700"
        >
          <Download size={18} className="text-dark" />
        </button>
        {isExportOpen && (
          <div className="absolute right-0 top-12 bg-white border border-light-border rounded-xl shadow-xl py-2 w-28 z-50 animate-in fade-in slide-in-from-top-2 duration-200 dark:bg-slate-900 dark:border-slate-600">
            <button
              type="button"
              className="w-full px-4 py-2 text-sm font-semibold text-dark hover:bg-gray-50 text-right dark:hover:bg-slate-800"
              onClick={exportPerformancePdf}
            >
              PDF
            </button>
            <button
              type="button"
              className="w-full px-4 py-2 text-sm font-semibold text-dark hover:bg-gray-50 text-right dark:hover:bg-slate-800"
              onClick={exportPerformanceExcel}
            >
              Excel
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* Left Performance Card */}
        <div className="col-span-4 rounded-2xl jitox-panel jitox-panel--shadow p-4 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-dark">Performance Report</h3>
            <div className="flex bg-[#F8F9FE] p-1 rounded-lg dark:bg-slate-800/80">
              {["Month", "Week"].map((f) => (
                <button
                  key={f}
                  onClick={() => setActiveFilter(f)}
                  className={`px-4 py-1 text-xs font-bold rounded-md transition-all ${
                    activeFilter === f ? "bg-white text-primary shadow-sm dark:bg-slate-900 dark:text-primary" : "text-gray-400 dark:text-slate-500"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="flex flex-col gap-3">
             <div className="flex justify-between items-end">
                <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Performance</span>
                <span className="text-sm font-bold text-dark">78%</span>
             </div>
             <div className="h-2 w-full bg-gray-100 rounded-full relative overflow-hidden dark:bg-slate-800">
                <div 
                  className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#DBF576] to-[#2DA838] rounded-full transition-all duration-500"
                  style={{ width: '78%' }}
                ></div>
                <div className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-[#2DA838] border-2 border-white rounded-full shadow-md transition-all duration-500" style={{ left: '76%' }}></div>
             </div>
          </div>

          {/* Circular Stats */}
          <div className="flex justify-between items-center mt-4">
             <div className="flex flex-col items-center gap-2">
                <div className="relative w-16 h-16 flex items-center justify-center">
                   <svg className="w-full h-full -rotate-90">
                      <circle cx="32" cy="32" r="28" fill="transparent" stroke="#E6FFFA" strokeWidth="6" />
                      <circle cx="32" cy="32" r="28" fill="transparent" stroke="#2C8C7E" strokeWidth="6" strokeDasharray="175" strokeDashoffset="87" strokeLinecap="round" />
                   </svg>
                   <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-8 h-8 rounded-full bg-[#F0FAF8] flex items-center justify-center">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-[#2C8C7E]"><path d="m22 7-8.5 8.5-5-5L2 17"/><path d="M16 7h6v6"/></svg>
                      </div>
                   </div>
                </div>
                <div className="text-center">
                   <div className="text-lg font-bold text-dark">50%</div>
                   <div className="text-[10px] text-gray-400 font-bold uppercase">Visits</div>
                </div>
             </div>

             <div className="flex flex-col items-center gap-2">
                <div className="relative w-16 h-16 flex items-center justify-center">
                   <svg className="w-full h-full -rotate-90">
                      <circle cx="32" cy="32" r="28" fill="transparent" stroke="#F0F0FF" strokeWidth="6" />
                      <circle cx="32" cy="32" r="28" fill="transparent" stroke="#7A7AFF" strokeWidth="6" strokeDasharray="175" strokeDashoffset="122" strokeLinecap="round" />
                   </svg>
                   <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-8 h-8 rounded-full bg-[#F5F5FF] flex items-center justify-center">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-[#7A7AFF]"><path d="m22 7-8.5 8.5-5-5L2 17"/><path d="M16 7h6v6"/></svg>
                      </div>
                   </div>
                </div>
                <div className="text-center">
                   <div className="text-lg font-bold text-dark">30%</div>
                   <div className="text-[10px] text-gray-400 font-bold uppercase">Order ratio</div>
                </div>
             </div>

             <div className="flex flex-col items-center gap-2">
                <div className="relative w-16 h-16 flex items-center justify-center">
                   <svg className="w-full h-full -rotate-90">
                      <circle cx="32" cy="32" r="28" fill="transparent" stroke="#F0FAFC" strokeWidth="6" />
                      <circle cx="32" cy="32" r="28" fill="transparent" stroke="#2EB1CC" strokeWidth="6" strokeDasharray="175" strokeDashoffset="140" strokeLinecap="round" />
                   </svg>
                   <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-8 h-8 rounded-full bg-[#F0FCFF] flex items-center justify-center">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-[#2EB1CC]"><path d="m22 7-8.5 8.5-5-5L2 17"/><path d="M16 7h6v6"/></svg>
                      </div>
                   </div>
                </div>
                <div className="text-center">
                   <div className="text-lg font-bold text-dark">20%</div>
                   <div className="text-[10px] text-gray-400 font-bold uppercase">Follow-ups</div>
                </div>
             </div>
          </div>
        </div>

        {/* Right Metric Cards */}
        <div className="col-span-8 grid grid-cols-2 gap-4">
          {stats.map((s, i) => (
            <div key={i} className="rounded-2xl jitox-panel jitox-panel--shadow p-4 flex items-center gap-4 group hover:border-primary/20 transition-all cursor-default relative overflow-hidden">
               {/* Side indicator */}
               <div className={`absolute top-0 bottom-0 left-0 w-1 ${s.color}`}></div>
               <div className={`w-12 h-12 rounded-xl ${s.bgColor} flex items-center justify-center ${s.color}`}>
                  <s.icon size={24} />
               </div>
               <div className="flex flex-col">
                  <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">{s.label}</span>
                  <span className="text-xl font-bold text-dark">{s.value}</span>
               </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PerformanceReportTab;
