import React, {
  useState,
  useRef,
  useMemo,
  useCallback,
  useEffect,
  useId,
} from "react";
import {
  CommonModal,
  InputField,
  Button,
  CommonDropdown,
  FormSection,
  FieldError,
} from "../../components/ui/CommanUI";
import { Upload } from "lucide-react";
import { INDIAN_STATES } from "../../components/address/addressConstants";
import { normalizePincodeInput } from "../../utils/addressFormat";
import { accountsApi } from "../../services/api";
import toast from "react-hot-toast";
import { getApiErrorMessage } from "../../utils/apiError";

function readStringList(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [...fallback];
    const p = JSON.parse(raw);
    return Array.isArray(p) ? p.map(String) : [...fallback];
  } catch {
    return [...fallback];
  }
}

function toOptions(arr) {
  return arr.map((x) => ({ value: x, label: x }));
}

const DEFAULT_PARTY_TYPES = ["Customer", "Supplier", "Dealer", "Retailer"];
const DEFAULT_TRANSPORT = ["Road", "Rail", "Courier", "Self pickup"];

const DEFAULT_ACCOUNT_TYPE_OPTIONS = [
  { value: "CapitalAccount", label: "Capital Account" },
  { value: "BankAccounts", label: "Bank Accounts" },
  { value: "CashInHand", label: "Cash In Hand" },
  { value: "DepositAsset", label: "Deposit Asset" },
  { value: "LoansAdvances", label: "Loans & Advances" },
  { value: "DebittersGoods", label: "Debitter s-Goods" },
  { value: "CreditorsGoods", label: "Creditors-Goods" },
  { value: "DebittersExpenses", label: "Debitters-Expenses" },
  { value: "CreditorsExpenses", label: "Creditors-Expenses" },
  { value: "DutiesTaxes", label: "Duties & Taxes" },
  { value: "Assets", label: "Assets" },
  { value: "Incomes", label: "Incomes" },
  { value: "Expenses", label: "Expenses" },
];

const DEFAULT_CATEGORY_OPTIONS = [
  { value: "retailer", label: "Retailer" },
  { value: "wholesaler", label: "Wholesaler" },
  { value: "stockist", label: "Stockist" },
  { value: "super_dealer", label: "Super Dealer" },
];

const DEFAULT_PAYMENT_TERM_OPTIONS = [
  { value: "net7", label: "Net 7" },
  { value: "net15", label: "Net 15" },
  { value: "net30", label: "Net 30" },
  { value: "advance", label: "Advance" },
];

const DEFAULT_AREA_OPTIONS = [
  { value: "north", label: "North Region" },
  { value: "south", label: "South Region" },
  { value: "east", label: "East Region" },
  { value: "west", label: "West Region" },
];

const QUICK_ADD_META = {
  accountType: {
    title: "New account type",
    fieldLabel: "Type name",
    placeholder: "e.g. Sundry Creditors",
  },
  category: {
    title: "New category",
    fieldLabel: "Category name",
    placeholder: "e.g. Co-operative",
  },
  partyType: {
    title: "New party type",
    fieldLabel: "Party type",
    placeholder: "e.g. Distributor",
  },
  transport: {
    title: "New transport mode",
    fieldLabel: "Transport",
    placeholder: "e.g. Cold chain",
  },
  paymentTerms: {
    title: "New payment term",
    fieldLabel: "Payment term",
    placeholder: "e.g. Net 45",
  },
  area: {
    title: "New territory",
    fieldLabel: "Area / territory",
    placeholder: "e.g. Central Region",
  },
};

/** PascalCase key for API enum-style account types */
function labelToAccountTypeValue(label) {
  const parts = String(label)
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .split(/\s+/)
    .filter(Boolean);
  if (!parts.length) return `Custom${Date.now()}`;
  return parts
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join("");
}

function labelToCategoryValue(label) {
  const s = String(label)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
  return s || `custom_${Date.now()}`;
}

function labelToPaymentTermValue(label) {
  const m = String(label).match(/(\d+)/);
  if (m) return `net${m[1]}`;
  return (
    String(label)
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_|_$/g, "") || `term_${Date.now()}`
  );
}

function labelToAreaValue(label) {
  const s = String(label)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
  return s || `area_${Date.now()}`;
}

