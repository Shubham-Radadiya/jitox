import React, { useMemo, useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import nodataImg from "../../assets/nodata.png";
import DashboardLayout from "../../layouts/DashboardLayout";
import DataTable from "../../components/ui/table/DataTable";
import { Button } from "../../components/ui/CommanUI";
import { Calendar, Plus, X } from "lucide-react";
import { IoEyeOutline, IoTrashOutline } from "react-icons/io5";
import { TbEdit } from "react-icons/tb";
import { HiOutlineDotsVertical } from "react-icons/hi";
import AddUserModal from "./AddUserModal";
import UserAddedSuccessModal from "./UserAddedSuccessModal";
import ViewUserModal from "./ViewUserModal";
import EditUserModal from "./EditUserModal";
import CommonDeleteModal from "../../components/ui/modals/CommonDeleteModal";
import CommonDeleteSuccessModal from "../../components/ui/modals/CommonDeleteSuccessModal";
import { userService } from "../../services/user.services";
import { getStoredUser, canAccessModule } from "../../utils/authSession";
import { MODULE_ACCESS_OPTIONS } from "../../constants/accessModules";
import { AddressTableCell } from "../../components/address/AddressDisplay";
import { addressFromUser, buildTableSummary } from "../../utils/addressFormat";
import { TABLE_ACTION_ICON_BTN, tableTdClasses } from "../../utils/tableUi";
import { mergePageAddButton } from "../../utils/pageAddButton";

function mapApiUserToRow(u) {
  const id = u._id || u.id;
  const idStr = id ? String(id) : "";
  const name =
    u.name ||
    [u.firstName, u.lastName].filter(Boolean).join(" ").trim() ||
    "-";
  const addr = addressFromUser(u);
  return {
    _id: idStr,
    id: idStr,
    "Employee ID": idStr ? idStr.slice(-8).toUpperCase() : "-",
    "User Name": name,
    Email: u.email,
    "Phone No": u.phone || "-",
    Role: u.role,
    "Total Users": "-",
    Region: u.city || "-",
    Area: u.district || u.taluka || "-",
    Address: u.addressSummary || buildTableSummary(addr),
    streetAddress: addr.streetAddress,
    area: addr.area,
    city: addr.city,
    taluka: addr.taluka,
    district: addr.district,
    state: addr.state,
    country: addr.country,
    pincode: addr.pincode,
    fullAddress: u.fullAddress,
    "Joining Date": u.createdAt
      ? new Date(u.createdAt).toISOString().slice(0, 10)
      : "-",
    isActive: true,
    image: null,
    permissions: u.permissions || [],
    roleLower: (u.role || "").toLowerCase(),
  };
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
  const [selectedUser, setSelectedUser] = useState(null);
  const [lastAddedUser, setLastAddedUser] = useState(null);
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
  const columnBtnRef = useRef(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await userService.getAll();
      const list = (data.users || []).map(mapApiUserToRow);
      setUsers(list);
    } catch (e) {
      const msg =
        e?.response?.data?.message || e?.message || "Failed to load users";
      toast.error(msg);
      setUsers([]);
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
      name: created.name || payload.firstName,
      role: created.role,
      region: payload.city || "—",
      assignedAreas: payload.district || "—",
    });
    await loadUsers();
    setIsSuccessModalOpen(true);
  };

  const handleUpdate = async (userId, payload) => {
    await userService.update(userId, payload);
    toast.success("User updated");
    await loadUsers();
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
            onClick={() => setIsColumnPickerOpen(!isColumnPickerOpen)}
            className="w-6 h-6 flex items-center justify-center rounded border border-gray-300 hover:bg-gray-50 transition-colors"
          >
            <Plus size={14} className="text-primary" />
          </button>
        </div>
      ),
      key: "Actions",
    });
    return list;
  }, [visibleColumnKeys, isColumnPickerOpen]);

  const renderRowCell = (key, value, row) => {
    if (key === "Employee ID") {
      return (
        <td key={key} className={tableTdClasses("Employee ID")}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden relative border border-gray-100">
              {row.image ? (
                <img
                  src={row.image}
                  alt={`Profile photo — ${row["User Name"] || "team member"}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-gray-400">
                  {row["User Name"]?.charAt(0) || "U"}
                </div>
              )}
              <div className="absolute right-0 bottom-0 w-2 h-2 rounded-full border border-white bg-primary" />
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
      <div className="flex flex-col gap-4 relative min-h-[80vh]">
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
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-bold text-dark">Total Users</h1>
                <span className="bg-blue/10 text-blue text-xs font-bold px-2 py-0.5 rounded-full">
                  {users.length}
                </span>
              </div>
              <div className="jitox-header-pill">
                <span>20 Jan, 2:30 PM</span>
                <Calendar size={16} />
              </div>
            </div>

            <div className="rounded-xl jitox-panel jitox-panel--shadow p-4 flex flex-col gap-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-semibold text-dark">User List</h2>
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    label="Add users"
                    {...mergePageAddButton()}
                    onClick={() => setIsAddModalOpen(true)}
                  />
                </div>
              </div>

              <DataTable
                columns={columns}
                data={users}
                renderRowCell={renderRowCell}
                renderAction={renderAction}
                tableClassName="text-center"
                maxHeight="calc(100vh - 21rem)"
              />

              <div className="flex items-center justify-between mt-4 px-2">
                <div className="text-xs text-light">
                  Showing 1 - {users.length} of {users.length} results
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-light">Results per page:</span>
                  <div className="px-2 py-1 border border-gray-200 rounded text-xs dark:border-slate-600 dark:text-slate-300">
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
              className="fixed z-200 w-40 rounded-xl border border-light-border bg-white py-2 shadow-xl dark:border-slate-600 dark:bg-slate-900"
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
                  className="block w-full px-4 py-2 text-right text-sm text-dark hover:bg-gray-50 cursor-pointer dark:hover:bg-slate-800"
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
            className="absolute z-50 bg-white border border-light-border rounded-lg shadow-xl w-60 overflow-hidden dark:bg-slate-900 dark:border-slate-600"
            style={{
              top: columnBtnRef.current?.offsetTop + 32,
              right: 16,
            }}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-light-border bg-gray-50 dark:bg-slate-800/80 dark:border-slate-600">
              <span className="text-sm font-semibold text-dark">Add Column</span>
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
                  <span className="text-sm text-gray-600">{col}</span>
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

        <CommonDeleteModal
          open={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          itemName={selectedUser?.["User Name"] || selectedUser?.name}
          title="Delete user?"
          message={`Remove ${selectedUser?.Role || "user"} from the system?`}
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
