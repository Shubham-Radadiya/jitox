import React, { useMemo, useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import nodataImg from "../../assets/nodata.png";
import DashboardLayout from "../../layouts/DashboardLayout";
import DataTable from "../../components/ui/table/DataTable";
import { Button } from "../../components/ui/CommanUI";
import { Calendar, Plus, Search, User, MapPin, X } from "lucide-react";
import { IoEyeOutline, IoTrashOutline } from "react-icons/io5";
import { TbEdit } from "react-icons/tb";
import { HiOutlineDotsVertical } from "react-icons/hi";
import AddUserModal from "./AddUserModal";
import UserAddedSuccessModal from "./UserAddedSuccessModal";
import ViewUserModal from "./ViewUserModal";
import EditUserModal from "./EditUserModal";
import UserUpdatedSuccessModal from "./UserUpdatedSuccessModal";
import CommonDeleteModal from "../../components/ui/modals/CommonDeleteModal";
import CommonDeleteSuccessModal from "../../components/ui/modals/CommonDeleteSuccessModal";
import { userService } from "../../services/user.services";
import { getStoredUser, canAccessModule } from "../../utils/authSession";
import { MODULE_ACCESS_OPTIONS } from "../../constants/accessModules";
import { AddressTableCell } from "../../components/address/AddressDisplay";
import { TABLE_ACTION_ICON_BTN, tableTdClasses } from "../../utils/tableUi";
import { mergePageAddButton } from "../../utils/pageAddButton";
import { mapApiUserToRow } from "./mapUserRow";

function pickFormField(payload, key) {
  if (payload instanceof FormData) {
    const v = payload.get(key);
    return v != null && v !== "" ? String(v) : "";
  }
  return payload[key] != null ? String(payload[key]) : "";
}

function pickPayloadPermissions(payload) {
  if (payload instanceof FormData) {
    const raw = payload.get("permissions");
    if (raw == null || raw === "") return [];
    try {
      const v = JSON.parse(String(raw));
      return Array.isArray(v) ? v : [];
    } catch {
      return [];
    }
  }
  return payload.permissions;
}

const UserMasterIndex = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleteSuccessOpen, setIsDeleteSuccessOpen] = useState(false);
  const [isEditSuccessOpen, setIsEditSuccessOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [lastAddedUser, setLastAddedUser] = useState(null);
  const [lastEditSummary, setLastEditSummary] = useState(null);
  const [searchUser, setSearchUser] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [regionFilter, setRegionFilter] = useState("");
  const navigate = useNavigate();

  const baseColumns = [
    "Employee ID",
    "User Name",
    "Email",
    "Phone No",
    "Role",
    "Total Users",
    "Region",
    "Area",
    "Address",
    "Joining Date",
  ];
  const [visibleColumnKeys, setVisibleColumnKeys] = useState([
    "Employee ID",
    "User Name",
    "Email",
    "Phone No",
    "Role",
    "Total Users",
  ]);
  const [isColumnPickerOpen, setIsColumnPickerOpen] = useState(false);
  const [columnPickerPos, setColumnPickerPos] = useState({ top: 0, left: 8 });
  const columnBtnRef = useRef(null);

  const computeColumnPickerPosition = useCallback((rect) => {
    const vw = window.innerWidth;
    const popupWidth = Math.min(240, Math.max(208, vw - 16));
    const left = Math.max(8, Math.min(rect.right - popupWidth, vw - popupWidth - 8));
    return {
      top: rect.bottom + 8,
      left,
    };
  }, []);

  const toggleColumnPicker = (event) => {
    event.stopPropagation();
    const rect = event.currentTarget.getBoundingClientRect();
    setColumnPickerPos(computeColumnPickerPosition(rect));
    setIsColumnPickerOpen((prev) => !prev);
  };

  useEffect(() => {
    if (!isColumnPickerOpen) return undefined;
    const updatePosition = () => {
      const rect = columnBtnRef.current?.getBoundingClientRect?.();
      if (!rect) return;
      setColumnPickerPos(computeColumnPickerPosition(rect));
    };
    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    window.visualViewport?.addEventListener?.("resize", updatePosition);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
      window.visualViewport?.removeEventListener?.("resize", updatePosition);
    };
  }, [isColumnPickerOpen, computeColumnPickerPosition]);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await userService.getAll();
      const list = (data.users || []).map(mapApiUserToRow);
      setUsers(list);
      return list;
    } catch (e) {
      const msg =
        e?.response?.data?.message || e?.message || "Failed to load users";
      toast.error(msg);
      setUsers([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const u = getStoredUser();
    if (!u || !canAccessModule(u, "users")) {
      toast.error("You do not have access to User Master.");
      navigate("/dashboard", { replace: true });
      return;
    }
    loadUsers();
  }, [loadUsers, navigate]);

  const handleCreated = async (payload) => {
    const { data } = await userService.create(payload);
    const created = data.user;
    setLastAddedUser({
      name: created.name || "—",
      role: created.role,
      region: created.region || created.city || "—",
      assignedAreas: created.district || "—",
    });
    await loadUsers();
    setIsSuccessModalOpen(true);
  };

  const handleUpdate = async (userId, payload) => {
    await userService.update(userId, payload);
    const previous = selectedUser || {};
    const refreshed = await loadUsers();
    const updated =
      refreshed.find((u) => String(u._id) === String(userId)) || previous;

    const normalized = (v) => String(v ?? "").trim();
    const pretty = (v) => (normalized(v) ? normalized(v) : "—");
    const changes = [];

    const prevRegion = previous.Region || "—";
    const nextRegion =
      updated.Region ||
      pickFormField(payload, "region") ||
      pickFormField(payload, "city") ||
      "—";
    if (normalized(prevRegion) !== normalized(nextRegion)) {
      changes.push({
        label: "Region",
        from: pretty(prevRegion),
        to: pretty(nextRegion),
      });
    }

    const prevArea = previous.Area || "—";
    const nextArea =
      updated.Area || pickFormField(payload, "district") || "—";
    if (normalized(prevArea) !== normalized(nextArea)) {
      changes.push({
        label: "Area",
        from: pretty(prevArea),
        to: pretty(nextArea),
      });
    }

    const prevRole = previous.Role || previous.role || "User";
    const nextRole =
      updated.Role || pickFormField(payload, "role") || "User";
    if (normalized(prevRole) !== normalized(nextRole)) {
      changes.push({
        label: "Role",
        from: pretty(prevRole),
        to: pretty(nextRole),
      });
    }

    const prevModules = permLabels(
      previous.permissions,
      previous.Role || previous.role
    );
    const nextModules = permLabels(
      pickPayloadPermissions(payload),
      pickFormField(payload, "role") || updated.Role || updated.role
    );
    if (normalized(prevModules) !== normalized(nextModules)) {
      changes.push({
        label: "Assign Module",
        from: pretty(prevModules),
        to: pretty(nextModules),
      });
    }

    setSelectedUser(updated);
    setLastEditSummary({
      name:
        updated["User Name"] ||
        previous["User Name"] ||
        pickFormField(payload, "firstName") ||
        "User",
      changes,
    });
    setIsEditSuccessOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedUser?._id) return;
    try {
      await userService.delete(selectedUser._id);
      setIsDeleteModalOpen(false);
      setIsDeleteSuccessOpen(true);
      await loadUsers();
    } catch (e) {
      toast.error(
        e?.response?.data?.message || e?.message || "Delete failed"
      );
    }
  };

  const toggleColumn = (col) => {
    setVisibleColumnKeys((prev) =>
      prev.includes(col) ? prev.filter((c) => c !== col) : [...prev, col]
    );
  };

  const columns = useMemo(() => {
    const list = visibleColumnKeys.slice();
    list.push({
      label: (
        <div className="relative inline-block">
          <button
            type="button"
            ref={columnBtnRef}
            onClick={toggleColumnPicker}
            className="w-6 h-6 flex items-center justify-center rounded border border-gray-300 hover:bg-gray-50 transition-colors"
          >
            <Plus size={14} className="text-primary" />
          </button>
        </div>
      ),
      key: "Actions",
    });
    return list;
  }, [visibleColumnKeys, toggleColumnPicker]);

  const roleOptions = useMemo(() => {
    const seen = new Set();
    users.forEach((u) => {
      const v = String(u.Role ?? "").trim();
      if (v) seen.add(v);
    });
    return [...seen].sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: "base" })
    );
  }, [users]);

  const regionOptions = useMemo(() => {
    const seen = new Set();
    users.forEach((u) => {
      const v = String(u.Region ?? "").trim();
      if (v && v !== "-") seen.add(v);
    });
    return [...seen].sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: "base" })
    );
  }, [users]);

  const filteredUsers = useMemo(() => {
    let list = users;
    const q = searchUser.trim().toLowerCase();
    if (q) {
      list = list.filter((u) =>
        String(u["User Name"] ?? "")
          .toLowerCase()
          .includes(q)
      );
    }
    if (roleFilter) {
      list = list.filter((u) => String(u.Role ?? "") === roleFilter);
    }
    if (regionFilter) {
      list = list.filter((u) => String(u.Region ?? "") === regionFilter);
    }
    return list;
  }, [users, searchUser, roleFilter, regionFilter]);

  const renderRowCell = (key, value, row) => {
    if (key === "Employee ID") {
      return (
        <td
          key={key}
          className={`${tableTdClasses("Employee ID")} overflow-visible`}
        >
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <div className="relative z-1 h-8 w-8 shrink-0 overflow-visible">
              <div className="h-full w-full overflow-hidden rounded-full border border-gray-100 bg-gray-200 dark:border-slate-600 dark:bg-slate-700">
                {row.image ? (
                  <img
                    src={row.image}
                    alt={`Profile photo — ${row["User Name"] || "team member"}`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-[10px] font-bold text-gray-400 dark:text-slate-400">
                    {row["User Name"]?.charAt(0) || "U"}
                  </div>
                )}
              </div>
              <span
                className="pointer-events-none absolute -bottom-px -right-px z-2 box-border size-2.5 rounded-full border-2 border-white bg-primary shadow-sm ring-1 ring-primary/15 dark:border-slate-900 dark:ring-primary/25"
                aria-hidden
                title="Active"
              />
            </div>
            <span className="text-light">{value}</span>
          </div>
        </td>
      );
    }
    if (key === "Role") {
      return (
        <td key={key} className={`${tableTdClasses("Role")} text-light`}>
          <span>{value}</span>
        </td>
      );
    }
    if (key === "Address") {
      return (
        <td key={key} className={tableTdClasses("Address")}>
          <AddressTableCell
            value={{
              streetAddress: row.streetAddress,
              area: row.area,
              city: row.city,
              taluka: row.taluka,
              district: row.district,
              state: row.state,
              country: row.country,
              pincode: row.pincode,
            }}
          />
        </td>
      );
    }
    return (
      <td key={key} className={`${tableTdClasses(key)} text-light`}>
        {value ?? "-"}
      </td>
    );
  };

  /** Fixed menu in a portal so it is not clipped by the DataTable overflow stack. */
  const [userActionsMenu, setUserActionsMenu] = useState(null);
  const userActionsMenuRef = useRef(null);
  const userActionsMenuTriggerRef = useRef(null);

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

  const renderAction = (row, rowIndex) => (
    <td className={`${tableTdClasses("Actions")} relative`}>
      <div className="flex items-center justify-center gap-1.5">
        <button
          type="button"
          title="View user"
          className={TABLE_ACTION_ICON_BTN}
          onClick={(e) => {
            e.stopPropagation();
            setSelectedUser(row);
            setIsViewModalOpen(true);
          }}
        >
          <IoEyeOutline size={18} />
        </button>
        <button
          type="button"
          title="Edit user"
          className={TABLE_ACTION_ICON_BTN}
          onClick={(e) => {
            e.stopPropagation();
            setSelectedUser(row);
            setIsEditModalOpen(true);
          }}
        >
          <TbEdit size={18} />
        </button>
        <button
          type="button"
          title="Delete user"
          className={`${TABLE_ACTION_ICON_BTN} hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-300`}
          onClick={(e) => {
            e.stopPropagation();
            setSelectedUser(row);
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

  const permLabels = (keys, role) => {
    if (role === "Admin") return "Full access (all modules)";
    if (!keys?.length) return "Dashboard only (default)";
    return keys
      .map(
        (k) => MODULE_ACCESS_OPTIONS.find((m) => m.key === k)?.label || k
      )
      .join(", ");
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[50vh] text-light dark:text-slate-400">
          Loading users…
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="relative flex min-h-0 w-full min-w-0 flex-col gap-2 sm:gap-3">
        {users.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="rounded-2xl jitox-panel jitox-panel--shadow p-6 flex flex-col items-center max-w-sm w-full">
              <div className="text-lg font-bold text-dark mb-6">
                No Users Added Yet
              </div>
              <div className="mb-8 overflow-hidden rounded-xl">
                <img
                  src={nodataImg}
                  alt="No users yet — illustration"
                  className="w-full h-32 object-contain"
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <p className="text-sm text-gray-500 text-center mb-10 leading-relaxed dark:text-slate-400">
                Start by adding your first Users to assign regions, areas, and
                dealer responsibilities.
              </p>
              <Button
                label="Add users"
                {...mergePageAddButton({ className: "w-full max-w-xs" })}
                onClick={() => setIsAddModalOpen(true)}
              />
            </div>
          </div>
        ) : (
          <>
            <div className="flex min-w-0 flex-nowrap items-center justify-between gap-2 sm:gap-3">
              <h1 className="min-w-0 flex-1 truncate whitespace-nowrap text-sm font-semibold tracking-tight text-dark sm:text-lg sm:font-bold">
                Total Users ({users.length})
              </h1>
              <div className="jitox-header-pill shrink-0 gap-1.5 whitespace-nowrap px-2 py-1 text-[11px] leading-none sm:gap-2 sm:px-3 sm:py-1.5 sm:text-sm sm:leading-normal">
                <span className="shrink-0">20 Jan, 2:30 PM</span>
                <Calendar className="h-3.5 w-3.5 shrink-0 opacity-80 sm:h-4 sm:w-4" aria-hidden />
              </div>
            </div>

            <div className="flex min-w-0 flex-col gap-2 rounded-xl jitox-panel jitox-panel--shadow p-3 sm:p-4">
              <div className="flex min-w-0 flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <h2 className="min-w-0 shrink-0 truncate text-sm font-semibold text-dark sm:text-base">
                  User List
                </h2>
                <div className="grid w-full min-w-0 grid-cols-1 gap-2 sm:grid-cols-2 md:flex md:w-auto md:flex-1 md:flex-wrap md:items-center md:justify-end">
                  <div className="relative min-w-0 sm:col-span-2 md:w-44 md:min-w-0">
                    <Search
                      size={14}
                      className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      type="search"
                      placeholder="Search User"
                      value={searchUser}
                      onChange={(e) => setSearchUser(e.target.value)}
                      className="h-9 w-full rounded-lg border border-light-border bg-white pl-7 pr-2 text-[13px] text-dark dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                    />
                  </div>

                  <div className="relative min-w-0 sm:w-full md:w-36">
                    <User
                      size={14}
                      className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <select
                      value={roleFilter}
                      onChange={(e) => setRoleFilter(e.target.value)}
                      className="h-9 w-full rounded-lg border border-light-border bg-white pl-7 pr-2 text-[13px] text-dark dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                    >
                      <option value="">Role</option>
                      {roleOptions.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="relative min-w-0 sm:w-full md:w-36">
                    <MapPin
                      size={14}
                      className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <select
                      value={regionFilter}
                      onChange={(e) => setRegionFilter(e.target.value)}
                      className="h-9 w-full rounded-lg border border-light-border bg-white pl-7 pr-2 text-sm text-dark dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                    >
                      <option value="">Region</option>
                      {regionOptions.map((region) => (
                        <option key={region} value={region}>
                          {region}
                        </option>
                      ))}
                    </select>
                  </div>

                  <Button
                    type="button"
                    label="Add users"
                    {...mergePageAddButton({
                      size: "sm",
                      className:
                        "w-full sm:w-full md:w-auto min-h-9! shrink-0 px-3! py-1.5! text-xs! gap-1 sm:min-h-10! sm:px-4! sm:text-sm!",
                    })}
                    onClick={() => setIsAddModalOpen(true)}
                  />
                </div>
              </div>

              <div className="min-w-0">
                <DataTable
                  columns={columns}
                  data={filteredUsers}
                  renderRowCell={renderRowCell}
                  renderAction={renderAction}
                  tableClassName="text-center [&_th]:px-1.5 [&_th]:py-1 [&_td]:px-1.5 [&_td]:py-1.5"
                  maxHeight="min(72vh, calc(100dvh - 14rem))"
                  className="shadow-none! sm:shadow-sm!"
                />
              </div>

              <div className="flex min-w-0 flex-col items-center gap-2 border-t border-slate-100 px-1 pt-2 text-center sm:flex-row sm:items-center sm:justify-between sm:px-2 sm:text-left dark:border-slate-700/80">
                <div className="text-xs text-light">
                  Showing {filteredUsers.length ? 1 : 0} - {filteredUsers.length} of {filteredUsers.length} results
                </div>
                <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-end">
                  <span className="text-xs text-light">Results per page:</span>
                  <div className="rounded border border-gray-200 px-2 py-1 text-xs dark:border-slate-600 dark:text-slate-300">
                    10
                  </div>
                </div>
              </div>
            </div>
          </>
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
                    const tabSlug = item.toLowerCase().replace(/\s+/g, "-");
                    navigate(
                      `/dashboard/user-master/summary/${userActionsMenu.row._id}/${tabSlug}`
                    );
                  }}
                >
                  {item}
                </button>
              ))}
            </div>,
            document.body
          )}

        {isColumnPickerOpen && (
          <div
            className="fixed z-50 w-[min(15rem,calc(100vw-1rem))] overflow-hidden rounded-lg border border-light-border bg-white shadow-xl dark:border-slate-600 dark:bg-slate-900"
            style={{
              top: columnPickerPos.top,
              left: columnPickerPos.left,
            }}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-light-border bg-gray-50 dark:bg-slate-800/80 dark:border-slate-600">
              <span className="text-sm font-semibold text-dark dark:text-slate-100">Add Column</span>
              <X
                size={18}
                className="text-gray-400 cursor-pointer"
                onClick={() => setIsColumnPickerOpen(false)}
              />
            </div>
            <div className="max-h-64 overflow-y-auto p-2">
              {baseColumns.map((col) => (
                <label
                  key={col}
                  className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded cursor-pointer dark:hover:bg-slate-800"
                >
                  <input
                    type="checkbox"
                    className="accent-primary w-4 h-4"
                    checked={visibleColumnKeys.includes(col)}
                    onChange={() => toggleColumn(col)}
                  />
                  <span className="text-sm text-gray-600 dark:text-white">{col}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        <AddUserModal
          open={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onCreated={handleCreated}
        />

        <UserAddedSuccessModal
          open={isSuccessModalOpen}
          onClose={() => setIsSuccessModalOpen(false)}
          userData={lastAddedUser}
          onAddAnother={() => setIsAddModalOpen(true)}
        />

        <ViewUserModal
          open={isViewModalOpen}
          onClose={() => setIsViewModalOpen(false)}
          user={selectedUser}
          permissionSummary={
            selectedUser
              ? permLabels(selectedUser.permissions, selectedUser.Role)
              : ""
          }
        />

        <EditUserModal
          open={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          user={selectedUser}
          onSave={handleUpdate}
        />

        <UserUpdatedSuccessModal
          open={isEditSuccessOpen}
          onClose={() => setIsEditSuccessOpen(false)}
          summary={lastEditSummary}
          onViewProfile={() => {
            setIsEditSuccessOpen(false);
            if (selectedUser) setIsViewModalOpen(true);
          }}
          onEditAgain={() => {
            setIsEditSuccessOpen(false);
            if (selectedUser) setIsEditModalOpen(true);
          }}
        />

        <CommonDeleteModal
          open={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          itemName={selectedUser?.["User Name"] || selectedUser?.name}
          title="Delete user?"
          message={`Remove ${selectedUser?.Role || "user"} from the system?`}
          compact
          onDelete={handleDelete}
        />

        <CommonDeleteSuccessModal
          open={isDeleteSuccessOpen}
          onClose={() => setIsDeleteSuccessOpen(false)}
        />
      </div>
    </DashboardLayout>
  );
};

export default UserMasterIndex;
