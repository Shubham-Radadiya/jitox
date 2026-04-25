import { NavLink, Outlet } from "react-router-dom";
import DashboardLayout from "../../layouts/DashboardLayout";
import { getStoredUser, isAdminUser } from "../../utils/authSession";

export default function TasksLayout() {
  const user = getStoredUser();
  const admin = isAdminUser(user);

  const tabs = [
    admin && { to: "/dashboard/tasks/all", label: "All tasks" },
    { to: "/dashboard/tasks/my", label: "My tasks" },
    admin && { to: "/dashboard/tasks/analytics", label: "Analytics" },
    { to: "/dashboard/tasks/notifications", label: "Notifications" },
  ].filter(Boolean);

  return (
    <DashboardLayout>
      <div className="mb-6 min-w-0 sm:mb-8">
        <nav
          className="inline-flex flex-wrap gap-1 rounded-[14px] border border-slate-200/90 bg-slate-100/80 p-1 shadow-inner dark:border-slate-700 dark:bg-slate-900/80"
          aria-label="Task sections"
        >
          {tabs.map((t) => (
            <NavLink
              key={t.to}
              to={t.to}
              className={({ isActive }) =>
                [
                  "inline-flex items-center rounded-[10px] px-3.5 py-2 text-[14px] font-medium transition-all duration-150",
                  isActive
                    ? "bg-white font-semibold text-primary shadow-sm shadow-slate-200/60 ring-1 ring-slate-200/80 dark:bg-slate-800 dark:text-emerald-400 dark:shadow-none dark:ring-slate-600"
                    : "text-slate-600 hover:bg-white/60 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-100",
                ].join(" ")
              }
            >
              {t.label}
            </NavLink>
          ))}
        </nav>
      </div>
      <div className="min-w-0 pb-8">{/* padding for FAB clearance */}
        <Outlet />
      </div>
    </DashboardLayout>
  );
}
