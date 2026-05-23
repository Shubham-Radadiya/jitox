import { useState } from "react";
import { X, Filter, Bell, ChevronRight } from "lucide-react";

export const NotificationModal = ({
  open,
  onClose,
  notifications = [],
  onViewAll,
  onMarkRead,
  /** Called after optional mark-read; should navigate and close modal */
  onNavigateToTarget,
}) => {
  const [activeTab, setActiveTab] = useState("All");

  if (!open) return null;

  const filteredNotifications =
    activeTab === "All"
      ? notifications
      : notifications.filter((n) => !n.read);

  return (
    <div className="fixed inset-0 z-[99] pointer-events-none">
      <button
        type="button"
        className="absolute inset-0 bg-black/20 pointer-events-auto border-0 p-0 cursor-default"
        onClick={onClose}
        aria-label="Close overlay"
      />

      <div className="absolute flex flex-col top-16 right-4 sm:right-6 w-[min(100vw-2rem,400px)] bg-white rounded-xl shadow-xl pointer-events-auto border border-light-border dark:bg-slate-900 dark:border-slate-700">
        <div className="flex justify-between items-center p-3">
          <div className="font-semibold text-gray-800 text-lg dark:text-slate-100">Notifications</div>
          <button type="button" onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800">
            <X size={18} className="text-gray-500 dark:text-slate-400" />
          </button>
        </div>
        <hr className="border-light-border" />

        <div className="flex items-center justify-between border-b pl-3 border-light-border">
          <div className="flex gap-4 pt-2 text-sm">
            <button
              type="button"
              onClick={() => setActiveTab("All")}
              className={`pb-2 font-medium transition ${
                activeTab === "All"
                  ? "text-primary border-b-2 border-primary"
                  : "text-gray-500 dark:text-slate-400"
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("Unread")}
              className={`pb-2 font-medium transition ${
                activeTab === "Unread"
                  ? "text-primary border-b-2 border-primary"
                  : "text-gray-500 dark:text-slate-400"
              }`}
            >
              Unread
            </button>
          </div>
          <span className="text-gray-400 px-3 pb-2 dark:text-slate-500">
            <Filter size={18} />
          </span>
        </div>

        <div className="text-xs flex justify-between items-center px-3 py-2">
          <div className="text-gray-500 font-medium dark:text-slate-400">Recent</div>
          {onViewAll ? (
            <button
              type="button"
              onClick={onViewAll}
              className="text-primary font-medium flex items-center gap-0.5 hover:underline"
            >
              View all <ChevronRight size={14} />
            </button>
          ) : null}
        </div>

        <div className="max-h-[320px] overflow-y-auto space-y-2 px-3 pb-3 scrollbar-hide">
          {filteredNotifications.length > 0 ? (
            filteredNotifications.map((item) => {
              const Icon = item.icon || Bell;
              return (
              <button
                type="button"
                key={item.id || item.title}
                onClick={() => {
                  if (!item.read && item.id && onMarkRead) onMarkRead(item.id);
                  if (onNavigateToTarget) onNavigateToTarget(item);
                }}
                className={`flex w-full text-left items-start gap-3 p-3 rounded-lg border transition ${
                  item.read
                    ? "bg-gray-50/80 border-light-border dark:bg-slate-800/80 dark:border-slate-600"
                    : "bg-sky-50/50 border-sky-100 hover:bg-sky-50 dark:bg-sky-950/40 dark:border-sky-900 dark:hover:bg-sky-950/60"
                }`}
              >
                <Icon size={20} className="text-primary shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-800 text-sm dark:text-slate-100">{item.title}</div>
                  <div className="text-xs text-gray-600 line-clamp-2 dark:text-slate-400">{item.subtitle}</div>
                </div>
                <div className="text-[10px] text-gray-400 whitespace-nowrap shrink-0 dark:text-slate-500">
                  {item.time}
                </div>
              </button>
            );
            })
          ) : (
            <div className="text-center text-gray-500 text-sm py-6 dark:text-slate-400">
              No {activeTab.toLowerCase()} notifications.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
