import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import DashboardLayout from "../../layouts/DashboardLayout";
import { getStoredUser, isAdminUser } from "../../utils/authSession";
import { Plus } from "lucide-react";

export default function TasksLayout() {
  const user = getStoredUser();
  const admin = isAdminUser(user);
  const location = useLocation();
  const navigate = useNavigate();

  const tabs = [
    admin && { to: "/dashboard/tasks/all", label: "All tasks" },
    { to: "/dashboard/tasks/my", label: "My tasks" },
    admin && { to: "/dashboard/tasks/analytics", label: "Analytics" },
    { to: "/dashboard/tasks/notifications", label: "Notifications" },
  ].filter(Boolean);

  const canCreateHere = admin && location.pathname.endsWith("/all");

  const handleNewTask = () => {
    const sp = new URLSearchParams(location.search);
    sp.set("newTask", "1");
    navigate(`${location.pathname}?${sp.toString()}`);
  };

  return (
    <DashboardLayout>
      <div className="mb-3 flex min-w-0 items-center justify-between gap-3 sm:mb-4">
        <nav
          className="inline-flex min-w-0 max-w-full flex-nowrap items-center gap-0.5 overflow-x-auto rounded-lg border border-slate-200/80 bg-slate-100/90 p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden shadow-[inset_0_1px_0_rgba(255,255,255,0.65),0_1px_2px_rgba(15,23,42,0.05)] backdrop-blur-[2px] dark:border-slate-700/90 dark:bg-slate-900/85 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_1px_2px_rgba(0,0,0,0.25)]"
          aria-label="Task sections"
        >
          {tabs.map((t) => (
            <NavLink
              key={t.to}
              to={t.to}
              className={({ isActive }) =>
                [
                  "relative inline-flex min-h-9 shrink-0 select-none items-center justify-center rounded-md px-4 py-1.5 text-[13px] font-medium tracking-tight transition-[color,background-color,box-shadow,transform] duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-100 dark:focus-visible:ring-offset-slate-900 active:scale-[0.98]",
                  isActive
                    ? "bg-primary font-semibold text-white shadow-[0_1px_2px_rgba(15,23,42,0.08),0_2px_6px_rgba(15,23,42,0.06)] ring-1 ring-black/10 dark:bg-primary dark:text-white dark:shadow-[0_2px_8px_rgba(0,0,0,0.35)] dark:ring-white/15"
                    : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-50",
                ].join(" ")
              }
            >
              {t.label}
            </NavLink>
          ))}
        </nav>

        {canCreateHere ? (
          <button
            type="button"
            onClick={handleNewTask}
            className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md bg-primary px-2.5 text-[11px] font-semibold text-white shadow-sm transition hover:opacity-95 active:scale-[0.99]"
          >
            <Plus size={14} strokeWidth={2.5} aria-hidden />
            New task
          </button>
        ) : null}
      </div>
      <div className="min-w-0 pb-8">{/* padding for FAB clearance */}
        <Outlet />
      </div>
    </DashboardLayout>
  );
}
