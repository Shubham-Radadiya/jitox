import { InputField } from "../ui/CommanUI";
import { EMPTY_ADDRESS, normalizePincodeInput } from "../../utils/addressFormat";
import { INDIAN_STATES } from "./addressConstants";

/**
 * Structured address editor (compact grid).
 * @param {Record<string, string>} value
 * @param {(patch: Record<string, string>) => void} onChange — merged into parent state
 * @param {Record<string, string>} [errors] — field error messages
 * @param {boolean} [compact] — tighter gaps for dense modals
 */
export default function AddressForm({ value, onChange, errors = {}, compact = false }) {
  const v = { ...EMPTY_ADDRESS, ...value };

  const handle = (name) => (e) => {
    onChange({ [name]: e.target.value });
  };

  const handlePincode = (e) => {
    onChange({ pincode: normalizePincodeInput(e.target.value) });
  };

  /** Avoid `text-dark` / token `gray` on white cards in dark mode (low-contrast “ghost” labels). */
  const labelCls = "text-xs font-semibold text-slate-700 dark:text-slate-300";
  const inputCls = "!min-h-9 !py-1.5 !text-sm";

  return (
    <div
      className={`grid grid-cols-1 md:grid-cols-2 ${compact ? "gap-2" : "gap-3"}`}
    >
      <InputField
        label="Street address *"
        name="streetAddress"
        value={v.streetAddress}
        onChange={handle("streetAddress")}
        placeholder="House / shop no., street"
        labelClassName={labelCls}
        inputClassName={inputCls}
      />
      <InputField
        label="Area / locality"
        name="area"
        value={v.area}
        onChange={handle("area")}
        placeholder="Area, landmark"
        labelClassName={labelCls}
        inputClassName={inputCls}
      />
      <InputField
        label="City *"
        name="city"
        value={v.city}
        onChange={handle("city")}
        placeholder="City"
        labelClassName={labelCls}
        inputClassName={inputCls}
      />
      <InputField
        label="Taluka / tehsil"
        name="taluka"
        value={v.taluka}
        onChange={handle("taluka")}
        placeholder="Taluka"
        labelClassName={labelCls}
        inputClassName={inputCls}
      />
      <InputField
        label="District"
        name="district"
        value={v.district}
        onChange={handle("district")}
        placeholder="District"
        labelClassName={labelCls}
        inputClassName={inputCls}
      />
      <div className="flex flex-col gap-0.5 relative">
        <InputField
          label="State *"
          name="state"
          value={v.state}
          onChange={handle("state")}
          placeholder="Type or pick state"
          list="jitox-indian-states"
          labelClassName={labelCls}
          inputClassName={inputCls}
        />
        <datalist id="jitox-indian-states">
          {INDIAN_STATES.map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>
        {errors.state ? (
          <p className="text-xs text-red-500 dark:text-red-400">{errors.state}</p>
        ) : null}
      </div>
      <InputField
        label="Country"
        name="country"
        value={v.country}
        onChange={handle("country")}
        placeholder="Country"
        labelClassName={labelCls}
        inputClassName={inputCls}
      />
      <InputField
        label="Pincode *"
        name="pincode"
        value={v.pincode}
        onChange={handlePincode}
        placeholder="PIN"
        inputMode="numeric"
        labelClassName={labelCls}
        inputClassName={inputCls}
      />
      {errors.streetAddress ? (
        <p className="text-xs text-red-500 dark:text-red-400 md:col-span-2">{errors.streetAddress}</p>
      ) : null}
      {errors.city ? (
        <p className="text-xs text-red-500 dark:text-red-400 md:col-span-2">{errors.city}</p>
      ) : null}
      {errors.pincode ? (
        <p className="text-xs text-red-500 dark:text-red-400 md:col-span-2">{errors.pincode}</p>
      ) : null}
    </div>
  );
}
