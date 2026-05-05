import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DashboardLayout from "../../../layouts/DashboardLayout";
import { ChevronLeft, Mail, Phone, MapPin, Briefcase, Calendar } from "lucide-react";
import VisitLogTab from "./VisitLogTab";
import OrdersPlacedTab from "./OrdersPlacedTab";
import ExpensesTab from "./ExpensesTab";
import AttendanceTab from "./AttendanceTab";
import PerformanceReportTab from "./PerformanceReportTab";

const UserSummaryIndex = () => {
  const { userId, tab } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(tab || "visit-log");
  const tabBtnRefs = useRef({});

  useEffect(() => {
    if (tab) {
      setActiveTab(tab);
    }
  }, [tab]);

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
    navigate(`/dashboard/user-master/summary/${userId}/${tabId}`);
  };

  // Mock user data - in real app, fetch by userId
  const userData = {
    name: "Anita Mehra",
    empId: "EMP002",
    phone: "(308) 555-0121",
    email: "anitamehra@gmail.com",
    role: "Manager",
    region: "Gujarat",
    image: null, // Add placeholder logic
  };

  return (
    <DashboardLayout>
      <div className="flex min-w-0 flex-col gap-3 pb-6 sm:gap-3 sm:pb-8">
        {/* Header Section */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate("/dashboard/user-master")}
              className="rounded-full border border-light-border p-2 transition-colors hover:bg-slate-100 dark:border-slate-600 dark:hover:bg-slate-800"
              aria-label="Back to user list"
            >
              <ChevronLeft size={20} className="text-slate-700 dark:text-slate-200" />
            </button>
            <h1 className="text-xl font-bold text-dark">User Summary</h1>
          </div>
          <div className="jitox-header-pill">
            <Calendar size={16} className="text-slate-400 dark:text-slate-500" />
            20 Jan, 2:30 PM
          </div>
        </div>

        {/* User Stats Card */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl jitox-panel jitox-panel--shadow p-4 sm:p-5">
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full border-2 border-primary/20">
              <div className="flex h-full w-full items-center justify-center bg-slate-100 text-xl font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                {userData.name.charAt(0)}
              </div>
              <div className="absolute bottom-0 right-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-500 dark:border-slate-900" />
            </div>
            <div className="min-w-0 flex flex-col gap-0.5">
              <div className="truncate text-base font-bold text-slate-900 dark:text-slate-100">
                {userData.name}
              </div>
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {userData.empId}
              </div>
            </div>
          </div>

          <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2 sm:pr-1">
            <div className="flex items-center gap-2">
              <Phone size={16} className="shrink-0 text-slate-400 dark:text-slate-500" aria-hidden />
              <span className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                {userData.phone}
              </span>
            </div>
            <div className="hidden h-8 w-px bg-slate-200 sm:block dark:bg-slate-600" aria-hidden />
            <div className="flex min-w-0 items-center gap-2">
              <Mail size={16} className="shrink-0 text-slate-400 dark:text-slate-500" aria-hidden />
              <span className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                {userData.email}
              </span>
            </div>
            <div className="hidden h-8 w-px bg-slate-200 sm:block dark:bg-slate-600" aria-hidden />
            <div className="flex items-center gap-2">
              <Briefcase size={16} className="shrink-0 text-slate-400 dark:text-slate-500" aria-hidden />
              <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{userData.role}</span>
            </div>
            <div className="hidden h-8 w-px bg-slate-200 sm:block dark:bg-slate-600" aria-hidden />
            <div className="flex items-center gap-2">
              <MapPin size={16} className="shrink-0 text-slate-400 dark:text-slate-500" aria-hidden />
              <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{userData.region}</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation: scroll row on small screens; equal columns from lg */}
        <div className="min-w-0 overflow-hidden rounded-xl jitox-panel jitox-panel--shadow">
          <div
            className="flex min-w-0 overflow-x-auto overscroll-x-contain [-webkit-overflow-scrolling:touch] lg:overflow-visible"
            role="tablist"
            aria-label="Summary sections"
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
                className={`min-h-11 shrink-0 whitespace-nowrap border-r border-slate-100 px-4 py-2.5 text-center text-xs font-semibold transition-colors last:border-r-0 sm:min-h-12 sm:px-5 sm:text-sm lg:min-h-0 lg:min-w-0 lg:flex-1 lg:whitespace-normal lg:px-3 lg:py-2.5 dark:border-slate-700 ${
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

        {/* Sub-filters */}
        <div className="inline-flex w-fit max-w-full items-center gap-1 rounded-xl bg-slate-100/90 p-1 dark:bg-slate-800/80">
          <button
            type="button"
            className="rounded-lg bg-white px-4 py-1.5 text-xs font-semibold text-primary shadow-sm ring-1 ring-primary/15 dark:bg-slate-900 dark:ring-primary/25 sm:px-5 sm:text-sm"
          >
            My Data
          </button>
          <button
            type="button"
            className="rounded-lg px-4 py-1.5 text-xs font-semibold text-slate-500 transition-colors hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 sm:px-5 sm:text-sm"
          >
            User (10)
          </button>
        </div>

        {/* Dynamic Content */}
        <div className="min-w-0">
          {activeTab === "visit-log" && <VisitLogTab />}
          {activeTab === "order-placed" && <OrdersPlacedTab />}
          {activeTab === "expenses" && <ExpensesTab />}
          {activeTab === "attendance" && <AttendanceTab />}
          {activeTab === "report" && <PerformanceReportTab />}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default UserSummaryIndex;
