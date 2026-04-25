import React from "react";
import { CommonModal } from "../../components/ui/CommanUI";
import { AddressDisplay } from "../../components/address/AddressDisplay";
import { addressFromUser } from "../../utils/addressFormat";
import dayjs from "dayjs";

/**
 * ViewUserModal Component
 * Read-only modal for viewing user details.
 */
const ViewUserModal = ({ open, onClose, user, permissionSummary }) => {
  if (!user) return null;

  const InfoRow = ({ label, value }) => (
    <div className="flex justify-between items-start py-2 border-b border-gray-50 last:border-none">
      <span className="text-sm text-gray-500 font-medium">{label}:</span>
      <span className="text-sm text-dark font-semibold text-right max-w-[60%]">
        {value || "-"}
      </span>
    </div>
  );

  return (
    <CommonModal
      open={open}
      onClose={onClose}
      title="View User Details"
      width="1000px"
    >
      <div className="flex flex-col gap-4 px-2">
        {/* Header Profile Section */}
        <div className="flex items-center justify-between pb-6 border-b border-light-border">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-primary/20 shadow-sm">
              {user.image ? (
                <img src={user.image} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gray-100 flex items-center justify-center text-2xl font-bold text-gray-400">
                  {user["User Name"]?.charAt(0) || "U"}
                </div>
              )}
            </div>
            <div className="flex flex-col">
              <h2 className="text-lg font-bold text-dark">{user["User Name"] || user.name}</h2>
              <p className="text-sm text-gray-500 font-medium">{user.Role || user.role}</p>
            </div>
          </div>
          <span className="bg-[#E6FFFA] text-[#2C8C7E] px-4 py-1.5 rounded-lg text-sm font-semibold">
            Active
          </span>
        </div>

        {/* Basic Information */}
        <div>
          <h3 className="text-base font-bold text-dark mb-3">Basic Information</h3>
          <div className="flex flex-col gap-1">
            <InfoRow label="Mobile Number" value={user["Phone No"] || user.mobile} />
            <InfoRow label="Email Id" value={user.Email || user.email} />
            <InfoRow label="Joining Date" value={user["Joining Date"] ? dayjs(user["Joining Date"]).format("ddd DD MMM, YYYY") : "Mon 15 Jan, 2025"} />
          </div>
        </div>

        {/* Assign Location */}
        <div>
          <h3 className="text-base font-bold text-dark mb-3">Location & address</h3>
          <div className="flex flex-col gap-1">
            <InfoRow label="Region" value={user.Region || user.regine || "—"} />
            <InfoRow label="Area" value={user.Area || user.assignedAreas || "—"} />
          </div>
          <div className="mt-3 rounded-lg border border-gray-100 bg-gray-50/80 p-3">
            <div className="text-xs font-medium text-gray-500 mb-1">Full address</div>
            <AddressDisplay
              value={addressFromUser({
                streetAddress: user.streetAddress,
                area: user.area,
                city: user.city || user.Region,
                taluka: user.taluka,
                district: user.district || user.Area,
                state: user.state,
                country: user.country,
                pincode: user.pincode,
                address: user.address,
              })}
            />
          </div>
        </div>

        <div className="pb-4">
          <h3 className="text-base font-bold text-dark mb-3">Module access</h3>
          <InfoRow
            label="Allowed modules"
            value={
              permissionSummary ||
              (user.Role === "Admin" || user.role === "Admin"
                ? "Full access"
                : "—")
            }
          />
        </div>
      </div>
    </CommonModal>
  );
};

export default ViewUserModal;
