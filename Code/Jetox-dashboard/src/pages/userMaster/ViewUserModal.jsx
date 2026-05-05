import React from "react";
import { CommonModal, Button } from "../../components/ui/CommanUI";
import { AddressDisplay } from "../../components/address/AddressDisplay";
import { addressFromUser } from "../../utils/addressFormat";
import dayjs from "dayjs";

function Row({ label, children }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-gray-100 py-3 last:border-b-0 sm:flex-row sm:items-baseline sm:gap-6 sm:py-2.5 dark:border-slate-800/80">
      <span className="w-36 shrink-0 text-xs font-semibold uppercase tracking-wide text-light">
        {label}
      </span>
      <span className="min-w-0 flex-1 text-sm font-medium leading-snug text-dark dark:text-slate-100">
        {children != null && String(children).trim() !== "" ? children : "—"}
      </span>
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <h4 className="mb-0 border-b border-light-border pb-2 text-[11px] font-bold uppercase tracking-wider text-light dark:border-slate-700">
      {children}
    </h4>
  );
}

/**
 * Read-only user overview — dashboard panel styling + footer Close.
 */
const ViewUserModal = ({ open, onClose, user, permissionSummary }) => {
  if (!user) return null;

  const displayName = user["User Name"] || user.name || "—";
  const role = user.Role || user.role || "—";
  const email = user.Email || user.email;
  const phone = user["Phone No"] || user.mobile;
  const joiningRaw = user["Joining Date"];
  const joining =
    joiningRaw && dayjs(joiningRaw).isValid()
      ? dayjs(joiningRaw).format("DD MMM YYYY")
      : "—";
  const isActive = user.isActive !== false;

  const accessText =
    permissionSummary ||
    (user.Role === "Admin" || user.role === "Admin"
      ? "Full access (all modules)"
      : "—");

  return (
    <CommonModal
      open={open}
      onClose={onClose}
      title="User overview"
      width="min(560px, 94vw)"
      footerClassName="!px-5 sm:!px-6"
      footer={[
        <Button key="close" label="Close" variant="outline" onClick={onClose} />,
      ]}
    >
      <div className="overflow-hidden rounded-xl jitox-panel jitox-panel--shadow">
        <div className="flex flex-wrap items-center gap-4 border-b border-light-border bg-headBg px-4 py-4 sm:px-5 sm:py-5 dark:border-slate-700 dark:bg-slate-800/60">
          <div className="flex min-w-0 flex-1 items-center gap-4">
            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-light-border bg-white dark:border-slate-600 dark:bg-slate-900">
              {user.image ? (
                <img src={user.image} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xl font-bold text-light">
                  {String(displayName).charAt(0)}
                </div>
              )}
            </div>
            <div className="min-w-0 flex flex-col gap-0">
              <p className="truncate text-lg font-bold leading-snug text-dark">{displayName}</p>
              <p className="truncate text-sm leading-tight text-light">{role}</p>
            </div>
          </div>
          <span
            className={`rounded-lg px-2.5 py-1 text-xs font-bold ${
              isActive
                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/55 dark:text-emerald-300"
                : "bg-slate-200 text-slate-700 dark:bg-slate-600 dark:text-slate-100"
            }`}
          >
            {isActive ? "Active" : "Inactive"}
          </span>
        </div>

        <div className="space-y-6 px-4 py-5 sm:px-6">
          <section className="space-y-0">
            <SectionTitle>Contact</SectionTitle>
            <div className="pt-1">
              <Row label="Phone">{phone}</Row>
              <Row label="Email">
                <span className="break-all">{email}</span>
              </Row>
              <Row label="Joined">{joining}</Row>
            </div>
          </section>

          <section className="space-y-0">
            <SectionTitle>Location</SectionTitle>
            <div className="pt-1">
              <Row label="Region">{user.Region || user.regine}</Row>
              <Row label="Area">{user.Area || user.assignedAreas}</Row>
            </div>
            <div className="mt-3 rounded-lg border border-dashed border-light-border bg-gray-50/90 px-3 py-3 dark:border-slate-600 dark:bg-slate-800/40">
              <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-light">
                Full address
              </span>
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
          </section>

          <section className="space-y-0">
            <SectionTitle>Module access</SectionTitle>
            <p className="pt-3 text-sm leading-relaxed text-dark dark:text-slate-200">{accessText}</p>
          </section>
        </div>
      </div>
    </CommonModal>
  );
};

export default ViewUserModal;
