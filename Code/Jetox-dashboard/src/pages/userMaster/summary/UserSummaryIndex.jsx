import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DashboardLayout from "../../../layouts/DashboardLayout";
import { Button } from "../../../components/ui/CommanUI";
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

  useEffect(() => {
    if (tab) {
      setActiveTab(tab);
    }
  }, [tab]);

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
      <div className="ds-stack-major pb-8">
        {/* Header Section */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate("/dashboard/user-master")}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors border border-gray-200 dark:border-slate-600 dark:hover:bg-slate-800"
            >
              <ChevronLeft size={20} />
            </button>
            <h1 className="text-xl font-bold text-dark">User Summary</h1>
          </div>
          <div className="jitox-header-pill">
            <Calendar size={16} className="text-gray-400 dark:text-slate-500" />
            20 Jan, 2:30 PM
          </div>
        </div>

        {/* User Stats Card */}
        <div className="rounded-2xl jitox-panel jitox-panel--shadow p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-primary/10 relative">
              <div className="w-full h-full bg-gray-100 flex items-center justify-center text-xl font-bold text-gray-400 dark:bg-slate-800 dark:text-slate-500">
                {userData.name.charAt(0)}
              </div>
              <div className="absolute bottom-0 right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
            </div>
            <div className="flex flex-col">
              <div className="text-base font-bold text-dark">{userData.name}</div>
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{userData.empId}</div>
            </div>
          </div>

          <div className="flex items-center gap-4 pr-4">
            <div className="flex items-center gap-2">
              <Phone size={16} className="text-gray-400" />
              <span className="text-sm font-semibold text-dark">{userData.phone}</span>
            </div>
            <div className="h-8 w-[1px] bg-gray-100 dark:bg-slate-700"></div>
            <div className="flex items-center gap-2">
              <Mail size={16} className="text-gray-400" />
              <span className="text-sm font-semibold text-dark">{userData.email}</span>
            </div>
            <div className="h-8 w-[1px] bg-gray-100 dark:bg-slate-700"></div>
            <div className="flex items-center gap-2">
              <Briefcase size={16} className="text-gray-400" />
              <span className="text-sm font-semibold text-dark">{userData.role}</span>
            </div>
            <div className="h-8 w-[1px] bg-gray-100 dark:bg-slate-700"></div>
            <div className="flex items-center gap-2 text-dark">
              <MapPin size={16} className="text-gray-400" />
              <span className="text-sm font-semibold">{userData.region}</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="rounded-xl jitox-panel jitox-panel--shadow overflow-hidden flex">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => handleTabChange(t.id)}
              className={`flex-1 py-3 text-sm font-semibold transition-all duration-200 border-r last:border-r-0 border-gray-50 dark:border-slate-700
                ${activeTab === t.id 
                  ? "bg-primary text-white" 
                  : "bg-white text-gray-500 hover:bg-gray-50 dark:bg-slate-900/40 dark:text-slate-400 dark:hover:bg-slate-800/60"}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab Content Header */}
        <div className="flex items-center gap-4 bg-[#F8F9FE] p-1.5 rounded-xl w-fit dark:bg-slate-800/60">
           <button className="px-6 py-2 rounded-lg text-sm font-bold bg-white text-primary border border-primary/10 shadow-sm dark:bg-slate-900 dark:border-primary/30">My Data</button>
           <button className="px-6 py-2 rounded-lg text-sm font-bold text-gray-400 hover:text-dark transition-colors dark:text-slate-500 dark:hover:text-slate-200">User (10)</button>
        </div>

        {/* Dynamic Content */}
        <div className="mt-2">
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
