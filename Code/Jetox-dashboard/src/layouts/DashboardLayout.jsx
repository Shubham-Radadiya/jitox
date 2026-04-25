import Header from "../components/global/Header";
import Sidebar from "../components/global/Sidebar";
import { useLocation } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";
import { getDashboardPageTitle } from "../constants/pageTitles";

function DashboardLayout({ children }) {
  const location = useLocation();
  const { title: pageTitle, subtitle: pageSubtitle } = useMemo(
    () => getDashboardPageTitle(location.pathname),
    [location.pathname]
  );
  const [isMobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const toggleMobileSidebar = () =>
    setMobileSidebarOpen((prev) => !prev);

  const closeMobileSidebar = () => setMobileSidebarOpen(false);

  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [location.pathname]);

  const isSalesInvoice =
    location.pathname.includes("sales-invoice") ||
    location.pathname.includes("employee-tracking");
  const isFullBleed =
    isSalesInvoice ||
    location.pathname.includes("/dashboard/documents");

  return (
    <div className="min-h-screen min-h-[100dvh] lg:h-[100dvh] lg:max-h-[100dvh] flex flex-col lg:flex-row bg-gray-50 relative overflow-hidden dark:bg-slate-950">
      <div className="hidden lg:flex lg:flex-col lg:shrink-0 lg:h-full lg:max-h-[100dvh] lg:min-h-0">
        <Sidebar />
      </div>

      <div className="flex-1 flex flex-col min-h-0 min-w-0 lg:max-h-[100dvh]">
        <div className="shrink-0 block lg:hidden">
          <Header
            isMobile
            onToggleSidebar={toggleMobileSidebar}
            pageTitle={pageTitle}
            pageSubtitle={pageSubtitle}
          />
        </div>

        <div className="shrink-0 hidden lg:block">
          <Header pageTitle={pageTitle} pageSubtitle={pageSubtitle} />
        </div>

        {/* One vertical scroll for page content — avoids nested scrollbars */}
        <main className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-contain">
          <div
            className={
              isFullBleed
                ? "min-h-full"
                : "min-h-full px-4 py-3 sm:px-5 sm:py-3 lg:px-6"
            }
          >
            {isFullBleed ? (
              children
            ) : (
              <div className="mx-auto w-full min-w-0 max-w-[1280px]">{children}</div>
            )}
          </div>
        </main>
      </div>

      {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-40 flex lg:hidden">
          <button
            type="button"
            className="flex-1 bg-black/40"
            aria-label="Close sidebar"
            onClick={closeMobileSidebar}
          />
          <div className="flex h-full max-h-[100dvh] w-[15rem] max-w-full flex-col overflow-hidden border-l border-gray-200 shadow-xl dark:border-slate-700">
            <Sidebar />
          </div>
        </div>
      )}
    </div>
  );
}

export default DashboardLayout;
