import React, { useState } from "react";
import { Download, CheckCircle2, ShoppingBag, Landmark, Wallet, CalendarDays, Clock } from "lucide-react";
import toast from "react-hot-toast";
import {
  buildStandalonePrintableHtml,
  downloadHtmlDocumentAsPdf,
  objectToHtmlTable,
} from "../../../utils/printAndExport";
import { downloadCsv } from "../../../utils/voucherShare";
import SummaryFilterBar from "./SummaryFilterBar";

/**
 * PerformanceReportTab Component
 * Displays metrics, performance bars, and status cards.
 */
<<<<<<< HEAD
const PerformanceReportTab = ({ filterLeading = null }) => {
=======
const STAT_ICONS = [
  CheckCircle2,
  ShoppingBag,
  Landmark,
  Wallet,
  CalendarDays,
  Clock,
];

const PerformanceReportTab = ({ performance, liveData = false }) => {
>>>>>>> 69ebfdc813757a7929aefd9c8580f91e4dc9f950
  const [activeFilter, setActiveFilter] = useState("Month");
  const [isExportOpen, setIsExportOpen] = useState(false);

  const stats = (
    liveData && performance?.stats
      ? performance.stats
      : performance?.stats?.length
    ? performance.stats
    : [
        { label: "Total Visits", value: "05" },
        { label: "Total Orders", value: "08" },
        { label: "Total Sales Amount", value: "₹3,20,000" },
        { label: "Total Expenses", value: "₹12,500" },
        { label: "Attendance Summary", value: "24 Present / 2 Absent" },
        { label: "Pending Follow-ups", value: "05" },
      ]
  ).map((s, i) => ({
    ...s,
    icon: STAT_ICONS[i] || CheckCircle2,
    color: "text-green-600",
    bgColor: "bg-green-50 dark:bg-green-950/50",
  }));

  const exportPerformancePdf = async () => {
    const flat = Object.fromEntries(stats.map((s) => [s.label, s.value]));
    const title = `Jitox-performance-${activeFilter.toLowerCase()}`;
    const fullHtml = buildStandalonePrintableHtml(title, objectToHtmlTable(flat), {
      bodyPaddingPx: 10,
      bodyFontSizePx: 12,
      h1FontSizePx: 16,
      tableCellPaddingPx: 5,
    });
    try {
      await downloadHtmlDocumentAsPdf(fullHtml, `${title}.pdf`);
      toast.success("Summary downloaded as PDF.");
    } catch (err) {
      console.error("Performance report PDF generation failed:", err);
      toast.error("Could not generate PDF. Please try again.");
    }
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
    <div className="ds-stack-major min-w-0">
      <SummaryFilterBar leading={filterLeading}>
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => setIsExportOpen(!isExportOpen)}
            className="rounded-lg border border-light-border bg-white p-1.5 shadow-sm transition-colors hover:bg-gray-50 sm:p-2 dark:border-slate-600 dark:bg-slate-800 dark:hover:bg-slate-700"
            aria-label="Download report"
          >
            <Download size={16} className="text-dark sm:size-[18px]" />
          </button>
          {isExportOpen && (
            <div className="absolute right-0 top-10 z-50 w-24 animate-in rounded-xl border border-light-border bg-white py-1.5 shadow-xl fade-in slide-in-from-top-2 duration-200 sm:top-12 sm:w-28 sm:py-2 dark:border-slate-600 dark:bg-slate-900">
              <button
                type="button"
                className="w-full px-3 py-1.5 text-right text-xs font-semibold text-dark hover:bg-gray-50 sm:px-4 sm:py-2 sm:text-sm dark:hover:bg-slate-800"
                onClick={exportPerformancePdf}
              >
                PDF
              </button>
              <button
                type="button"
                className="w-full px-3 py-1.5 text-right text-xs font-semibold text-dark hover:bg-gray-50 sm:px-4 sm:py-2 sm:text-sm dark:hover:bg-slate-800"
                onClick={exportPerformanceExcel}
              >
                Excel
              </button>
            </div>
          )}
        </div>
      </SummaryFilterBar>

      <div className="grid min-w-0 grid-cols-1 gap-3 lg:grid-cols-12 lg:gap-4">
        {/* Left Performance Card */}
        <div className="relative overflow-visible rounded-2xl jitox-panel jitox-panel--shadow p-3 sm:p-4 lg:col-span-4 flex flex-col gap-3 sm:gap-4">
          <div className="flex items-start gap-2">
            <h3 className="text-base font-bold leading-tight text-dark sm:text-lg">Performance Report</h3>
          </div>
          <div className="flex w-fit bg-[#F8F9FE] p-1 rounded-lg dark:bg-slate-800/80">
            {["Month", "Week"].map((f) => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`rounded-md px-2.5 py-1 text-[11px] font-bold transition-all sm:px-4 sm:text-xs ${
                  activeFilter === f ? "bg-white text-primary shadow-sm dark:bg-slate-900 dark:text-primary" : "text-gray-400 dark:text-slate-500"
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Progress Bar */}
          <div className="flex flex-col gap-3">
             <div className="flex justify-between items-end">
                <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Performance</span>
                <span className="text-sm font-bold text-dark">78%</span>
             </div>
             <div className="h-2 w-full bg-gray-100 rounded-full relative overflow-hidden dark:bg-slate-800">
                <div 
                  className="absolute top-0 left-0 h-full bg-linear-to-r from-[#DBF576] to-[#2DA838] rounded-full transition-all duration-500"
                  style={{ width: '78%' }}
                ></div>
                <div className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-[#2DA838] border-2 border-white rounded-full shadow-md transition-all duration-500" style={{ left: '76%' }}></div>
             </div>
          </div>

          {/* Circular Stats */}
          <div className="mt-2 grid grid-cols-3 gap-1.5 sm:mt-4 sm:gap-3">
             <div className="flex min-w-0 flex-col items-center gap-1.5 sm:gap-2">
                <div className="relative flex h-12 w-12 items-center justify-center sm:h-16 sm:w-16">
                   <svg className="h-full w-full -rotate-90" viewBox="0 0 64 64">
                      <circle cx="32" cy="32" r="28" fill="transparent" stroke="#E6FFFA" strokeWidth="6" />
                      <circle cx="32" cy="32" r="28" fill="transparent" stroke="#2C8C7E" strokeWidth="6" strokeDasharray="175" strokeDashoffset="87" strokeLinecap="round" />
                   </svg>
                   <div className="absolute inset-0 flex items-center justify-center">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#F0FAF8] sm:h-8 sm:w-8">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-[#2C8C7E]"><path d="m22 7-8.5 8.5-5-5L2 17"/><path d="M16 7h6v6"/></svg>
                      </div>
                   </div>
                </div>
                <div className="text-center">
                   <div className="text-sm font-bold text-dark sm:text-lg">50%</div>
                   <div className="text-[9px] text-gray-400 font-bold uppercase sm:text-[10px]">Visits</div>
                </div>
             </div>

             <div className="flex min-w-0 flex-col items-center gap-1.5 sm:gap-2">
                <div className="relative flex h-12 w-12 items-center justify-center sm:h-16 sm:w-16">
                   <svg className="h-full w-full -rotate-90" viewBox="0 0 64 64">
                      <circle cx="32" cy="32" r="28" fill="transparent" stroke="#F0F0FF" strokeWidth="6" />
                      <circle cx="32" cy="32" r="28" fill="transparent" stroke="#7A7AFF" strokeWidth="6" strokeDasharray="175" strokeDashoffset="122" strokeLinecap="round" />
                   </svg>
                   <div className="absolute inset-0 flex items-center justify-center">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#F5F5FF] sm:h-8 sm:w-8">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-[#7A7AFF]"><path d="m22 7-8.5 8.5-5-5L2 17"/><path d="M16 7h6v6"/></svg>
                      </div>
                   </div>
                </div>
                <div className="text-center">
                   <div className="text-sm font-bold text-dark sm:text-lg">30%</div>
                   <div className="text-[9px] text-gray-400 font-bold uppercase sm:text-[10px]">Order ratio</div>
                </div>
             </div>

             <div className="flex min-w-0 flex-col items-center gap-1.5 sm:gap-2">
                <div className="relative flex h-12 w-12 items-center justify-center sm:h-16 sm:w-16">
                   <svg className="h-full w-full -rotate-90" viewBox="0 0 64 64">
                      <circle cx="32" cy="32" r="28" fill="transparent" stroke="#F0FAFC" strokeWidth="6" />
                      <circle cx="32" cy="32" r="28" fill="transparent" stroke="#2EB1CC" strokeWidth="6" strokeDasharray="175" strokeDashoffset="140" strokeLinecap="round" />
                   </svg>
                   <div className="absolute inset-0 flex items-center justify-center">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#F0FCFF] sm:h-8 sm:w-8">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-[#2EB1CC]"><path d="m22 7-8.5 8.5-5-5L2 17"/><path d="M16 7h6v6"/></svg>
                      </div>
                   </div>
                </div>
                <div className="text-center">
                   <div className="text-sm font-bold text-dark sm:text-lg">20%</div>
                   <div className="text-[9px] text-gray-400 font-bold uppercase sm:text-[10px]">Follow-ups</div>
                </div>
             </div>
          </div>
        </div>

        {/* Right Metric Cards */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:col-span-8 lg:gap-4">
          {stats.map((s, i) => (
            <div key={i} className="relative flex items-center gap-3 overflow-hidden rounded-2xl jitox-panel jitox-panel--shadow p-3 transition-all group hover:border-primary/20 cursor-default sm:gap-4 sm:p-4">
               {/* Side indicator */}
               <div className={`absolute top-0 bottom-0 left-0 w-1 ${s.color}`}></div>
               <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${s.bgColor} ${s.color} sm:h-12 sm:w-12`}>
                  <s.icon size={20} className="sm:size-6" />
               </div>
               <div className="flex flex-col">
                  <span className="text-[11px] text-gray-400 font-bold uppercase tracking-wider sm:text-xs">{s.label}</span>
                  <span className="text-lg font-bold text-dark sm:text-xl">{s.value}</span>
               </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PerformanceReportTab;
