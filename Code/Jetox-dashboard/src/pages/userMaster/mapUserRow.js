import { addressFromUser, buildTableSummary } from "../../utils/addressFormat";
import { buildUploadUrl } from "../../utils/uploadUrl";

function idToString(ref) {
  if (!ref) return "";
  if (typeof ref === "string") return ref;
  if (typeof ref === "object") {
    const inner = ref._id ?? ref.id;
    if (inner) return String(inner);
  }
  return String(ref);
}

/** Map API user document to User Master table row shape. */
export function mapApiUserToRow(u) {
  const id = u._id || u.id;
  const idStr = id ? String(id) : "";
  const name =
    u.name ||
    [u.firstName, u.lastName].filter(Boolean).join(" ").trim() ||
    "-";
  const addr = addressFromUser(u);
  const accountStatus = String(u.accountStatus || "approved").toLowerCase();
  const statusLabel =
    accountStatus === "pending"
      ? "Pending approval"
      : accountStatus === "rejected"
        ? "Rejected"
        : "Approved";
  return {
    _id: idStr,
    id: idStr,
    "Employee ID": idStr ? idStr.slice(-8).toUpperCase() : "-",
    "User Name": name,
    Email: u.email,
    "Phone No": u.phone || "-",
    Role: u.role,
    "Total Users":
      u.subordinateCount != null && u.subordinateCount !== ""
        ? String(u.subordinateCount)
        : "0",
    subordinateCount:
      typeof u.subordinateCount === "number"
        ? u.subordinateCount
        : Number(u.subordinateCount) || 0,
    region: u.region || "",
    territoryId: idToString(u.territoryId),
    managerId: idToString(u.managerId),
    Region: u.region || u.city || "-",
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
    accountStatus,
    Status: statusLabel,
    isActive: accountStatus === "approved",
    isPendingApproval: accountStatus === "pending",
    image: u.profilePhoto ? buildUploadUrl(u.profilePhoto) : null,
    profilePhoto: u.profilePhoto,
    permissions: u.permissions || [],
    roleLower: (u.role || "").toLowerCase(),
  };
}

/** Map HRM employee (linked to a User Master account) to summary table row. */
export function mapApiEmployeeToRow(e) {
  const id = e._id || e.id;
  const idStr = id ? String(id) : "";
  return {
    _id: idStr,
    id: idStr,
    isHrmEmployee: true,
    "Employee ID": idStr ? idStr.slice(-8).toUpperCase() : "-",
    "User Name": e.name || "-",
    Email: e.email || "-",
    "Phone No": e.phone || "-",
    Region: e.department || e.region || "-",
    Role: e.roleDesignation || e.role || "-",
    Status: e.status || "Active",
    image: null,
  };
}
