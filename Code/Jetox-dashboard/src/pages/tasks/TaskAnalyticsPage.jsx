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
  if (!isAdminUser(user)) {
    return <Navigate to="/dashboard/tasks/my" replace />;
  }

  const { data, isLoading } = useQuery({
    queryKey: ["tasks", "analytics"],
    queryFn: async () => {
      const { data: d } = await tasksApi.getAnalytics();
      return d;
    },
    staleTime: 15_000,
    refetchInterval: 15_000,
  });

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
      <div className="space-y-2 mb-6">
        <h1 className="text-xl font-bold text-gray-900">Task analytics</h1>
        <p className="text-sm text-gray-500">
          Volume, ownership, and completion trends (admin only).
        </p>
      </div>

      {isLoading ? (
        <div className="text-center py-20 text-gray-500">Loading analytics…</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-light-border bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-800 mb-4">Tasks by status</h2>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                  >
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-2xl border border-light-border bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-800 mb-4">Tasks by user</h2>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="total" fill="#0d9488" name="Total" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="completed" fill="#34d399" name="Done" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-2xl border border-light-border bg-white p-4 shadow-sm lg:col-span-2">
            <h2 className="text-sm font-semibold text-gray-800 mb-4">Tasks created over time</h2>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lineData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip />
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
