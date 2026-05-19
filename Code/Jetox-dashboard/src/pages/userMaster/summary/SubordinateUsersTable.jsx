import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import DataTable from "../../../components/ui/table/DataTable";
import { Search, MapPin } from "lucide-react";
import { IoEyeOutline, IoTrashOutline } from "react-icons/io5";
import { TbEdit } from "react-icons/tb";
import { HiOutlineDotsVertical } from "react-icons/hi";
import { userService } from "../../../services/user.services";
import { hrmApi } from "../../../services/api";
import { mapApiEmployeeToRow } from "../mapUserRow";
import { TABLE_ACTION_ICON_BTN, tableTdClasses } from "../../../utils/tableUi";
import CommonDeleteModal from "../../../components/ui/modals/CommonDeleteModal";
import CommonDeleteSuccessModal from "../../../components/ui/modals/CommonDeleteSuccessModal";

const COLUMNS = [
  "Employee ID",
  "User Name",
  "Email",
  "Phone No",
  "Region",
  "Actions",
];

const SUMMARY_TAB_BY_MENU = {
  "Visit Log": "visit-log",
  "Order Placed": "order-placed",
  Expenses: "expenses",
  Attendance: "attendance",
  Report: "report",
};

const SubordinateUsersTable = ({ parentUserId, onCountChange }) => {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchUser, setSearchUser] = useState("");
  const [regionFilter, setRegionFilter] = useState("");
  const [selectedRow, setSelectedRow] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleteSuccessOpen, setIsDeleteSuccessOpen] = useState(false);
  const [userActionsMenu, setUserActionsMenu] = useState(null);
  const userActionsMenuRef = useRef(null);
  const userActionsMenuTriggerRef = useRef(null);

  const loadLinkedEmployees = useCallback(async () => {
    if (!parentUserId) {
      setRows([]);
      onCountChange?.(0);
      setLoading(false);
      return [];
    }
    setLoading(true);
    try {
      const { data } = await userService.getSubordinates(parentUserId);
      const list = (data.users || data.employees || []).map(mapApiEmployeeToRow);
      setRows(list);
      onCountChange?.(list.length);
      return list;
    } catch (e) {
      const msg =
        e?.response?.data?.message ||
        e?.message ||
        "Failed to load linked employees";
      toast.error(msg);
      setRows([]);
      onCountChange?.(0);
      return [];
    } finally {
      setLoading(false);
    }
  }, [parentUserId, onCountChange]);

  useEffect(() => {
    loadLinkedEmployees();
  }, [loadLinkedEmployees]);

  useEffect(() => {
    const handlePointerDown = (event) => {
      const t = event.target;
      if (userActionsMenuRef.current?.contains(t)) return;
      if (userActionsMenuTriggerRef.current?.contains(t)) return;
      setUserActionsMenu(null);
    };
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  useEffect(() => {
    if (!userActionsMenu) {
      userActionsMenuTriggerRef.current = null;
      return undefined;
    }
    const closeOnScroll = () => setUserActionsMenu(null);
    window.addEventListener("scroll", closeOnScroll, true);
    return () => window.removeEventListener("scroll", closeOnScroll, true);
  }, [userActionsMenu]);

  const regionOptions = useMemo(() => {
    const seen = new Set();
    rows.forEach((u) => {
      const v = String(u.Region ?? "").trim();
      if (v && v !== "-") seen.add(v);
    });
    return [...seen].sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: "base" })
    );
  }, [rows]);

  const filteredRows = useMemo(() => {
    let list = rows;
    const q = searchUser.trim().toLowerCase();
    if (q) {
      list = list.filter((u) =>
        String(u["User Name"] ?? "")
          .toLowerCase()
          .includes(q)
      );
    }
    if (regionFilter) {
      list = list.filter((u) => String(u.Region ?? "") === regionFilter);
    }
    return list;
  }, [rows, searchUser, regionFilter]);

  const handleDelete = async () => {
    if (!selectedRow?._id) return;
    try {
      await hrmApi.deleteEmployee(selectedRow._id);
      setIsDeleteModalOpen(false);
      setIsDeleteSuccessOpen(true);
      await loadLinkedEmployees();
    } catch (e) {
      toast.error(e?.response?.data?.message || e?.message || "Delete failed");
    }
  };

  const renderRowCell = (key, value, row) => {
    if (key === "Employee ID") {
      return (
        <td
          key={key}
          className={`${tableTdClasses("Employee ID")} overflow-visible`}
        >
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <div className="relative z-1 h-8 w-8 shrink-0 overflow-visible">
              <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-full border border-gray-100 bg-gray-200 text-[10px] font-bold text-gray-400 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-400">
                {row["User Name"]?.charAt(0) || "E"}
              </div>
            </div>
            <span className="text-light">{value}</span>
          </div>
        </td>
      );
    }
    return (
      <td key={key} className={`${tableTdClasses(key)} text-light`}>
        {value ?? "-"}
      </td>
    );
  };

  const renderAction = (row, rowIndex) => (
    <td className={`${tableTdClasses("Actions")} relative`}>
      <div className="flex items-center justify-center gap-1.5">
        <button
          type="button"
          title="View employee"
          className={TABLE_ACTION_ICON_BTN}
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/dashboard/hrm/employees/${row._id}`);
          }}
        >
          <IoEyeOutline size={18} />
        </button>
        <button
          type="button"
          title="Edit employee"
          className={TABLE_ACTION_ICON_BTN}
          onClick={(e) => {
            e.stopPropagation();
            navigate(
              `/dashboard/hrm/employees?edit=${encodeURIComponent(row._id)}`
            );
          }}
        >
          <TbEdit size={18} />
        </button>
        <button
          type="button"
          title="Delete employee"
          className={`${TABLE_ACTION_ICON_BTN} hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-300`}
          onClick={(e) => {
            e.stopPropagation();
            setSelectedRow(row);
            setIsDeleteModalOpen(true);
          }}
        >
          <IoTrashOutline size={18} />
        </button>
        <div className="relative">
          <button
            type="button"
            title="More"
            className={TABLE_ACTION_ICON_BTN}
            onClick={(e) => {
              e.stopPropagation();
              const rect = e.currentTarget.getBoundingClientRect();
              userActionsMenuTriggerRef.current = e.currentTarget;
              setUserActionsMenu((prev) => {
                if (prev?.rowIndex === rowIndex) {
                  userActionsMenuTriggerRef.current = null;
                  return null;
                }
                return {
                  rowIndex,
                  row,
                  top: rect.bottom + 8,
                  right: window.innerWidth - rect.right,
                };
              });
            }}
          >
            <HiOutlineDotsVertical size={18} />
          </button>
        </div>
      </div>
    </td>
  );

  if (loading) {
    return (
      <div className="flex min-h-[12rem] items-center justify-center text-sm text-light dark:text-slate-400">
        Loading employees…
      </div>
    );
  }

  return (
    <div className="flex min-w-0 flex-col gap-2 rounded-xl jitox-panel jitox-panel--shadow p-3 sm:p-4">
      <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
        <div className="relative min-w-0 w-full sm:w-48">
          <Search
            size={14}
            className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="search"
            placeholder="Search User Name"
            value={searchUser}
            onChange={(e) => setSearchUser(e.target.value)}
            className="h-9 w-full rounded-lg border border-light-border bg-white pl-7 pr-2 text-[13px] text-dark dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
          />
        </div>
        <div className="relative min-w-0 w-full sm:w-36">
          <MapPin
            size={14}
            className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <select
            value={regionFilter}
            onChange={(e) => setRegionFilter(e.target.value)}
            className="h-9 w-full rounded-lg border border-light-border bg-white pl-7 pr-2 text-[13px] text-dark dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
          >
            <option value="">Department</option>
            {regionOptions.map((region) => (
              <option key={region} value={region}>
                {region}
              </option>
            ))}
          </select>
        </div>
      </div>

      {filteredRows.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
          No HRM employees linked to this user yet. Link employees in HRM →
          Employee Management using &quot;Linked app user&quot;.
        </p>
      ) : (
        <DataTable
          columns={COLUMNS}
          data={filteredRows}
          renderRowCell={renderRowCell}
          renderAction={renderAction}
          tableClassName="text-center [&_th]:px-1.5 [&_th]:py-1 [&_td]:px-1.5 [&_td]:py-1.5"
          maxHeight="min(72vh, calc(100dvh - 14rem))"
          className="shadow-none! sm:shadow-sm!"
        />
      )}

      {userActionsMenu &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={userActionsMenuRef}
            role="menu"
            className="fixed z-200 w-32 rounded-lg border border-light-border bg-white py-1.5 shadow-xl sm:w-40 sm:rounded-xl sm:py-2 dark:border-slate-600 dark:bg-slate-900"
            style={{
              top: userActionsMenu.top,
              right: userActionsMenu.right,
            }}
          >
            {[
              "Visit Log",
              "Order Placed",
              "Expenses",
              "Attendance",
              "Report",
            ].map((item) => (
              <button
                key={item}
                type="button"
                role="menuitem"
                className="block w-full cursor-pointer px-2.5 py-1.5 text-right text-xs text-dark hover:bg-gray-50 sm:px-4 sm:py-2 sm:text-sm dark:hover:bg-slate-800"
                onClick={() => {
                  setUserActionsMenu(null);
                  const tabSlug =
                    SUMMARY_TAB_BY_MENU[item] ||
                    item.toLowerCase().replace(/\s+/g, "-");
                  navigate(
                    `/dashboard/user-master/employee-summary/${userActionsMenu.row._id}/${tabSlug}`,
                    { state: { linkedUserId: parentUserId } }
                  );
                }}
              >
                {item}
              </button>
            ))}
          </div>,
          document.body
        )}

      <CommonDeleteModal
        open={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        itemName={selectedRow?.["User Name"]}
        title="Delete employee?"
        message="Remove this employee from HRM? Salary slips linked to them may also be affected."
        compact
        onDelete={handleDelete}
      />

      <CommonDeleteSuccessModal
        open={isDeleteSuccessOpen}
        onClose={() => setIsDeleteSuccessOpen(false)}
      />
    </div>
  );
};

export default SubordinateUsersTable;
