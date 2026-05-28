import { Navigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";
import { tasksApi } from "../../services/api";
import { isAdminUser, getStoredUser } from "../../utils/authSession";
import { TASK_STATUS_LABEL } from "../../utils/taskUtils";

const COLORS = ["#94a3b8", "#f59e0b", "#0ea5e9", "#10b981", "#ef4444"];

export default function TaskAnalyticsPage() {
  const user = getStoredUser();
  const isAdmin = isAdminUser(user);

  const { data, isLoading } = useQuery({
    queryKey: ["tasks", "analytics"],
    queryFn: async () => {
      const { data: d } = await tasksApi.getAnalytics();
      return d;
    },
    staleTime: 15_000,
    refetchInterval: 15_000,
    enabled: isAdmin,
  });

  if (!isAdminUser(user)) {
    return <Navigate to="/dashboard/tasks/my" replace />;
  }

  const pieData = data?.byStatus
    ? Object.entries(data.byStatus).map(([name, value]) => ({
        name: TASK_STATUS_LABEL[name] || name,
        value,
      }))
    : [];

  const barData = (data?.byUser || [])
    .slice(0, 12)
    .map((r) => ({
      name: r.name?.split(" ")[0] || r.userId?.slice(-4) || "User",
      total: r.total,
      completed: r.completed,
    }));

  const lineData = data?.byDay
    ? Object.entries(data.byDay)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, count]) => ({ date, count }))
    : [];

  return (
    <>
      <div className="space-y-1 mb-4 md:mb-5">
        <h1 className="text-lg md:text-xl font-bold text-gray-900 dark:text-slate-100">Task analytics</h1>
        <p className="text-sm text-gray-500 dark:text-slate-400">
          Volume, ownership, and completion trends (admin only).
        </p>
      </div>

      {isLoading ? (
        <div className="text-center py-20 text-gray-500 dark:text-slate-400">Loading analytics…</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 items-stretch">
          <div className="rounded-2xl border border-light-border bg-white p-3 md:p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <h2 className="text-sm font-semibold text-gray-800 dark:text-slate-200 mb-2 md:mb-3">Tasks by status</h2>
            <div className="h-[190px] sm:h-[210px] md:h-[220px] lg:h-[240px] xl:h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius="72%"
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                  >
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: "var(--color-headBg)", borderColor: "var(--color-light-border)", color: "var(--color-dark)", borderRadius: "8px" }}
                    itemStyle={{ color: "var(--color-dark)" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-2xl border border-light-border bg-white p-3 md:p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <h2 className="text-sm font-semibold text-gray-800 dark:text-slate-200 mb-2 md:mb-3">Tasks by user</h2>
            <div className="h-[190px] sm:h-[210px] md:h-[220px] lg:h-[240px] xl:h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-light-border)" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: "var(--color-light)" }} />
                  <YAxis tick={{ fontSize: 11, fill: "var(--color-light)" }} allowDecimals={false} />
                  <Tooltip
                    cursor={{ fill: "var(--color-rowBg)" }}
                    contentStyle={{ backgroundColor: "var(--color-headBg)", borderColor: "var(--color-light-border)", color: "var(--color-dark)", borderRadius: "8px" }}
                    itemStyle={{ color: "var(--color-dark)" }}
                  />
                  <Bar dataKey="total" fill="#0d9488" name="Total" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="completed" fill="#34d399" name="Done" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-2xl border border-light-border bg-white p-3 md:p-4 shadow-sm md:col-span-2 dark:border-slate-700 dark:bg-slate-900">
            <h2 className="text-sm font-semibold text-gray-800 dark:text-slate-200 mb-2 md:mb-3">Tasks created over time</h2>
            <div className="h-[190px] sm:h-[210px] md:h-[220px] lg:h-[240px] xl:h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lineData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-light-border)" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 10, fill: "var(--color-light)" }} 
                    tickFormatter={(val) => {
                      if (!val) return "";
                      const parts = val.split('-');
                      return parts.length === 3 ? `${parts[1]}/${parts[2]}` : val;
                    }}
                  />
                  <YAxis tick={{ fontSize: 11, fill: "var(--color-light)" }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "var(--color-headBg)", borderColor: "var(--color-light-border)", color: "var(--color-dark)", borderRadius: "8px" }}
                    itemStyle={{ color: "var(--color-dark)" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#0d9488"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
