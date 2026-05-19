import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DashboardLayout from "../../../layouts/DashboardLayout";
import { ChevronLeft, Mail, Phone, MapPin, Briefcase } from "lucide-react";
import toast from "react-hot-toast";
import { usersApi } from "../../../services/api";
import { getApiErrorMessage } from "../../../utils/apiError";
import { buildUploadUrl } from "../../../utils/uploadUrl";
import VisitLogTab from "./VisitLogTab";
import OrdersPlacedTab from "./OrdersPlacedTab";
import ExpensesTab from "./ExpensesTab";
import AttendanceTab from "./AttendanceTab";
import PerformanceReportTab from "./PerformanceReportTab";

const UserSummaryIndex = () => {
  const { userId, tab } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(tab || "visit-log");
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const tabBtnRefs = useRef({});

  const loadSummary = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const { data } = await usersApi.getSummary(userId);
      setSummary(data.summary);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to load user summary"));
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  useEffect(() => {
    if (tab) setActiveTab(tab);
  }, [tab]);

  useEffect(() => {
    const el = tabBtnRefs.current[activeTab];
    if (el?.scrollIntoView) {
      el.scrollIntoView({ behavior: "smooth", inline: "nearest", block: "nearest" });
    }
  }, [activeTab]);

  const counts = summary?.counts || {};
  const tabs = [
    { id: "visit-log", label: `Visit Log (${counts.visits ?? 0})` },
    { id: "order-placed", label: `Orders Placed (${counts.orders ?? 0})` },
    { id: "expenses", label: `Expenses (${counts.expenses ?? 0})` },
    { id: "attendance", label: "Attendance Summary" },
    { id: "report", label: "Performance Reports" },
  ];

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    navigate(`/dashboard/user-master/summary/${userId}/${tabId}`);
  };

  const userData = summary?.profile || {
    name: "—",
    empId: "—",
    phone: "—",
    email: "—",
    role: "—",
    region: "—",
    image: null,
  };

  const photoUrl = userData.image ? buildUploadUrl(userData.image) : null;

  return (
    <DashboardLayout>
      <div className="flex min-w-0 flex-col gap-2.5 pb-5 sm:gap-3 sm:pb-8">
        <div className="flex flex-wrap items-center justify-between gap-2.5 sm:gap-3">
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => navigate("/dashboard/user-master")}
              className="rounded-full border border-light-border p-1.5 transition-colors hover:bg-slate-100 sm:p-2 dark:border-slate-600 dark:hover:bg-slate-800"
              aria-label="Back to user list"
            >
              <ChevronLeft size={18} className="text-slate-700 sm:size-5 dark:text-slate-200" />
            </button>
            <h1 className="text-lg font-bold text-dark sm:text-xl !mb-0">User Summary</h1>
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-sm text-slate-500">Loading summary…</div>
        ) : !summary ? (
          <div className="py-12 text-center text-sm text-slate-500">
            Could not load user data.
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl jitox-panel jitox-panel--shadow px-3 py-2 sm:gap-4 sm:px-5 sm:py-3">
              <div className="flex min-w-0 items-center gap-2.5 sm:gap-4">
                <div className="relative h-12 w-12 shrink-0 sm:h-14 sm:w-14">
                  <div className="h-full w-full overflow-hidden rounded-full border-2 border-primary/20">
                    {photoUrl ? (
                      <img
                        src={photoUrl}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-slate-100 text-lg font-bold text-slate-500 sm:text-xl dark:bg-slate-800 dark:text-slate-400">
                        {userData.name.charAt(0)}
                      </div>
                    )}
                  </div>
                </div>
                <div className="min-w-0 flex flex-col gap-0.5">
                  <div className="truncate text-sm font-bold text-slate-900 sm:text-base dark:text-slate-100">
                    {userData.name}
                  </div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    {userData.empId}
                  </div>
                </div>
              </div>

              <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1.5 sm:gap-x-4 sm:gap-y-2 sm:pr-1">
                <div className="flex items-center gap-2">
                  <Phone size={16} className="shrink-0 text-slate-400" aria-hidden />
                  <span className="truncate text-xs font-semibold sm:text-sm">{userData.phone}</span>
                </div>
                <div className="hidden h-8 w-px bg-slate-200 sm:block dark:bg-slate-600" aria-hidden />
                <div className="flex min-w-0 items-center gap-2">
                  <Mail size={16} className="shrink-0 text-slate-400" aria-hidden />
                  <span className="truncate text-xs font-semibold sm:text-sm">{userData.email}</span>
                </div>
                <div className="hidden h-8 w-px bg-slate-200 sm:block dark:bg-slate-600" aria-hidden />
                <div className="flex items-center gap-2">
                  <Briefcase size={16} className="shrink-0 text-slate-400" aria-hidden />
                  <span className="text-xs font-semibold sm:text-sm">{userData.role}</span>
                </div>
                <div className="hidden h-8 w-px bg-slate-200 sm:block dark:bg-slate-600" aria-hidden />
                <div className="flex items-center gap-2">
                  <MapPin size={16} className="shrink-0 text-slate-400" aria-hidden />
                  <span className="text-xs font-semibold sm:text-sm">{userData.region}</span>
                </div>
              </div>
            </div>

            <div className="min-w-0 overflow-hidden rounded-none sm:rounded-xl jitox-panel jitox-panel--shadow">
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

            <div className="min-w-0">
              {activeTab === "visit-log" && (
                <VisitLogTab rows={summary.visitLog} liveData />
              )}
              {activeTab === "order-placed" && (
                <OrdersPlacedTab orders={summary.orders} liveData />
              )}
              {activeTab === "expenses" && (
                <ExpensesTab expenses={summary.expenses} liveData />
              )}
              {activeTab === "attendance" && (
                <AttendanceTab attendance={summary.attendance} liveData />
              )}
              {activeTab === "report" && (
                <PerformanceReportTab performance={summary.performance} liveData />
              )}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default UserSummaryIndex;
