import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import DashboardLayout from "../../../layouts/DashboardLayout";
import { ChevronLeft, Mail, Phone, MapPin, Briefcase, Calendar } from "lucide-react";
import VisitLogTab from "./VisitLogTab";
import OrdersPlacedTab from "./OrdersPlacedTab";
import ExpensesTab from "./ExpensesTab";
import AttendanceTab from "./AttendanceTab";
import PerformanceReportTab from "./PerformanceReportTab";
import { hrmApi } from "../../../services/api";

const EmployeeSummaryIndex = () => {
  const { employeeId, tab } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(tab || "visit-log");
  const [employeeData, setEmployeeData] = useState(null);
  const [linkedUserId, setLinkedUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const tabBtnRefs = useRef({});

  useEffect(() => {
    if (tab) setActiveTab(tab);
  }, [tab]);

  const loadEmployee = useCallback(async () => {
    if (!employeeId) {
      setEmployeeData(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data } = await hrmApi.getEmployee(employeeId);
      const e = data || {};
      const idStr = String(e._id || employeeId);
      setLinkedUserId(
        e.linkedUserId ? String(e.linkedUserId) : location.state?.linkedUserId || null
      );
      setEmployeeData({
        name: e.name || "—",
        empId: idStr.length >= 2 ? `EMP${idStr.slice(-2).toUpperCase()}` : idStr.slice(-8).toUpperCase(),
        phone: e.phone || "—",
        email: e.email || "—",
        role: e.roleDesignation || e.department || "—",
        region: e.department || "—",
      });
    } catch (err) {
      toast.error(
        err?.response?.data?.message || "Failed to load employee"
      );
      setEmployeeData(null);
    } finally {
      setLoading(false);
    }
  }, [employeeId, location.state?.linkedUserId]);

  useEffect(() => {
    loadEmployee();
  }, [loadEmployee]);

  useEffect(() => {
    const el = tabBtnRefs.current[activeTab];
    if (el?.scrollIntoView) {
      el.scrollIntoView({ behavior: "smooth", inline: "nearest", block: "nearest" });
    }
  }, [activeTab]);

  const tabs = [
    { id: "visit-log", label: "Visit Log (05)" },
    { id: "order-placed", label: "Orders Placed (08)" },
    { id: "expenses", label: "Expenses" },
    { id: "attendance", label: "Attendance Summary" },
    { id: "report", label: "Performance Reports" },
  ];

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    navigate(
      `/dashboard/user-master/employee-summary/${employeeId}/${tabId}`,
      { state: { linkedUserId } }
    );
  };

  const handleBack = () => {
    if (linkedUserId) {
      navigate(`/dashboard/user-master/summary/${linkedUserId}/visit-log`, {
        state: { openTeamScope: true },
      });
      return;
    }
    navigate("/dashboard/user-master");
  };

  const display = employeeData || {
    name: "—",
    empId: "—",
    phone: "—",
    email: "—",
    role: "—",
    region: "—",
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "visit-log":
        return <VisitLogTab showFilterByLabel />;
      case "order-placed":
        return <OrdersPlacedTab showFilterByLabel />;
      case "expenses":
        return <ExpensesTab showFilterByLabel />;
      case "attendance":
        return <AttendanceTab showFilterByLabel />;
      case "report":
        return <PerformanceReportTab />;
      default:
        return <VisitLogTab showFilterByLabel />;
    }
  };

  return (
    <DashboardLayout>
      <div className="flex min-w-0 flex-col gap-2.5 pb-5 sm:gap-3 sm:pb-8">
        <div className="flex flex-wrap items-center justify-between gap-2.5 sm:gap-3">
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={handleBack}
              className="rounded-full border border-light-border p-1.5 transition-colors hover:bg-slate-100 sm:p-2 dark:border-slate-600 dark:hover:bg-slate-800"
              aria-label="Back"
            >
              <ChevronLeft size={18} className="text-slate-700 sm:size-5 dark:text-slate-200" />
            </button>
            <h1 className="text-lg font-bold text-dark sm:text-xl !mb-0">
              Employee Summary
            </h1>
          </div>
          <div className="jitox-header-pill px-2 py-1 text-[11px] leading-none sm:px-3 sm:py-1.5 sm:text-sm sm:leading-normal">
            <Calendar size={16} className="text-slate-400 dark:text-slate-500" />
            20 Jan, 2:30 PM
          </div>
        </div>

        {loading ? (
          <div className="rounded-2xl jitox-panel jitox-panel--shadow px-3 py-6 text-center text-sm text-light dark:text-slate-400">
            Loading employee…
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl jitox-panel jitox-panel--shadow px-3 py-2 sm:gap-4 sm:px-5 sm:py-3">
            <div className="flex min-w-0 items-center gap-2.5 sm:gap-4">
              <div className="relative h-12 w-12 shrink-0 sm:h-14 sm:w-14">
                <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-full border-2 border-primary/20 bg-slate-100 text-lg font-bold text-slate-500 sm:text-xl dark:bg-slate-800 dark:text-slate-400">
                  {display.name.charAt(0)}
                </div>
                <span
                  className="pointer-events-none absolute bottom-0 right-0 z-1 box-border h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500 shadow-sm ring-1 ring-emerald-600/20 sm:h-3 sm:w-3 dark:border-slate-900"
                  aria-hidden
                  title="Active"
                />
              </div>
              <div className="min-w-0 flex flex-col gap-0.5">
                <div className="truncate text-sm font-bold text-slate-900 sm:text-base dark:text-slate-100">
                  {display.name}
                </div>
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {display.empId}
                </div>
              </div>
            </div>

            <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1.5 sm:gap-x-4 sm:gap-y-2 sm:pr-1">
              <div className="flex items-center gap-2">
                <Phone size={16} className="shrink-0 text-slate-400 dark:text-slate-500" aria-hidden />
                <span className="truncate text-xs font-semibold text-slate-900 sm:text-sm dark:text-slate-100">
                  {display.phone}
                </span>
              </div>
              <div className="hidden h-8 w-px bg-slate-200 sm:block dark:bg-slate-600" aria-hidden />
              <div className="flex min-w-0 items-center gap-2">
                <Mail size={16} className="shrink-0 text-slate-400 dark:text-slate-500" aria-hidden />
                <span className="truncate text-xs font-semibold text-slate-900 sm:text-sm dark:text-slate-100">
                  {display.email}
                </span>
              </div>
              <div className="hidden h-8 w-px bg-slate-200 sm:block dark:bg-slate-600" aria-hidden />
              <div className="flex items-center gap-2">
                <Briefcase size={16} className="shrink-0 text-slate-400 dark:text-slate-500" aria-hidden />
                <span className="text-xs font-semibold text-slate-900 sm:text-sm dark:text-slate-100">
                  {display.role}
                </span>
              </div>
              <div className="hidden h-8 w-px bg-slate-200 sm:block dark:bg-slate-600" aria-hidden />
              <div className="flex items-center gap-2">
                <MapPin size={16} className="shrink-0 text-slate-400 dark:text-slate-500" aria-hidden />
                <span className="text-xs font-semibold text-slate-900 sm:text-sm dark:text-slate-100">
                  {display.region}
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="min-w-0 overflow-hidden rounded-none sm:rounded-xl jitox-panel jitox-panel--shadow">
          <div
            className="flex min-w-0 overflow-x-auto overscroll-x-contain [-webkit-overflow-scrolling:touch] lg:overflow-visible"
            role="tablist"
            aria-label="Employee summary sections"
          >
            {tabs.map((t) => (
              <button
                key={t.id}
                ref={(node) => {
                  if (node) tabBtnRefs.current[t.id] = node;
                  else delete tabBtnRefs.current[t.id];
                }}
                type="button"
                role="tab"
                aria-selected={activeTab === t.id}
                onClick={() => handleTabChange(t.id)}
                className={`min-h-8 shrink-0 whitespace-nowrap border-r border-slate-100 px-2 py-1 text-center text-[10px] font-semibold transition-colors last:border-r-0 sm:min-h-10 sm:px-4 sm:py-2 sm:text-[13px] lg:min-h-0 lg:min-w-0 lg:flex-1 lg:whitespace-normal lg:px-2.5 lg:py-2 dark:border-slate-700 ${
                  activeTab === t.id
                    ? "bg-primary text-white"
                    : "bg-white text-slate-600 hover:bg-slate-50 dark:bg-slate-900/80 dark:text-slate-300 dark:hover:bg-slate-800"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="min-w-0 flex flex-col gap-2">{renderTabContent()}</div>
      </div>
    </DashboardLayout>
  );
};

export default EmployeeSummaryIndex;
