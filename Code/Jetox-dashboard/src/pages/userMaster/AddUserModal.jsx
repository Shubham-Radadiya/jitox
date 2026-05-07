import React, { useState, useRef, useEffect } from "react";
import {
  CommonModal,
  InputField,
  CommonDropdown,
  Button,
} from "../../components/ui/CommanUI";
import { DatePicker } from "antd";
import { Camera } from "lucide-react";
import toast from "react-hot-toast";
import { MODULE_ACCESS_OPTIONS } from "../../constants/accessModules";
import AddressForm from "../../components/address/AddressForm";
import { EMPTY_ADDRESS } from "../../utils/addressFormat";

const ROLE_OPTIONS = [
  { label: "Admin", value: "admin" },
  { label: "Manager", value: "manager" },
  { label: "User", value: "user" },
];

const CARD =
  "rounded-xl border border-light-border bg-white p-3 shadow-sm sm:p-4 dark:border-slate-600 dark:bg-slate-900 dark:shadow-[0_2px_12px_rgba(0,0,0,0.35)]";
const CARD_TITLE = "text-sm font-semibold text-slate-900 dark:text-slate-100";

function mapRoleToApi(value) {
  const v = (value || "user").toLowerCase();
  if (v === "admin") return "Admin";
  if (v === "manager") return "Manager";
  return "User";
}

/**
 * Admin creates users with role + module access (API: POST /users/create-user).
 */
