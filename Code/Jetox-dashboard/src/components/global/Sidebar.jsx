import React, { useMemo } from "react";
import {
  Home,
  Users,
  Package2,
  ClipboardList,
  Truck,
  UserCheck,
  Wallet,
  Wallet2,
  Boxes,
  UserCog,
  ClipboardCheck,
  FileText,
  Target,
  BarChart3,
  IdCard,
  ListChecks,
} from "lucide-react";
import Logo from "../../assets/logo.png";
import { NavLink, useLocation } from "react-router-dom";
import { NAV_ENTRIES } from "../../constants/accessModules";
import { getStoredUser, canAccessModule } from "../../utils/authSession";

const iconSize = 18;

const iconByKey = {
  dashboard: <Home size={iconSize} />,
  accounts: <Users size={iconSize} />,
  products: <Package2 size={iconSize} />,
  vouchers: <ClipboardList size={iconSize} />,
  daybook: <ClipboardList size={iconSize} />,
  orders: <Truck size={iconSize} />,
  employees: <UserCheck size={iconSize} />,
  hrm: <IdCard size={iconSize} />,
  receivable: <Wallet size={iconSize} />,
  payable: <Wallet2 size={iconSize} />,
  stock: <Boxes size={iconSize} />,
  users: <UserCog size={iconSize} />,
  schemes: <ClipboardCheck size={iconSize} />,
  documents: <FileText size={iconSize} />,
  "target-incentive": <Target size={iconSize} />,
  reports: <BarChart3 size={iconSize} />,
  tasks: <ListChecks size={iconSize} />,
};

function pathIsActive(pathname, itemPath) {
  const normalizedPathname = pathname.replace(/\/$/, "") || "/";
  const normalizedItemPath = itemPath.replace(/\/$/, "") || "/";
  if (normalizedItemPath === "/dashboard") {
    return normalizedPathname === "/dashboard";
  }
  if (normalizedItemPath === "/dashboard/accounting-voucher/purchase") {
    return normalizedPathname.startsWith("/dashboard/accounting-voucher");
  }
  if (normalizedItemPath === "/dashboard/tasks") {
    return (
      normalizedPathname === "/dashboard/tasks" ||
      normalizedPathname.startsWith("/dashboard/tasks/") ||
      normalizedPathname.startsWith("/dashboard/notifications")
    );
  }
  if (normalizedPathname === normalizedItemPath) return true;
  return normalizedPathname.startsWith(`${normalizedItemPath}/`);
}

/**
 * Fills nav column height: each link gets an equal flex share (no inner scrollbar).
 * Short viewports shrink rows evenly; tall screens get comfortable tap/hover height.
 */
const navListClass =
  "m-0 flex min-h-0 flex-1 list-none flex-col gap-px overflow-x-hidden overflow-y-hidden px-2.5 py-2";

const Sidebar = () => {
  const location = useLocation();
  const user = getStoredUser();
  const pathname = location.pathname;

  const visibleEntries = useMemo(() => {
    return NAV_ENTRIES.filter((entry) =>
      canAccessModule(user, entry.permissionKey)
    );
  }, [user]);

  return (
    <aside className="flex h-full min-h-0 max-h-[100dvh] w-[15rem] shrink-0 flex-col overflow-hidden border-r border-gray-200 bg-white lg:h-[100dvh] dark:border-slate-700 dark:bg-slate-900">
      <div className="flex h-14 min-h-14 shrink-0 items-center gap-2.5 border-b border-gray-200 bg-white px-3 dark:border-slate-700 dark:bg-slate-900">
        <img src={Logo} alt="Jitox logo" className="h-8 w-8 shrink-0" width={32} height={32} />
        <div className="text-base font-bold leading-tight tracking-tight text-emerald-600 dark:text-emerald-400">
          JETOX
        </div>
      </div>

      <nav
        className="flex min-h-0 flex-1 flex-col overflow-hidden bg-gray-50 dark:bg-slate-900/80"
        aria-label="Main navigation"
      >
        <ul className={navListClass}>
          {visibleEntries.map((entry, idx) => {
            if (entry.kind !== "link") return null;
            const isActive = pathIsActive(pathname, entry.path);
            return (
              <li
                key={`${entry.permissionKey}-link-${idx}`}
                className="flex min-h-0 flex-1 basis-0 max-h-[44px]"
              >
                <NavLink
                  to={entry.path}
                  className={`group flex min-h-0 w-full min-w-0 flex-1 cursor-pointer items-center gap-2.5 overflow-hidden rounded-lg px-3 text-sm leading-tight transition-colors ${
                    isActive
                      ? "bg-emerald-50 font-medium text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400"
                      : "border-transparent text-gray-600 hover:bg-gray-100 dark:text-slate-300 dark:hover:bg-slate-800"
                  }`}
                >
                  <span
                    className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center [&_svg]:shrink-0 ${
                      isActive
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-gray-500 group-hover:text-gray-700 dark:text-slate-400 dark:group-hover:text-slate-200"
                    }`}
                  >
                    {iconByKey[entry.permissionKey] || <Home size={iconSize} />}
                  </span>
                  <span className="min-w-0 truncate font-medium leading-tight">
                    {entry.name}
                  </span>
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;
