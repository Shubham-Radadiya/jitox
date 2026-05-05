import React, { useState, useRef, useEffect } from "react";
import {
  CommonModal,
  InputField,
  CommonDropdown,
  Button,
} from "../../components/ui/CommanUI";
import { DatePicker } from "antd";
import dayjs from "dayjs";
import { Camera, Edit2 } from "lucide-react";
import toast from "react-hot-toast";
import { MODULE_ACCESS_OPTIONS } from "../../constants/accessModules";
import AddressForm from "../../components/address/AddressForm";
import { EMPTY_ADDRESS, addressFromUser } from "../../utils/addressFormat";

const ROLE_OPTIONS = [
  { label: "Admin", value: "admin" },
  { label: "Manager", value: "manager" },
  { label: "User", value: "user" },
];

/** In `.dark`, `text-dark` resolves to a light color meant for page chrome — illegible on white cards. */
const CARD =
  "p-4 rounded-xl border border-light-border bg-white shadow-sm dark:border-slate-600 dark:bg-slate-900 dark:shadow-[0_2px_12px_rgba(0,0,0,0.35)]";
const CARD_TITLE = "text-sm font-semibold text-slate-900 dark:text-slate-100";

function mapRoleToApi(value) {
  const v = (value || "user").toLowerCase();
  if (v === "admin") return "Admin";
  if (v === "manager") return "Manager";
  return "User";
}

/**
 * Admin updates user; calls onSave(userId, payload) — parent runs PUT /users/update-user/:id
 */
const EditUserModal = ({ open, onClose, user, onSave }) => {
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
    if (!open || !user) return;
    const name = user["User Name"] || user.name || "";
    const nextAddr = addressFromUser({
      streetAddress: user.streetAddress,
      area: user.area,
      city: user.city || user.Region,
      taluka: user.taluka,
      district: user.district || user.Area,
      state: user.state,
      country: user.country,
      pincode: user.pincode,
      address: user.address,
    });
    setAddress({ ...EMPTY_ADDRESS, ...nextAddr });
    setForm({
      name,
      mobile: user["Phone No"] || user.mobile || "",
      email: user.Email || user.email || "",
      role: (user.Role || user.role || "User").toLowerCase(),
      joiningDate: user["Joining Date"]
        ? dayjs(user["Joining Date"])
        : null,
      region: user.Region || user.region || nextAddr.city || "",
      assignedAreas: user.Area || user.assignedAreas || nextAddr.district || "",
      password: "",
      confirmPassword: "",
      areaAccess: user.areaAccess || false,
      isActive: user.isActive !== undefined ? user.isActive : true,
    });
    const existing = user.permissions;
    if (Array.isArray(existing) && existing.length > 0) {
      setSelectedPerms(new Set(existing));
    } else if ((user.Role || user.role) === "Admin") {
      setSelectedPerms(new Set(MODULE_ACCESS_OPTIONS.map((m) => m.key)));
    } else {
      setSelectedPerms(new Set(["dashboard"]));
    }
    setImagePreview(user.image || null);
    setErrors({});
    setAddrErrors({});
  }, [user, open]);

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
    if (!form.email.trim()) newErrors.email = "Email is required";
    if (form.password && form.password !== form.confirmPassword) {
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
    if (!validate() || !user?._id) return;
    const parts = form.name.trim().split(/\s+/);
    const firstName = parts[0] || "";
    const lastName = parts.slice(1).join(" ") || firstName;

    const payload = {
      firstName,
      lastName,
      email: form.email.trim().toLowerCase(),
      role: apiRole,
      phone: form.mobile?.trim() || undefined,
      permissions: isAdminRole ? [] : Array.from(selectedPerms),
      streetAddress: address.streetAddress.trim(),
      area: address.area.trim(),
      city: (address.city || form.region || "").trim(),
      taluka: address.taluka.trim(),
      district: (address.district || form.assignedAreas || "").trim(),
      state: address.state.trim(),
      country: address.country.trim() || "India",
      pincode: String(address.pincode || "").replace(/\D/g, ""),
    };

    if (form.password?.trim()) {
      payload.password = form.password;
    }

    setSaving(true);
    try {
      await onSave(user._id, payload);
      onClose();
    } catch (err) {
      toast.error(
        err?.response?.data?.message || err?.message || "Update failed"
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <CommonModal open={open} onClose={onClose} title="Edit Details" width="min(720px, 94vw)">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col items-center">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept="image/*"
          />
          <div className="relative group">
            <div className="w-24 h-24 rounded-full bg-gray-100 overflow-hidden border-2 border-primary/20 shadow-sm">
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Profile photo preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-slate-400 dark:text-slate-500">
                  {form.name?.charAt(0) || "U"}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0.5 right-0.5 bg-primary p-1 rounded-full text-white border-2 border-white hover:bg-primary/90 shadow-md"
              title="Change photo"
            >
              <Edit2 size={11} strokeWidth={2.25} />
            </button>
          </div>
        </div>

        <div className={CARD}>
          <div className={`${CARD_TITLE} mb-4`}>Basic Information</div>
          <div className="grid grid-cols-3 gap-4">
            <div className="flex flex-col gap-1">
              <InputField
                label="Name"
                name="name"
                value={form.name}
                onChange={handleChange}
              />
              {errors.name && (
                <span className="text-[10px] text-red-500">{errors.name}</span>
              )}
            </div>
            <InputField
              label="Mobile"
              name="mobile"
              value={form.mobile}
              onChange={handleChange}
            />
            <div className="flex flex-col gap-1">
              <InputField
                label="Email"
                name="email"
                value={form.email}
                onChange={handleChange}
              />
              {errors.email && (
                <span className="text-[10px] text-red-500">{errors.email}</span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-4">
            <CommonDropdown
              label="Role"
              addNavigateTo="/dashboard/user-master"
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
                value={form.joiningDate}
                onChange={(d) => setForm({ ...form, joiningDate: d })}
              />
            </div>
            <CommonDropdown
              label="Region (city)"
              addNavigateTo="/dashboard/user-master"
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
              label="Area / district"
              name="assignedAreas"
              value={form.assignedAreas}
              onChange={handleChange}
            />
          </div>

          <div className="mt-6 border-t border-light-border pt-4 dark:border-slate-600">
            <div className={`${CARD_TITLE} mb-2`}>Address</div>
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
            <div className="grid max-h-48 grid-cols-2 gap-2 overflow-y-auto sm:grid-cols-3">
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

        <div className={CARD}>
          <div className={`${CARD_TITLE} mb-2`}>New password (optional)</div>
          <div className="grid grid-cols-2 gap-4">
            <InputField
              label="Password"
              name="password"
              type="password"
              placeholder="Leave blank to keep current"
              value={form.password}
              onChange={handleChange}
            />
            <InputField
              label="Confirm"
              name="confirmPassword"
              type="password"
              value={form.confirmPassword}
              onChange={handleChange}
            />
          </div>
          {errors.confirmPassword && (
            <span className="text-[10px] text-red-500">
              {errors.confirmPassword}
            </span>
          )}
        </div>

        <div className="flex justify-end gap-2 mt-3">
          <Button
            label="Cancel"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={saving}
          />
          <Button
            label={saving ? "Saving…" : "Save"}
            variant="primary"
            size="sm"
            onClick={handleSave}
            disabled={saving}
            className="text-white! hover:text-white! disabled:border-transparent! disabled:bg-primary/85! disabled:text-white!"
          />
        </div>
      </div>
    </CommonModal>
  );
};

export default EditUserModal;
