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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-1">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-slate-100">Notifications</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
            Task assignments and updates in real time.
          </p>
        </div>
        <button
          type="button"
          onClick={() => markAll.mutate()}
          disabled={markAll.isPending}
          className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-medium leading-none text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50"
        >
          <CheckCheck size={14} />
          Mark all read
        </button>
      </div>

      <div className="flex flex-col gap-2">
        {isLoading ? (
          <div className="py-16 text-center text-gray-500 dark:text-slate-400">
            <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" role="status"></div>
            <div className="mt-3 text-sm font-medium">Loading notifications...</div>
          </div>
        ) : list.length === 0 ? (
          <div className="rounded-xl border border-light-border border-dashed bg-gray-50/50 py-16 text-center dark:border-slate-700 dark:bg-slate-800/30">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-slate-800 mb-4">
              <CheckCheck size={24} className="text-gray-400 dark:text-slate-500" />
            </div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-slate-200">All caught up!</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">You have no new notifications right now.</p>
          </div>
        ) : (
          list.map((n) => (
            <div
              key={n._id}
              className={`group flex items-stretch overflow-hidden rounded-xl border bg-white shadow-sm transition-all duration-200 hover:-translate-y-px hover:shadow-md dark:bg-slate-900 ${n.read
                  ? "border-light-border dark:border-slate-700 border-l-4 border-l-transparent"
                  : "border-light-border dark:border-slate-700 border-l-4 border-l-primary bg-emerald-50/20 dark:bg-emerald-900/10"
                }`}
            >
              <button
                type="button"
                className="flex min-w-0 flex-1 items-start gap-3 sm:gap-4 p-3 sm:p-4 text-left transition hover:bg-slate-50/50 dark:hover:bg-slate-800/40"
                onClick={() => {
                  const path = getNotificationTargetPath(n);
                  if (path) navigate(path);
                  if (!n.read) markOne.mutate(n._id);
                }}
              >
                <div className={`shrink-0 flex h-10 w-10 items-center justify-center rounded-full ${n.read ? 'bg-gray-100 text-gray-500 dark:bg-slate-800 dark:text-slate-400' : 'bg-primary/10 text-primary dark:bg-primary/20'}`}>
                  <Bell size={20} />
                </div>
                <div className="min-w-0 flex-1 flex flex-col sm:flex-row gap-3 justify-between">
                  <div className="min-w-0 flex-1">
                    <div className={`font-semibold ${n.read ? 'text-gray-800 dark:text-slate-300' : 'text-gray-900 dark:text-slate-100'}`}>
                      {n.title}
                    </div>
                    <div className={`mt-1 text-sm leading-relaxed ${n.read ? 'text-gray-500 dark:text-slate-400' : 'text-gray-600 dark:text-slate-300'}`}>
                      {n.body}
                    </div>
                  </div>
                  <div className="flex flex-col sm:items-end justify-between shrink-0 gap-3">
                    <div className="flex items-center gap-3 text-xs font-medium text-gray-400 dark:text-slate-500">
                      <span>{n.createdAt ? dayjs(n.createdAt).fromNow() : ""}</span>
                      {n.taskId ? (
                        <>
                          <span className="h-1 w-1 rounded-full bg-gray-300 dark:bg-slate-600"></span>
                          <span className="text-primary hover:underline transition-colors">Open in tasks</span>
                        </>
                      ) : null}
                    </div>
                    {!n.read ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          markOne.mutate(n._id);
                        }}
                        className="self-start sm:self-end rounded-full bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-primary shadow-sm ring-1 ring-inset ring-gray-200 dark:ring-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700 transition-all opacity-100 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100"
                      >
                        Mark read
                      </button>
                    ) : null}
                  </div>
                </div>
              </button>
            </div>
          ))
        )}
      </div>
    </>
  );
}
