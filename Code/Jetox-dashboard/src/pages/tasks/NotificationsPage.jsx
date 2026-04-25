import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import toast from "react-hot-toast";
import { notificationsApi } from "../../services/api";
import { getApiErrorMessage } from "../../utils/apiError";
import { getNotificationTargetPath } from "../../utils/notificationNavigation";
import { Bell, CheckCheck } from "lucide-react";

dayjs.extend(relativeTime);

export default function NotificationsPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();

  const { data: list = [], isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const { data } = await notificationsApi.list();
      return Array.isArray(data) ? data : [];
    },
    staleTime: 10_000,
    refetchInterval: 15_000,
  });

  const markAll = useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => {
      toast.success("All marked read");
      qc.invalidateQueries({ queryKey: ["notifications"] });
      qc.invalidateQueries({ queryKey: ["notifications", "unread-count"] });
    },
    onError: (e) => toast.error(getApiErrorMessage(e, "Could not update")),
  });

  const markOne = useMutation({
    mutationFn: (id) => notificationsApi.markRead(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
      qc.invalidateQueries({ queryKey: ["notifications", "unread-count"] });
    },
  });

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Notifications</h1>
          <p className="text-sm text-gray-500 mt-1">
            Task assignments and updates in real time.
          </p>
        </div>
        <button
          type="button"
          onClick={() => markAll.mutate()}
          disabled={markAll.isPending}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-light-border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
        >
          <CheckCheck size={18} />
          Mark all read
        </button>
      </div>

      <div className="rounded-2xl border border-light-border bg-white shadow-sm divide-y divide-light-border">
        {isLoading ? (
          <div className="p-10 text-center text-gray-500">Loading…</div>
        ) : list.length === 0 ? (
          <div className="p-10 text-center text-gray-500">No notifications yet.</div>
        ) : (
          list.map((n) => (
            <div
              key={n._id}
              className={`flex items-stretch gap-0 transition ${
                n.read ? "bg-white" : "bg-sky-50/40"
              }`}
            >
              <button
                type="button"
                className="flex min-w-0 flex-1 gap-4 p-4 text-left transition hover:bg-slate-50/80"
                onClick={() => {
                  const path = getNotificationTargetPath(n);
                  if (path) navigate(path);
                  if (!n.read) markOne.mutate(n._id);
                }}
              >
                <div className="shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <Bell size={20} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-gray-900">{n.title}</div>
                  <div className="text-sm text-gray-600 mt-0.5">{n.body}</div>
                  <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-400">
                    <span>{n.createdAt ? dayjs(n.createdAt).fromNow() : ""}</span>
                    {n.taskId ? (
                      <span className="text-primary font-medium">Open in tasks</span>
                    ) : null}
                  </div>
                </div>
              </button>
              {!n.read ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    markOne.mutate(n._id);
                  }}
                  className="shrink-0 self-start p-4 text-xs font-semibold text-primary hover:underline"
                >
                  Mark read
                </button>
              ) : null}
            </div>
          ))
        )}
      </div>
    </>
  );
}