const AddUserModal = ({ open, onClose, onCreated }) => {
  const [form, setForm] = useState({
    name: "",
    mobile: "",
    email: "",
    role: "user",
    joiningDate: null,
    region: "",
    assignedAreas: "",
    password: "",
    confirmPassword: "",
    areaAccess: false,
    isActive: true,
  });

  const [selectedPerms, setSelectedPerms] = useState(() => new Set(["dashboard"]));
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);
  const [errors, setErrors] = useState({});
  const [addrErrors, setAddrErrors] = useState({});
  const [address, setAddress] = useState(() => ({ ...EMPTY_ADDRESS }));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm({
      name: "",
      mobile: "",
      email: "",
      role: "user",
      joiningDate: null,
      region: "",
      assignedAreas: "",
      password: "",
      confirmPassword: "",
      areaAccess: false,
      isActive: true,
    });
    setSelectedPerms(new Set(["dashboard"]));
    setImagePreview(null);
    setErrors({});
    setAddrErrors({});
    setAddress({ ...EMPTY_ADDRESS, city: "", state: "" });
  }, [open]);

  const apiRole = mapRoleToApi(form.role);
  const isAdminRole = apiRole === "Admin";

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const togglePerm = (key) => {
    setSelectedPerms((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        if (key === "dashboard" && next.size === 1) {
          toast.error("Keep at least Dashboard access.");
          return prev;
        }
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const validate = () => {
    const newErrors = {};
    const ae = {};
    if (!form.name.trim()) newErrors.name = "Name is required";
    if (!form.email.trim()) newErrors.email = "Email ID is required";
    if (!form.password) newErrors.password = "Password is required";
    if (form.password !== form.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }
    if (!String(address.streetAddress || "").trim()) {
      ae.streetAddress = "Required";
    }
    if (!String(address.city || "").trim()) {
      ae.city = "Required";
    }
    if (!String(address.state || "").trim()) {
      ae.state = "Required";
    }
    const pin = String(address.pincode || "").replace(/\D/g, "");
    if (pin.length < 5 || pin.length > 10) {
      ae.pincode = "5–10 digits";
    }
    setAddrErrors(ae);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0 && Object.keys(ae).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    const parts = form.name.trim().split(/\s+/);
    const firstName = parts[0] || "";
    const lastName = parts.slice(1).join(" ") || firstName;

    const permissions = isAdminRole ? [] : Array.from(selectedPerms);

    const payload = {
      firstName,
      lastName,
      email: form.email.trim().toLowerCase(),
      password: form.password,
      phone: form.mobile?.trim() || undefined,
      role: apiRole,
      permissions,
      streetAddress: address.streetAddress.trim(),
      area: address.area.trim(),
      city: (address.city || form.region || "").trim(),
      taluka: address.taluka.trim(),
      district: (address.district || form.assignedAreas || "").trim(),
      state: address.state.trim(),
      country: address.country.trim() || "India",
      pincode: String(address.pincode || "").replace(/\D/g, ""),
    };

    setSaving(true);
    try {
      await onCreated(payload);
      onClose();
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Could not create user";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <CommonModal
      open={open}
      onClose={onClose}
      title="Add User"
      width="min(640px, 94vw)"
      bodyClassName="px-3 sm:px-5 pb-4 sm:pb-8 pt-2.5 sm:pt-4"
      footerClassName="!px-3 !py-2.5 sm:!px-6"
      footer={[
        <Button
          key="cancel"
          label="Cancel"
          variant="outline"
          size="sm"
          onClick={onClose}
          disabled={saving}
        />,
        <Button
          key="save"
          label={saving ? "Saving…" : "Save"}
          variant="primary"
          size="sm"
          onClick={handleSave}
          disabled={saving}
          className="text-white! hover:text-white! disabled:border-transparent! disabled:bg-primary/85! disabled:text-white!"
        />,
      ]}
    >
      <div className="flex flex-col gap-3 sm:gap-4">
        <div className="flex flex-col items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept="image/*"
          />
          <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">
            Photos <span className="font-normal text-light dark:text-slate-400">(optional)</span>
          </div>
          <div
            onClick={() => fileInputRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                fileInputRef.current?.click();
              }
            }}
            className="flex h-20 w-20 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-slate-300 bg-slate-100 transition-colors hover:bg-slate-200 dark:border-slate-600 dark:bg-slate-800 dark:hover:bg-slate-700/80"
          >
            {imagePreview ? (
              <img
                src={imagePreview}
                alt="Profile photo preview"
                className="h-full w-full object-cover"
              />
            ) : (
              <>
                <Camera size={24} className="text-slate-400 dark:text-slate-500" />
                <span className="text-[10px] font-medium text-slate-600 dark:text-slate-400">
                  Add Photo
                </span>
              </>
            )}
          </div>
        </div>

        <div className={CARD}>
          <div className={`${CARD_TITLE} mb-3 sm:mb-4`}>Basic Information</div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 sm:gap-4">
            <div className="flex flex-col gap-1">
              <InputField
                label="Name"
                name="name"
                placeholder="First Last"
                value={form.name}
                onChange={handleChange}
              />
              {errors.name && (
                <span className="text-[10px] text-red-500 font-medium">
                  {errors.name}
                </span>
              )}
            </div>
            <InputField
              label="Mobile Number"
              name="mobile"
              placeholder="+91 00000 00000"
              value={form.mobile}
              onChange={handleChange}
            />
            <div className="flex flex-col gap-1">
              <InputField
                label="Email ID"
                name="email"
                placeholder="name@gmail.com"
                value={form.email}
                onChange={handleChange}
              />
              {errors.email && (
                <span className="text-[10px] text-red-500 font-medium">
                  {errors.email}
                </span>
              )}
            </div>
          </div>

          <div className="mt-3 grid grid-cols-1 gap-3 sm:mt-4 sm:grid-cols-2 lg:grid-cols-3 sm:gap-4">
            <CommonDropdown
              label="Role"
              addNavigateTo="/dashboard/user-master"
              placeholder="Role"
              value={form.role}
              onChange={(v) => setForm({ ...form, role: v })}
              options={ROLE_OPTIONS}
            />
            <div className="flex flex-col">
              <label className="mb-1.5 text-left text-[12px] font-semibold leading-tight tracking-wide text-slate-800 dark:text-slate-200">
                Joining Date
              </label>
              <DatePicker
                className="w-full jitox-picker-form text-[13px]!"
                placeholder="DD/MM/YY"
                value={form.joiningDate}
                onChange={(d) => setForm({ ...form, joiningDate: d })}
              />
            </div>
            <CommonDropdown
              label="Region (stored as city)"
              addNavigateTo="/dashboard/user-master"
              placeholder="Select Region"
              value={form.region}
              onChange={(v) => setForm({ ...form, region: v })}
              options={[
                { label: "North", value: "North" },
                { label: "South", value: "South" },
                { label: "Surat", value: "Surat" },
              ]}
            />
          </div>

          <div className="mt-4">
            <InputField
              label="Area / district note (optional if set in address)"
              name="assignedAreas"
              placeholder="e.g. Vesu, Adajan"
              value={form.assignedAreas}
              onChange={handleChange}
            />
          </div>

          <div className="mt-5 border-t border-light-border pt-3 sm:mt-6 sm:pt-4 dark:border-slate-600">
            <div className={`${CARD_TITLE} mb-2`}>
              Address <span className="text-red-500">*</span>
            </div>
            <AddressForm
              value={address}
              onChange={(patch) => setAddress((p) => ({ ...p, ...patch }))}
              errors={addrErrors}
            />
          </div>
        </div>

        {!isAdminRole && (
          <div className={CARD}>
            <div className={`${CARD_TITLE} mb-2`}>Module access</div>
            <p className="mb-3 text-xs text-slate-600 dark:text-slate-400">
              Admin assigns which sidebar sections this Manager or User can open.
            </p>
            <div className="grid max-h-48 grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2 lg:grid-cols-3">
              {MODULE_ACCESS_OPTIONS.map(({ key, label }) => (
                <label
                  key={key}
                  className="flex cursor-pointer items-center gap-2 rounded-md px-1.5 py-1.5 text-xs font-medium text-slate-800 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800/80"
                >
                  <input
                    type="checkbox"
                    className="h-3.5 w-3.5 shrink-0 rounded border-slate-400 text-primary focus:ring-2 focus:ring-primary/30 dark:border-slate-500 dark:bg-slate-900"
                    checked={selectedPerms.has(key)}
                    onChange={() => togglePerm(key)}
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>
        )}

        {isAdminRole && (
          <p className="px-1 text-xs text-slate-600 dark:text-slate-400">
            Admins have full access to all modules automatically.
          </p>
        )}

        <div className={CARD}>
          <div className={`${CARD_TITLE} mb-3 sm:mb-4`}>Security</div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
            <div className="flex flex-col gap-1">
              <InputField
                label="Password"
                name="password"
                type="password"
                placeholder="***********"
                value={form.password}
                onChange={handleChange}
              />
              {errors.password && (
                <span className="text-[10px] text-red-500 font-medium">
                  {errors.password}
                </span>
              )}
            </div>
            <div className="flex flex-col gap-1">
              <InputField
                label="Confirmed Password"
                name="confirmPassword"
                type="password"
                placeholder="***********"
                value={form.confirmPassword}
                onChange={handleChange}
              />
              {errors.confirmPassword && (
                <span className="text-[10px] text-red-500 font-medium">
                  {errors.confirmPassword}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </CommonModal>
  );
};

export default AddUserModal;
