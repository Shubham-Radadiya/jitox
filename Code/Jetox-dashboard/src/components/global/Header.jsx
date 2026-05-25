import { Bell, LogOut, Moon, Sun, Menu } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { NotificationModal } from "./Notification";
import { clearAuthSession, getStoredUser } from "../../utils/authSession";
import { notificationsApi } from "../../services/api";
import { getApiErrorMessage } from "../../utils/apiError";
import { getNotificationTargetPath } from "../../utils/notificationNavigation";
import { notificationIconForType } from "../../utils/notificationIcons";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useTheme } from "../../providers/ThemeProvider";

dayjs.extend(relativeTime);

const Header = ({
  isMobile = false,
  onToggleSidebar,
  pageTitle,
  pageSubtitle,
}) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const stored = getStoredUser();
  const [showNotifications, setShowNotifications] = useState(false);
  const { isDark, toggleTheme } = useTheme();

  const { data: unreadPayload } = useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: async () => {
      const { data } = await notificationsApi.unreadCount();
      return data;
    },
    staleTime: 15_000,
    refetchInterval: 15_000,
  });

  const unreadCount = Number(unreadPayload?.count ?? 0);

  const { data: notificationList = [] } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const { data } = await notificationsApi.list({ limit: 50 });
      return Array.isArray(data) ? data : [];
    },
    enabled: showNotifications,
    staleTime: 10_000,
  });

  const notificationsForModal = notificationList.map((n) => ({
    id: n._id,
    title: n.title,
    subtitle: n.body,
    time: n.createdAt ? dayjs(n.createdAt).fromNow() : "",
    read: n.read,
    raw: n,
    icon: notificationIconForType(n.type),
  }));

  const userName =
    stored?.name ||
    [stored?.firstName, stored?.lastName].filter(Boolean).join(" ").trim() ||
    "User";

  const displayEmail = stored?.email || "";
  const profileTitle = [userName, stored?.role, displayEmail].filter(Boolean).join(" · ");

  const handleLogout = () => {
    clearAuthSession();
    toast.success("Logged out");
    navigate("/login", { replace: true });
  };

  const handleMarkRead = async (id) => {
    try {
      await notificationsApi.markRead(id);
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications", "unread-count"] });
    } catch (e) {
      toast.error(getApiErrorMessage(e, "Could not update notification"));
    }
  };

  const handleNotificationNavigate = (item) => {
    const path = getNotificationTargetPath(item?.raw);
    if (path) {
      setShowNotifications(false);
      navigate(path);
    }
  };

  return (
    <>
      <header className="flex h-14 min-h-14 w-full shrink-0 items-center justify-between gap-2 border-b border-gray-200 bg-white px-2.5 sm:gap-3 sm:px-6 dark:border-slate-700 dark:bg-slate-900">
        <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-4">
          {isMobile && (
            <button
              type="button"
              onClick={onToggleSidebar}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
              aria-label="Toggle sidebar"
            >
              <Menu size={20} strokeWidth={1.75} />
            </button>
          )}
          <div className="min-w-0 py-0.5">
            {pageTitle ? (
              <>
                <div className="jitox-page-title truncate">
                  {pageTitle}
                </div>
                {pageSubtitle && (
                  <div className="jitox-page-subtitle truncate">
                    {pageSubtitle}
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="truncate text-base font-semibold leading-tight tracking-tight text-gray-900 sm:text-[17px] dark:text-slate-100">
                  Hi, {userName}
                </div>
                <div className="mt-0.5 truncate text-xs leading-tight text-gray-500 dark:text-slate-400">
                  Here&apos;s your workspace
                </div>
              </>
            )}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <div
            className="flex h-9 max-h-9 min-w-9 max-w-[2.25rem] items-center justify-center gap-2 rounded-lg bg-primary px-0 text-white shadow-sm ring-1 ring-primary/20 sm:min-w-0 sm:max-w-[14rem] sm:justify-start sm:px-1.5"
            title={profileTitle}
          >
            <div
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/20 text-[11px] font-bold leading-none"
              aria-hidden
            >
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="hidden min-w-0 flex-1 flex-col justify-center gap-0 leading-none sm:flex">
              <span className="truncate text-[11px] font-semibold leading-3">
                {userName}
                {stored?.role ? (
                  <span className="font-normal opacity-90"> — {stored.role}</span>
                ) : null}
              </span>
              {displayEmail ? (
                <span className="truncate text-[10px] leading-3 opacity-90">{displayEmail}</span>
              ) : null}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-0.5 rounded-lg border border-slate-200/80 bg-slate-50/90 p-0.5 shadow-sm dark:border-slate-600 dark:bg-slate-800/80 sm:gap-1 sm:rounded-xl sm:p-1">
            <button
              type="button"
              onClick={() => setShowNotifications((v) => !v)}
              className="relative flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-white hover:text-primary hover:shadow-sm dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-primary"
              aria-label="Notifications"
              title="Notifications"
            >
              <Bell size={18} strokeWidth={1.75} />
              {unreadCount > 0 ? (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary px-0.5 text-[10px] font-bold text-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              ) : null}
            </button>
            <button
              type="button"
              onClick={toggleTheme}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-white hover:text-slate-800 hover:shadow-sm dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-amber-300"
              aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
              title={isDark ? "Light mode" : "Dark mode"}
            >
              {isDark ? (
                <Sun size={18} strokeWidth={1.75} />
              ) : (
                <Moon size={18} strokeWidth={1.75} />
              )}
            </button>
            <button
              type="button"
              onClick={handleLogout}
              title="Log out"
              aria-label="Log out"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-red-50 hover:text-red-600 hover:shadow-sm dark:hover:bg-red-950/40 dark:hover:text-red-400"
            >
              <LogOut size={18} strokeWidth={1.75} />
            </button>
          </div>
        </div>
      </header>

      <NotificationModal
        open={showNotifications}
        onClose={() => setShowNotifications(false)}
        notifications={notificationsForModal}
        onViewAll={() => {
          setShowNotifications(false);
          navigate("/dashboard/tasks/notifications");
        }}
        onMarkRead={handleMarkRead}
        onNavigateToTarget={handleNotificationNavigate}
      />
    </>
  );
};

export default Header;
