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
      width="1000px"
      footer={[
        <Button
          key="cancel"
          label="Cancel"
          variant="outline"
          onClick={onClose}
          className="px-10"
          disabled={saving}
        />,
        <Button
          key="save"
          label={saving ? "Saving…" : "Save"}
          variant="primary"
          onClick={handleSave}
          className="px-14 bg-[#EEECEC] text-dark border-none hover:bg-primary hover:text-white"
          disabled={saving}
        />,
      ]}
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept="image/*"
          />
          <div className="text-xs font-semibold text-dark">
            Photos <span className="text-light font-normal">(optional)</span>
          </div>
          <div
            onClick={() => fileInputRef.current?.click()}
            className="w-20 h-20 rounded-full bg-gray-100 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 cursor-pointer hover:bg-gray-200 transition-colors overflow-hidden"
          >
            {imagePreview ? (
              <img
                src={imagePreview}
                alt="Profile photo preview"
                className="w-full h-full object-cover"
              />
            ) : (
              <>
                <Camera size={24} className="text-gray-400" />
                <span className="text-[10px] text-gray-500 font-medium">
                  Add Photo
                </span>
              </>
            )}
          </div>
        </div>

        <div className="p-4 rounded-xl border border-light-border bg-white shadow-sm">
          <div className="text-sm font-semibold text-dark mb-4">
            Basic Information
          </div>
          <div className="grid grid-cols-3 gap-4">
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

          <div className="grid grid-cols-3 gap-4 mt-4">
            <CommonDropdown
              label="Role"
              addNavigateTo="/dashboard/user-master"
              placeholder="Role"
              value={form.role}
              onChange={(v) => setForm({ ...form, role: v })}
              options={ROLE_OPTIONS}
            />
            <div className="flex flex-col">
              <label className="mb-1 text-xs font-medium text-dark">
                Joining Date
              </label>
              <DatePicker
                className="w-full"
                placeholder="DD/MM/YY"
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

          <div className="mt-6 pt-4 border-t border-light-border">
            <div className="text-sm font-semibold text-dark mb-2">
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
          <div className="p-4 rounded-xl border border-light-border bg-white shadow-sm">
            <div className="text-sm font-semibold text-dark mb-2">
              Module access
            </div>
            <p className="text-xs text-gray-500 mb-3">
              Admin assigns which sidebar sections this Manager or User can open.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto">
              {MODULE_ACCESS_OPTIONS.map(({ key, label }) => (
                <label
                  key={key}
                  className="flex items-center gap-2 text-xs text-dark cursor-pointer"
                >
                  <input
                    type="checkbox"
                    className="accent-primary rounded"
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
          <p className="text-xs text-gray-600 px-1">
            Admins have full access to all modules automatically.
          </p>
        )}

        <div className="p-4 rounded-xl border border-light-border bg-white shadow-sm">
          <div className="text-sm font-semibold text-dark mb-4">Security</div>
          <div className="grid grid-cols-2 gap-4">
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