/** Same line composition as API `buildFullAddressComma` for legacy `address`. */
function buildCommaAddress(parts) {
  const trimP = (x) =>
    String(x ?? "")
      .trim()
      .replace(/\s+/g, " ");
  const out = [];
  const p = (x) => {
    const t = trimP(x);
    if (t) out.push(t);
  };
  p(parts.streetAddress);
  p(parts.area);
  p(parts.city);
  p(parts.taluka);
  p(parts.district);
  const state = trimP(parts.state);
  const pin = normalizePincodeInput(parts.pincode);
  if (state && pin) out.push(`${state} - ${pin}`);
  else {
    if (state) out.push(state);
    if (pin) out.push(pin);
  }
  p(parts.country);
  return out.join(", ");
}

const CreateAccountModal = ({ open, onClose, onSaved }) => {
  const fileRef = useRef(null);
  const stateDatalistId = useId();
  const businessStateDatalistId = useId();
  const [pickedFileName, setPickedFileName] = useState("");
  const [saving, setSaving] = useState(false);
  const [optionListRev, setOptionListRev] = useState(0);
  const [accountTypeOptions, setAccountTypeOptions] = useState(
    () => [...DEFAULT_ACCOUNT_TYPE_OPTIONS]
  );
  const [categoryOptions, setCategoryOptions] = useState(
    () => [...DEFAULT_CATEGORY_OPTIONS]
  );
  const [paymentTermOptions, setPaymentTermOptions] = useState(
    () => [...DEFAULT_PAYMENT_TERM_OPTIONS]
  );
  const [areaOptions, setAreaOptions] = useState(() => [...DEFAULT_AREA_OPTIONS]);
  const [quickAddKind, setQuickAddKind] = useState(null);
  const [quickDraft, setQuickDraft] = useState("");

  const [form, setForm] = useState({
    businessName: "",
    accountType: "",
    gst: "",
    businessStreetAddress: "",
    businessCity: "",
    businessState: "",
    businessPincode: "",
    businessArea: "",
    businessTaluka: "",
    businessDistrict: "",
    businessCountry: "India",
    category: "",
    name: "",
    mobile: "",
    email: "",
    amount: "",
    balanceType: "Credit",
    paymentTerms: "",
    creditLimit: "",
    areaAssignment: "",
    streetAddress: "",
    area: "",
    city: "",
    taluka: "",
    district: "",
    state: "",
    country: "India",
    pincode: "",
    birthday: "",
    anniversary: "",
    partyType: "",
    transportMode: "",
    deliveryAt: "",
    customerStatus: "Active",
  });
  const [addrErrors, setAddrErrors] = useState({});
  const [businessAddrErrors, setBusinessAddrErrors] = useState({});

  useEffect(() => {
    if (!open) {
      setPickedFileName("");
      setBusinessAddrErrors({});
    }
  }, [open]);

  const partyTypeList = useMemo(
    () => readStringList("JITOX_PARTY_TYPES", DEFAULT_PARTY_TYPES),
    [open, optionListRev]
  );
  const transportList = useMemo(
    () => readStringList("JITOX_TRANSPORT_OPTIONS", DEFAULT_TRANSPORT),
    [open, optionListRev]
  );
  const partyTypeOptions = useMemo(() => toOptions(partyTypeList), [partyTypeList]);
  const transportOptions = useMemo(() => toOptions(transportList), [transportList]);

  const openQuickAdd = useCallback((kind) => {
    setQuickAddKind(kind);
    setQuickDraft("");
  }, []);

  const closeQuickAdd = useCallback(() => {
    setQuickAddKind(null);
    setQuickDraft("");
  }, []);

  const submitQuickAdd = useCallback(() => {
    const name = quickDraft.trim();
    if (!name) {
      toast.error("Enter a name");
      return;
    }
    switch (quickAddKind) {
      case "accountType": {
        const value = labelToAccountTypeValue(name);
        setAccountTypeOptions((opts) => {
          if (opts.some((o) => o.value === value || o.label === name)) return opts;
          return [...opts, { value, label: name }];
        });
        setForm((f) => ({ ...f, accountType: value }));
        break;
      }
      case "category": {
        const value = labelToCategoryValue(name);
        setCategoryOptions((opts) => {
          if (opts.some((o) => o.value === value)) return opts;
          return [...opts, { value, label: name }];
        });
        setForm((f) => ({ ...f, category: value }));
        break;
      }
      case "partyType": {
        const merged = [...new Set([...partyTypeList, name])];
        localStorage.setItem("JITOX_PARTY_TYPES", JSON.stringify(merged));
        setForm((f) => ({ ...f, partyType: name }));
        setOptionListRev((x) => x + 1);
        toast.success("Party type saved for this browser");
        break;
      }
      case "transport": {
        const merged = [...new Set([...transportList, name])];
        localStorage.setItem("JITOX_TRANSPORT_OPTIONS", JSON.stringify(merged));
        setForm((f) => ({ ...f, transportMode: name }));
        setOptionListRev((x) => x + 1);
        toast.success("Transport option saved");
        break;
      }
      case "paymentTerms": {
        const value = labelToPaymentTermValue(name);
        setPaymentTermOptions((opts) => {
          if (opts.some((o) => o.value === value)) return opts;
          return [...opts, { value, label: name }];
        });
        setForm((f) => ({ ...f, paymentTerms: value }));
        break;
      }
      case "area": {
        const value = labelToAreaValue(name);
        setAreaOptions((opts) => {
          if (opts.some((o) => o.value === value)) return opts;
          return [...opts, { value, label: name }];
        });
        setForm((f) => ({ ...f, areaAssignment: value }));
        break;
      }
      default:
        break;
    }
    if (quickAddKind !== "partyType" && quickAddKind !== "transport") {
      toast.success("Option added");
    }
    closeQuickAdd();
  }, [
    closeQuickAdd,
    partyTypeList,
    quickAddKind,
    quickDraft,
    transportList,
  ]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePincodeChange = (e) => {
    setForm((prev) => ({
      ...prev,
      pincode: normalizePincodeInput(e.target.value),
    }));
  };

  const handleBusinessPincodeChange = (e) => {
    setForm((prev) => ({
      ...prev,
      businessPincode: normalizePincodeInput(e.target.value),
    }));
  };

  const handleFilePick = (e) => {
    const f = e.target.files?.[0];
    setPickedFileName(f?.name || "");
  };

  const handleSubmit = async () => {
    if (!String(form.businessName || "").trim()) {
      toast.error("Business name is required");
      return;
    }
    if (!String(form.accountType || "").trim()) {
      toast.error("Account type is required");
      return;
    }
    if (!String(form.name || "").trim()) {
      toast.error("Name is required");
      return;
    }
    if (!String(form.email || "").trim()) {
      toast.error("Email is required");
      return;
    }
    if (!String(form.mobile || "").trim()) {
      toast.error("Mobile number is required");
      return;
    }
    const ae = {};
    if (!String(form.streetAddress || "").trim()) {
      ae.streetAddress = "Required";
    }
    if (!String(form.city || "").trim()) {
      ae.city = "Required";
    }
    if (!String(form.state || "").trim()) {
      ae.state = "Required";
    }
    const pin = String(form.pincode || "").replace(/\D/g, "");
    if (pin.length < 5 || pin.length > 10) {
      ae.pincode = "5–10 digits";
    }
    setAddrErrors(ae);
    if (Object.keys(ae).length) {
      setBusinessAddrErrors({});
      toast.error("Complete required address fields");
      return;
    }

    const bizAny = [
      form.businessStreetAddress,
      form.businessCity,
      form.businessState,
      form.businessPincode,
      form.businessArea,
      form.businessTaluka,
      form.businessDistrict,
    ].some((x) => String(x || "").trim());
    const be = {};
    if (bizAny) {
      if (!String(form.businessStreetAddress || "").trim()) {
        be.businessStreetAddress = "Required";
      }
      if (!String(form.businessCity || "").trim()) {
        be.businessCity = "Required";
      }
      if (!String(form.businessState || "").trim()) {
        be.businessState = "Required";
      }
      const bizPin = String(form.businessPincode || "").replace(/\D/g, "");
      if (!bizPin) be.businessPincode = "Required";
      else if (bizPin.length < 5 || bizPin.length > 10) {
        be.businessPincode = "5–10 digits";
      }
    }
    setBusinessAddrErrors(be);
    if (Object.keys(be).length) {
      toast.error("Complete business address fields");
      return;
    }
    const amountNum = parseFloat(String(form.amount).replace(/,/g, ""));
    if (!Number.isFinite(amountNum)) {
      toast.error("Opening amount is required");
      return;
    }

    const fd = new FormData();
    fd.append("businessName", String(form.businessName).trim());
    fd.append("accountType", form.accountType);
    fd.append("name", String(form.name).trim());
    fd.append("email", String(form.email).trim());
    fd.append("mobileNumber", String(form.mobile).trim());
    fd.append("amount", String(amountNum));
    fd.append("balenceType", form.balanceType);
    if (form.gst) fd.append("gstNumber", form.gst.trim());
    const composedBusinessAddress = buildCommaAddress({
      streetAddress: form.businessStreetAddress,
      area: form.businessArea,
      city: form.businessCity,
      taluka: form.businessTaluka,
      district: form.businessDistrict,
      state: form.businessState,
      country: form.businessCountry,
      pincode: form.businessPincode,
    });
    if (composedBusinessAddress)
      fd.append("address", composedBusinessAddress);
    if (form.category) fd.append("category", form.category);
    if (form.paymentTerms)
      fd.append("paymentTerm", String(form.paymentTerms));
    if (form.areaAssignment)
      fd.append("areaAssigment", String(form.areaAssignment));
    const cl = parseFloat(String(form.creditLimit));
    if (Number.isFinite(cl)) fd.append("creditLimit", String(cl));
    fd.append("streetAddress", String(form.streetAddress).trim());
    fd.append("area", String(form.area || "").trim());
    fd.append("city", String(form.city).trim());
    fd.append("taluka", String(form.taluka || "").trim());
    fd.append("district", String(form.district || "").trim());
    fd.append("state", String(form.state).trim());
    fd.append("country", String(form.country || "India").trim());
    fd.append("pincode", pin);
    fd.append("pinCode", pin);
    if (form.birthday) fd.append("birthday", String(form.birthday).trim());
    if (form.anniversary)
      fd.append("anniversary", String(form.anniversary).trim());
    if (form.partyType) fd.append("partyType", String(form.partyType).trim());
    if (form.transportMode)
      fd.append("transportMode", String(form.transportMode).trim());
    if (form.deliveryAt)
      fd.append("deliveryAt", String(form.deliveryAt).trim());
    if (form.customerStatus)
      fd.append("customerStatus", String(form.customerStatus).trim());

    const file = fileRef.current?.files?.[0];
    if (file) fd.append("documentUpload", file);

    setSaving(true);
    try {
      await accountsApi.create(fd);
      toast.success("Account created");
      onSaved?.();
      onClose?.();
      setAddrErrors({});
      setBusinessAddrErrors({});
      setForm({
        businessName: "",
        accountType: "",
        gst: "",
        businessStreetAddress: "",
        businessCity: "",
        businessState: "",
        businessPincode: "",
        businessArea: "",
        businessTaluka: "",
        businessDistrict: "",
        businessCountry: "India",
        category: "",
        name: "",
        mobile: "",
        email: "",
        amount: "",
        balanceType: "Credit",
        paymentTerms: "",
        creditLimit: "",
        areaAssignment: "",
        streetAddress: "",
        area: "",
        city: "",
        taluka: "",
        district: "",
        state: "",
        country: "India",
        pincode: "",
        birthday: "",
        anniversary: "",
        partyType: "",
        transportMode: "",
        deliveryAt: "",
        customerStatus: "Active",
      });
      if (fileRef.current) fileRef.current.value = "";
      setPickedFileName("");
    } catch (e) {
      toast.error(getApiErrorMessage(e, "Could not create account"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <CommonModal
      open={open}
      onClose={onClose}
      title="Create Account"
      size="4xl"
      shellClassName="!p-1.5 sm:!p-2"
      className="!max-h-[98vh]"
      titleClassName="!text-base !font-extrabold !tracking-tight !text-slate-900 dark:!text-slate-50"
      headerClassName="!py-2 !px-3"
      bodyClassName="!pt-2 !px-3 !pb-10 sm:!pb-12"
      footerClassName="!py-2 !px-3"
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
          size="md"
          onClick={handleSubmit}
          className="min-w-[8rem] font-semibold"
          disabled={saving}
        />,
      ]}
    >
      <form className="flex min-w-0 flex-col gap-2.5 text-[12px]">
        <input
          ref={fileRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          className="hidden"
          aria-hidden
          onChange={handleFilePick}
        />
        <FormSection title="Business details" book>
          <div className="flex min-w-0 flex-col gap-2.5">
            <div className="grid grid-cols-1 gap-x-2 gap-y-1.5 sm:grid-cols-2 lg:grid-cols-3">
              <div className="min-w-0">
                <InputField
                  dense
                  label="Business Name"
                  name="businessName"
                  value={form.businessName}
                  onChange={handleChange}
                  placeholder="Business name"
                />
              </div>
              <div className="min-w-0">
                <CommonDropdown
                  filterBar
                  label="Account Type"
                  searchable
                  searchPlaceholder="Search types…"
                  value={form.accountType}
                  onChange={(val) =>
                    setForm((f) => ({ ...f, accountType: val }))
                  }
                  options={accountTypeOptions}
                  placeholder="Select option"
                  onAddClick={() => openQuickAdd("accountType")}
                />
              </div>
              <div className="min-w-0 sm:col-span-2 lg:col-span-1">
                <InputField
                  dense
                  label="GST (Optional)"
                  name="gst"
                  value={form.gst}
                  onChange={handleChange}
                  placeholder="e.g. 22AAAAA0000A1Z5"
                />
              </div>
            </div>

            <div className="min-w-0 space-y-1.5">
              <p className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-wide text-slate-800 dark:text-slate-200">
                <span
                  className="h-3.5 w-0.5 shrink-0 rounded-full bg-primary dark:bg-emerald-500"
                  aria-hidden
                />
                Business address
              </p>
              <div className="grid grid-cols-1 gap-x-2 gap-y-1.5 sm:grid-cols-2">
                <div className="min-w-0 sm:col-span-2">
                  <InputField
                    dense
                    multiline
                    rows={2}
                    label="Street / locality"
                    name="businessStreetAddress"
                    value={form.businessStreetAddress}
                    onChange={handleChange}
                    placeholder="House / street, locality"
                  />
                  <FieldError
                    message={businessAddrErrors.businessStreetAddress}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-x-2 gap-y-1.5 sm:grid-cols-3">
                <div className="min-w-0">
                  <InputField
                    dense
                    label="City *"
                    name="businessCity"
                    value={form.businessCity}
                    onChange={handleChange}
                    placeholder="City"
                  />
                  <FieldError message={businessAddrErrors.businessCity} />
                </div>
                <div className="flex min-w-0 flex-col gap-0.5">
                  <InputField
                    dense
                    label="State *"
                    name="businessState"
                    value={form.businessState}
                    onChange={handleChange}
                    placeholder="State"
                    list={businessStateDatalistId}
                  />
                  <datalist id={businessStateDatalistId}>
                    {INDIAN_STATES.map((s) => (
                      <option key={s} value={s} />
                    ))}
                  </datalist>
                  <FieldError message={businessAddrErrors.businessState} />
                </div>
                <div className="min-w-0">
                  <InputField
                    dense
                    label="Pincode *"
                    name="businessPincode"
                    value={form.businessPincode}
                    onChange={handleBusinessPincodeChange}
                    placeholder="PIN"
                    inputMode="numeric"
                  />
                  <FieldError message={businessAddrErrors.businessPincode} />
                </div>
                <InputField
                  dense
                  label="Area / locality"
                  name="businessArea"
                  value={form.businessArea}
                  onChange={handleChange}
                  placeholder="Area"
                />
                <InputField
                  dense
                  label="Taluka"
                  name="businessTaluka"
                  value={form.businessTaluka}
                  onChange={handleChange}
                  placeholder="Taluka"
                />
                <InputField
                  dense
                  label="District"
                  name="businessDistrict"
                  value={form.businessDistrict}
                  onChange={handleChange}
                  placeholder="District"
                />
                <InputField
                  dense
                  className="sm:col-span-3"
                  label="Country"
                  name="businessCountry"
                  value={form.businessCountry}
                  onChange={handleChange}
                  placeholder="Country"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-x-2 gap-y-1.5 sm:grid-cols-2 lg:grid-cols-3">
              <div className="min-w-0">
                <CommonDropdown
                  filterBar
                  label="Category"
                  options={categoryOptions}
                  value={form.category}
                  onChange={(val) =>
                    handleChange({ target: { name: "category", value: val } })
                  }
                  placeholder="Select category"
                  onAddClick={() => openQuickAdd("category")}
                />
              </div>
              <div className="min-w-0">
                <CommonDropdown
                  filterBar
                  label="Party type"
                  options={partyTypeOptions}
                  value={form.partyType}
                  onChange={(val) =>
                    handleChange({ target: { name: "partyType", value: val } })
                  }
                  placeholder="Select or add"
                  onAddClick={() => openQuickAdd("partyType")}
                />
              </div>
              <div className="min-w-0 sm:col-span-2 lg:col-span-1">
                <CommonDropdown
                  filterBar
                  label="Transport"
                  options={transportOptions}
                  value={form.transportMode}
                  onChange={(val) =>
                    handleChange({
                      target: { name: "transportMode", value: val },
                    })
                  }
                  placeholder="Select or add"
                  onAddClick={() => openQuickAdd("transport")}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-x-2 gap-y-1.5 sm:grid-cols-2">
              <div className="min-w-0">
                <InputField
                  dense
                  label="Delivery at"
                  name="deliveryAt"
                  value={form.deliveryAt}
                  onChange={handleChange}
                  placeholder="Godown / site"
                />
              </div>
              <div className="min-w-0">
                <CommonDropdown
                  filterBar
                  label="Customer status"
                  hideAdd
                  options={[
                    { value: "Active", label: "Active" },
                    { value: "Inactive", label: "Inactive" },
                  ]}
                  value={form.customerStatus}
                  onChange={(val) =>
                    handleChange({
                      target: { name: "customerStatus", value: val },
                    })
                  }
                  placeholder="Status"
                />
              </div>
            </div>
          </div>
        </FormSection>

        <FormSection title="Personal details" book>
          <div className="flex min-w-0 flex-col gap-2.5">
            <div className="grid grid-cols-1 gap-x-2 gap-y-1.5 sm:grid-cols-2">
              <InputField
                dense
                label="Name"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Full name"
              />
              <InputField
                dense
                label="Mobile Number"
                name="mobile"
                value={form.mobile}
                onChange={handleChange}
                placeholder="+91 00000 00000"
              />
              <InputField
                dense
                label="Email ID"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="name@gmail.com"
              />
              <div className="min-w-0">
                <InputField
                  dense
                  multiline
                  rows={2}
                  label="Residential address"
                  name="streetAddress"
                  value={form.streetAddress}
                  onChange={handleChange}
                  placeholder="House / street, locality"
                />
                <FieldError message={addrErrors.streetAddress} />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-x-2 gap-y-1.5 sm:grid-cols-3">
              <div className="min-w-0">
                <InputField
                  dense
                  label="City *"
                  name="city"
                  value={form.city}
                  onChange={handleChange}
                  placeholder="City"
                />
                <FieldError message={addrErrors.city} />
              </div>
              <div className="flex min-w-0 flex-col gap-0.5">
                <InputField
                  dense
                  label="State *"
                  name="state"
                  value={form.state}
                  onChange={handleChange}
                  placeholder="State"
                  list={stateDatalistId}
                />
                <datalist id={stateDatalistId}>
                  {INDIAN_STATES.map((s) => (
                    <option key={s} value={s} />
                  ))}
                </datalist>
                <FieldError message={addrErrors.state} />
              </div>
              <div className="min-w-0">
                <InputField
                  dense
                  label="Pincode *"
                  name="pincode"
                  value={form.pincode}
                  onChange={handlePincodeChange}
                  placeholder="PIN"
                  inputMode="numeric"
                />
                <FieldError message={addrErrors.pincode} />
              </div>
              <InputField
                dense
                label="Area / locality"
                name="area"
                value={form.area}
                onChange={handleChange}
                placeholder="Area"
              />
              <InputField
                dense
                label="Taluka"
                name="taluka"
                value={form.taluka}
                onChange={handleChange}
                placeholder="Taluka"
              />
              <InputField
                dense
                label="District"
                name="district"
                value={form.district}
                onChange={handleChange}
                placeholder="District"
              />
              <InputField
                dense
                className="sm:col-span-3"
                label="Country"
                name="country"
                value={form.country}
                onChange={handleChange}
                placeholder="Country"
              />
            </div>
          </div>
        </FormSection>

        <FormSection title="Opening balance" book>
          <div className="grid grid-cols-1 gap-x-2 gap-y-1.5 sm:grid-cols-2 sm:items-end">
            <InputField
              dense
              label="Amount"
              name="amount"
              value={form.amount}
              onChange={handleChange}
              placeholder="Amount (₹)"
            />
            <div className="flex flex-col min-w-0">
              <span className="mb-1 text-[11px] font-semibold tracking-wide text-slate-800 dark:text-slate-200">
                Balance type
              </span>
              <div className="flex flex-wrap items-center gap-2 rounded-md border border-light-border bg-white px-2 py-1 min-h-9 dark:border-slate-600 dark:bg-slate-800">
                <label className="flex cursor-pointer items-center gap-1.5 text-[11px] text-dark dark:text-slate-200">
                  <input
                    type="radio"
                    name="balanceType"
                    value="Credit"
                    checked={form.balanceType === "Credit"}
                    onChange={handleChange}
                    className="border-slate-300 text-primary focus:ring-primary dark:border-slate-500 dark:bg-slate-900"
                  />
                  Credit
                </label>
                <label className="flex cursor-pointer items-center gap-1.5 text-[11px] text-dark dark:text-slate-200">
                  <input
                    type="radio"
                    name="balanceType"
                    value="Debit"
                    checked={form.balanceType === "Debit"}
                    onChange={handleChange}
                    className="border-slate-300 text-primary focus:ring-primary dark:border-slate-500 dark:bg-slate-900"
                  />
                  Debit
                </label>
              </div>
            </div>
          </div>
        </FormSection>

        <FormSection
          title="Documents upload & additional info"
          hint="PDF, JPG"
          book
        >
          <div className="flex min-w-0 flex-col gap-2.5">
            <div className="grid grid-cols-1 gap-x-2 gap-y-1.5 sm:grid-cols-2 sm:items-end">
              <div>
                <span className="mb-1 block text-[11px] font-semibold tracking-wide text-slate-800 dark:text-slate-200">
                  Documents upload
                </span>
                <div className="flex min-h-9 items-center gap-2 rounded-md border border-dashed border-light-border bg-slate-50/80 px-2 py-1 dark:border-slate-600 dark:bg-slate-800/90">
                  <Button
                    type="button"
                    label="Upload"
                    variant="outline"
                    size="sm"
                    icon={Upload}
                    className="min-h-8 shrink-0 border-light-border bg-white px-2 py-1 text-[11px] dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200"
                    onClick={() => fileRef.current?.click()}
                  />
                  <span
                    className="min-w-0 truncate text-[11px] text-slate-500 dark:text-slate-400"
                    title={pickedFileName || undefined}
                  >
                    {pickedFileName || "Choose file"}
                  </span>
                </div>
              </div>
              <InputField
                dense
                label="Credit Limit"
                name="creditLimit"
                value={form.creditLimit}
                onChange={handleChange}
                placeholder="Value (number of days)"
              />
            </div>
            <div className="grid grid-cols-1 gap-x-2 gap-y-1.5 sm:grid-cols-2">
              <CommonDropdown
                filterBar
                label="Payment Terms"
                options={paymentTermOptions}
                value={form.paymentTerms}
                onChange={(val) =>
                  handleChange({ target: { name: "paymentTerms", value: val } })
                }
                placeholder="Payment term"
                onAddClick={() => openQuickAdd("paymentTerms")}
              />
              <CommonDropdown
                filterBar
                label="Area Assignment"
                options={areaOptions}
                value={form.areaAssignment}
                onChange={(val) =>
                  handleChange({
                    target: { name: "areaAssignment", value: val },
                  })
                }
                placeholder="Territory"
                onAddClick={() => openQuickAdd("area")}
              />
            </div>
          </div>
        </FormSection>
      </form>

      <CommonModal
        open={Boolean(quickAddKind)}
        onClose={closeQuickAdd}
        title={
          quickAddKind && QUICK_ADD_META[quickAddKind]
            ? QUICK_ADD_META[quickAddKind].title
            : "Add"
        }
        size="md"
        footer={[
          <Button
            key="cancel"
            label="Cancel"
            variant="outline"
            size="sm"
            onClick={closeQuickAdd}
          />,
          <Button
            key="add"
            label="Add"
            variant="primary"
            size="sm"
            onClick={submitQuickAdd}
          />,
        ]}
      >
        {quickAddKind && QUICK_ADD_META[quickAddKind] ? (
          <InputField
            label={QUICK_ADD_META[quickAddKind].fieldLabel}
            name="quickDraft"
            value={quickDraft}
            onChange={(e) => setQuickDraft(e.target.value)}
            placeholder={QUICK_ADD_META[quickAddKind].placeholder}
          />
        ) : null}
      </CommonModal>
    </CommonModal>
  );
};

export default CreateAccountModal;
