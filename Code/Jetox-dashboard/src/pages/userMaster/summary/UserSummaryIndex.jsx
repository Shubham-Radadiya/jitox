import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import DashboardLayout from "../../../layouts/DashboardLayout";
import { ChevronLeft, Mail, Phone, MapPin, Briefcase } from "lucide-react";
import { usersApi } from "../../../services/api";
import { getApiErrorMessage } from "../../../utils/apiError";
import { buildUploadUrl } from "../../../utils/uploadUrl";
import VisitLogTab from "./VisitLogTab";
import OrdersPlacedTab from "./OrdersPlacedTab";
import ExpensesTab from "./ExpensesTab";
import AttendanceTab from "./AttendanceTab";
import PerformanceReportTab from "./PerformanceReportTab";
import DataScopeToggle from "./DataScopeToggle";
import SubordinateUsersTable from "./SubordinateUsersTable";
import { userService } from "../../../services/user.services";

const EMPTY_PROFILE = {
  name: "—",
  empId: "—",
  phone: "—",
  email: "—",
  role: "—",
  region: "—",
  image: null,
};

const UserSummaryIndex = () => {
  const { userId, tab } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(tab || "visit-log");
  const [dataScope, setDataScope] = useState("my");
  const [teamCount, setTeamCount] = useState(0);
  const [userData, setUserData] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [summary, setSummary] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const tabBtnRefs = useRef({});

  const loadSummary = useCallback(async () => {
    if (!userId) return;
    setLoadingSummary(true);
    try {
      const { data } = await usersApi.getSummary(userId);
      setSummary(data.summary);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to load user summary"));
      setSummary(null);
    } finally {
      setLoadingSummary(false);
    }
  }, [userId]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  useEffect(() => {
    if (tab) setActiveTab(tab);
  }, [tab]);

  useEffect(() => {
    setDataScope("my");
  }, [userId]);

  const loadUser = useCallback(async () => {
    if (!userId) {
      setUserData(null);
      setLoadingUser(false);
      return;
    }
    setLoadingUser(true);
    try {
      const { data } = await userService.getById(userId);
      const u = data.user || {};
      const name =
        u.name ||
        [u.firstName, u.lastName].filter(Boolean).join(" ").trim() ||
        "User";
      setUserData({
        name,
        empId: u._id ? String(u._id).slice(-8).toUpperCase() : "—",
        phone: u.phone || "—",
        email: u.email || "—",
        role: u.role || "—",
        region: u.region || u.city || "—",
        image: u.profilePhoto ? buildUploadUrl(u.profilePhoto) : null,
      });
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to load user");
      setUserData(null);
    } finally {
      setLoadingUser(false);
    }
  }, [userId]);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  useEffect(() => {
    if (!userId) return;
    userService
      .getSubordinates(userId)
      .then(({ data }) => setTeamCount(data.count ?? data.users?.length ?? 0))
      .catch(() => setTeamCount(0));
  }, [userId]);

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

  const handleTeamCountChange = useCallback((count) => {
    setTeamCount(count);
  }, []);

  const displayUser = userData || summary?.profile || EMPTY_PROFILE;
  const liveData = !!summary;

  const canViewTeamScope = ["admin", "manager"].includes(
    String(displayUser.role || "").toLowerCase()
  );

  useEffect(() => {
    if (!canViewTeamScope) {
      setDataScope("my");
      return;
    }
    if (location.state?.openTeamScope && !loadingUser) {
      setDataScope("team");
      navigate(location.pathname, { replace: true, state: {} });
      return;
    }
    if (tab) setDataScope("my");
  }, [
    canViewTeamScope,
    userId,
    tab,
    loadingUser,
    location.state?.openTeamScope,
    location.pathname,
    navigate,
  ]);

  const showFilterByLabel = !canViewTeamScope;
  const filterLeading =
    canViewTeamScope && !loadingUser ? (
      <DataScopeToggle
        value={dataScope}
        onChange={setDataScope}
        teamCount={teamCount}
      />
    ) : null;

  const renderTabContent = () => {
    if (canViewTeamScope && dataScope === "team") {
      return (
        <SubordinateUsersTable
          parentUserId={userId}
          onCountChange={handleTeamCountChange}
        />
      );
    }

    switch (activeTab) {
      case "visit-log":
        return (
          <VisitLogTab
            rows={summary?.visitLog}
            liveData={liveData}
            showFilterByLabel={showFilterByLabel}
            filterLeading={filterLeading}
          />
        );
      case "order-placed":
        return (
          <OrdersPlacedTab
            orders={summary?.orders}
            liveData={liveData}
            showFilterByLabel={showFilterByLabel}
            filterLeading={filterLeading}
          />
        );
      case "expenses":
        return (
          <ExpensesTab
            expenses={summary?.expenses}
            liveData={liveData}
            showFilterByLabel={showFilterByLabel}
            filterLeading={filterLeading}
          />
        );
      case "attendance":
        return (
          <AttendanceTab
            attendance={summary?.attendance}
            liveData={liveData}
            showFilterByLabel={showFilterByLabel}
            filterLeading={filterLeading}
          />
        );
      case "report":
        return (
          <PerformanceReportTab
            performance={summary?.performance}
            liveData={liveData}
            filterLeading={filterLeading}
          />
        );
      default:
        return (
          <VisitLogTab
            rows={summary?.visitLog}
            liveData={liveData}
            showFilterByLabel={showFilterByLabel}
            filterLeading={filterLeading}
          />
        );
    }
  };

  const photoUrl = displayUser.image
    ? String(displayUser.image).startsWith("http")
      ? displayUser.image
      : buildUploadUrl(displayUser.image)
    : null;

  const loading = loadingUser || loadingSummary;

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
          <div className="rounded-2xl jitox-panel jitox-panel--shadow px-3 py-6 text-center text-sm text-light dark:text-slate-400">
            Loading user…
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
                        {displayUser.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <span
                    className="pointer-events-none absolute bottom-0 right-0 z-1 box-border h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500 shadow-sm ring-1 ring-emerald-600/20 sm:h-3 sm:w-3 dark:border-slate-900"
                    aria-hidden
                    title="Active"
                  />
                </div>
                <div className="min-w-0 flex flex-col gap-0.5">
                  <div className="truncate text-sm font-bold text-slate-900 sm:text-base dark:text-slate-100">
                    {displayUser.name}
                  </div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    {displayUser.empId}
                  </div>
                </div>
              </div>

              <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1.5 sm:gap-x-4 sm:gap-y-2 sm:pr-1">
                <div className="flex items-center gap-2">
                  <Phone size={16} className="shrink-0 text-slate-400 dark:text-slate-500" aria-hidden />
                  <span className="truncate text-xs font-semibold text-slate-900 sm:text-sm dark:text-slate-100">
                    {displayUser.phone}
                  </span>
                </div>
                <div className="hidden h-8 w-px bg-slate-200 sm:block dark:bg-slate-600" aria-hidden />
                <div className="flex min-w-0 items-center gap-2">
                  <Mail size={16} className="shrink-0 text-slate-400 dark:text-slate-500" aria-hidden />
                  <span className="truncate text-xs font-semibold text-slate-900 sm:text-sm dark:text-slate-100">
                    {displayUser.email}
                  </span>
                </div>
                <div className="hidden h-8 w-px bg-slate-200 sm:block dark:bg-slate-600" aria-hidden />
                <div className="flex items-center gap-2">
                  <Briefcase size={16} className="shrink-0 text-slate-400 dark:text-slate-500" aria-hidden />
                  <span className="text-xs font-semibold text-slate-900 sm:text-sm dark:text-slate-100">
                    {displayUser.role}
                  </span>
                </div>
                <div className="hidden h-8 w-px bg-slate-200 sm:block dark:bg-slate-600" aria-hidden />
                <div className="flex items-center gap-2">
                  <MapPin size={16} className="shrink-0 text-slate-400 dark:text-slate-500" aria-hidden />
                  <span className="text-xs font-semibold text-slate-900 sm:text-sm dark:text-slate-100">
                    {displayUser.region}
                  </span>
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

            <div className="min-w-0 flex flex-col gap-2">{renderTabContent()}</div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default UserSummaryIndex;
