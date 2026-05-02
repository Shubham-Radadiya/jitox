import React, { useEffect, useRef, useState, useId } from "react";
import { ChevronDown, ClipboardList, Eye, EyeOff } from "lucide-react";
import { DatePicker, TimePicker } from "antd";
import dayjs from "dayjs";
import { MdOutlineSearch } from "react-icons/md";
import { X } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import useOutsideClick from "../../hooks/useOutsideClick";
import { voucherNavItems } from "../../constants/voucherList";

const { RangePicker } = DatePicker;

// Input Field
export const InputField = ({
  label,
  type = "text",
  value,
  onChange,
  onBlur,
  placeholder,
  name,
  required = false,
  className = "",
  inputClassName = "",
  labelClassName = "",
  multiline = false,
  rows = 3,
  dense = false,
  ...rest
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password" && !multiline;
  const inputType = isPassword && showPassword ? "text" : type;

  const heightLock = multiline
    ? ""
    : dense
      ? "h-9 min-h-9 max-h-9"
      : "h-10 min-h-10 max-h-10";

  const baseClasses = dense
    ? `w-full ${heightLock} rounded-md border border-slate-300 bg-slate-50 px-2.5 py-1.5 text-[12px] leading-snug text-dark shadow-sm ring-1 ring-slate-900/[0.04] transition-[border-color,box-shadow,background-color] placeholder:text-[11px] placeholder:text-slate-500 hover:border-slate-400 hover:bg-white focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/25 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100 dark:ring-white/[0.06] dark:placeholder:text-slate-500 dark:hover:border-slate-500 dark:hover:bg-slate-900 dark:focus:border-primary dark:focus:bg-slate-950 dark:focus:ring-primary/30`
    : `w-full ${heightLock} rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-[13px] leading-snug text-dark shadow-sm ring-1 ring-slate-900/[0.04] transition-[border-color,box-shadow,background-color] placeholder:text-[13px] placeholder:text-slate-500 hover:border-slate-400 hover:bg-white focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/25 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100 dark:ring-white/[0.06] dark:placeholder:text-slate-500 dark:hover:border-slate-500 dark:hover:bg-slate-900 dark:focus:border-primary dark:focus:bg-slate-950 dark:focus:ring-primary/30`;

  const InputComponent = multiline ? "textarea" : "input";

  return (
    <div className={`flex flex-col relative ${className}`}>
      {label ? (
        <label
          className={`text-left font-semibold leading-tight tracking-wide text-slate-800 dark:text-slate-200 ${
            dense ? "mb-1 text-[11px]" : "mb-1.5 text-[12px]"
          } ${labelClassName}`}
        >
          {label}
        </label>
      ) : null}
      <div className="relative">
        <InputComponent
          type={!multiline ? inputType : undefined}
          name={name}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          required={required}
          rows={multiline ? rows : undefined}
          className={`${baseClasses} ${inputClassName} ${
            isPassword ? "pr-10" : ""
          }`}
          {...rest}
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-4 flex items-center text-light hover:text-dark text-sm dark:text-slate-400 dark:hover:text-slate-200"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
    </div>
  );
};

export const Button = ({
  label,
  onClick,
  type = "button",
  variant = "primary",
  size = "md",
  disabled = false,
  icon: Icon,
  className = "",
}) => {
  const sizeStyle =
    size === "sm"
      ? "px-3 py-1 rounded-lg text-xs font-medium min-h-7 gap-1"
      : "px-4 py-2 rounded-lg text-sm font-medium min-h-9 gap-1.5";
  const baseStyle = `${sizeStyle} transition-all duration-200 flex items-center justify-center`;

  const variants = {
    primary: "bg-primary text-[#ffffff] hover:bg-primary/90 hover:!text-white",
    outline:
      "border border-light-border text-black hover:bg-primary hover:!text-white dark:border-slate-600 dark:text-slate-200 dark:hover:!text-white",
    ghost:
      "!text-primary hover:bg-primary/90 hover:!text-white dark:!text-emerald-400 dark:hover:bg-emerald-950/40 dark:hover:!text-white",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyle} ${variants[variant]} ${disabled
        ? "cursor-not-allowed bg-white border border-light-border text-gray-400 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-500"
        : ""
        } ${className}`}
    >
      {Icon && (
        <Icon className={`shrink-0 ${size === "sm" ? "text-base" : "text-lg"}`} />
      )}
      {label}
    </button>
  );
};

export const Card = ({
  title,
  description,
  children,
  actionLabel,
  onAction,
  className = "",
}) => (
  <section
    className={`rounded-lg p-4 bg-white border border-gray-200 shadow-sm dark:border-slate-700 dark:bg-slate-900 ${className}`}
  >
    {(title || description || actionLabel) && (
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="text-left min-w-0">
          {title && (
            <div className="text-base font-medium text-gray-900 leading-snug dark:text-slate-100">
              {title}
            </div>
          )}
          {description && (
            <p className="text-sm text-gray-500 mt-1 leading-snug dark:text-slate-400">
              {description}
            </p>
          )}
        </div>
        {actionLabel && (
          <button
            type="button"
            onClick={onAction}
            className="text-blue underline text-sm font-medium"
          >
            {actionLabel}
          </button>
        )}
      </div>
    )}
    {children}
  </section>
);

export const DateInput = ({ label, value, onChange, name }) => (
  <div className="flex flex-col">
    {label && (
      <label className="mb-1.5 text-left text-[12px] font-semibold leading-tight tracking-wide text-slate-800 dark:text-slate-200">
        {label}
      </label>
    )}
    <DatePicker
      className="w-full jitox-picker-form !text-[13px]"
      format="YYYY-MM-DD"
      value={value ? dayjs(value) : null}
      onChange={(date) => onChange({ target: { name, value: date } })}
    />
  </div>
);

export const TimeInput = ({ label, value, onChange, name }) => (
  <div className="flex flex-col">
    {label && (
      <label className="mb-1 text-left text-xs font-medium text-slate-600 dark:text-slate-400">
        {label}
      </label>
    )}
    <TimePicker
      format="HH:mm"
      value={value ? dayjs(value, "HH:mm") : null}
      onChange={(time) =>
        onChange({ target: { name, value: time ? time.format("HH:mm") : "" } })
      }
    />
  </div>
);

export const DateRangePicker = ({
  label,
  value,
  onChange,
  className = "",
  placeholder = ["Start Date", "End Date"],
  /** Match filter toolbar height (h-9) */
  filterBar = false,
}) => (
  <div className={`flex flex-col min-w-0 ${className}`}>
    {label && (
      <label
        className={
          filterBar
            ? "mb-1 text-left text-[11px] font-semibold tracking-wide text-slate-800 dark:text-slate-200"
            : "mb-1 text-left text-xs font-semibold tracking-wide text-slate-800 dark:text-slate-200"
        }
      >
        {label}
      </label>
    )}
    <RangePicker
      format="YYYY-MM-DD"
      value={value ? [value[0] ? dayjs(value[0]) : null, value[1] ? dayjs(value[1]) : null] : null}
      onChange={(dates) => {
        if (dates && dates[0] && dates[1]) {
          onChange([dates[0].format("YYYY-MM-DD"), dates[1].format("YYYY-MM-DD")]);
        } else {
          onChange(null);
        }
      }}
      placeholder={placeholder}
      className={`w-full ${filterBar ? "jitox-picker-compact" : ""}`}
    />
  </div>
);

export { SelectWithAdd, CommonDropdown } from "./SelectWithAdd";
export { FormSection, FieldError } from "./FormSection";

export const SearchBar = ({
  placeholder = "Search...",
  value,
  onChange,
  className = "",
  dense = false,
}) => {
  const shell = dense
    ? "h-9 min-h-9 py-1.5 px-2.5 rounded-md border-gray-200 dark:border-slate-600"
    : "py-2.5 px-4 rounded-lg border-light-border min-h-11 dark:border-slate-600";
  return (
    <div
      className={`flex items-center border bg-white dark:bg-slate-900 ${shell} ${className}`}
    >
      <MdOutlineSearch
        size={dense ? 16 : 18}
        className="text-gray-400 mr-2 shrink-0 dark:text-slate-500"
      />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 min-w-0 text-sm text-gray-800 outline-none placeholder:text-gray-400 bg-transparent dark:text-slate-100 dark:placeholder:text-slate-500"
      />
    </div>
  );
};

 
const MODAL_SIZE_MAX = {
  sm: "max-w-sm",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-3xl",
  "2xl": "max-w-4xl",
  "3xl": "max-w-5xl",
  "4xl": "max-w-6xl",
};

/**
 * Modal with fixed header/footer and scrollable body only when content exceeds viewport.
 * Use `width` (e.g. "800px") for legacy exact max-width, or `size` for responsive max-width.
 */
export const CommonModal = ({
  open,
  onClose,
  title,
  children,
  width,
  size = "md",
  hideClose = false,
  className = "",
  bodyClassName = "",
  headerClassName = "",
  titleClassName = "",
  footerClassName = "",
  shellClassName = "",
  footer,
  position = "center",
}) => {
  const titleId = useId();
  if (!open) return null;

  const positionClasses = {
    center: "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
    right: "top-20 right-10 translate-x-0",
    left: "top-20 left-10 translate-x-0",
  };

  const maxWClass = width ? "" : MODAL_SIZE_MAX[size] || MODAL_SIZE_MAX.md;

  return (
    <div
      className={`fixed inset-0 z-[99] flex items-center justify-center p-3 sm:p-5 pointer-events-none ${shellClassName}`}
    >
      <div
        className="absolute inset-0 bg-black/30 pointer-events-auto"
        onClick={onClose}
        aria-hidden
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        className={`absolute flex flex-col w-full max-h-[min(92vh,52rem)] overflow-hidden rounded-2xl border border-light-border/90 bg-white shadow-xl pointer-events-auto dark:bg-slate-900 dark:border-slate-700 ${maxWClass} ${positionClasses[position]} ${className}`}
        style={width ? { maxWidth: width } : undefined}
      >
        {title ? (
          <header
            className={`shrink-0 flex items-center justify-between gap-3 px-4 sm:px-5 py-3 border-b border-light-border bg-white dark:bg-slate-900 dark:border-slate-700 ${headerClassName}`}
          >
            <h2
              id={titleId}
              className={`text-left text-base font-semibold text-dark tracking-tight pr-2 ${titleClassName}`}
            >
              {title}
            </h2>
            {!hideClose && (
              <button
                type="button"
                onClick={onClose}
                className="shrink-0 rounded-lg p-1 text-slate-500 hover:bg-slate-100 hover:text-dark transition dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                aria-label="Close"
              >
                <X size={18} strokeWidth={2} />
              </button>
            )}
          </header>
        ) : null}

        <div
          className={`flex-1 min-h-0 overflow-y-auto overscroll-contain scroll-pb-8 px-4 pb-8 pt-3 text-dark sm:px-5 sm:pb-10 sm:pt-4 dark:text-slate-100 ${bodyClassName}`}
        >
          {children}
        </div>

        {footer ? (
          <footer
            className={`shrink-0 flex flex-wrap items-center justify-end gap-2 sm:gap-3 px-4 sm:px-5 py-3 border-t border-light-border bg-slate-50/80 dark:bg-slate-900/90 dark:border-slate-700 ${footerClassName}`}
          >
            {footer}
          </footer>
        ) : null}
      </div>
    </div>
  );
};

export const VoucherFilter = ({ className = "max-w-sm" }) => {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  const wrapperRef = useRef();
  useOutsideClick(wrapperRef, () => setOpen(false)); //

  useEffect(() => {
    const currentPath = location.pathname;
    // First try exact match, then try path starts with (for sub-routes)
    const matchedVoucher = voucherNavItems.find((v) => {
      if (currentPath === v.path) return true;
      if (currentPath.startsWith(v.path + "/")) return true;
      return false;
    });
    
    if (matchedVoucher) {
      setSelected(matchedVoucher.name);
    } else if (currentPath.startsWith('/dashboard/accounting-voucher')) {
      setSelected("Purchase Voucher");
      if (currentPath === '/dashboard/accounting-voucher' || currentPath === '/dashboard/accounting-voucher/') {
        navigate('/dashboard/accounting-voucher/purchase', { replace: true });
      }
    }
  }, [location.pathname, navigate]);

  const handleSelect = (item) => {
    setSelected(item.name);
    setOpen(false);
    navigate(item.path);
  };

  return (
    <div className={`relative min-w-0 w-full ${className}`.trim()} ref={wrapperRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`flex h-9 min-h-9 max-h-9 w-full items-center justify-between border border-slate-200/90 bg-white px-3 py-0 text-[11px] font-medium leading-tight shadow-sm ring-1 ring-slate-900/[0.04] transition hover:border-primary/80 hover:bg-emerald-50/40 hover:ring-primary/15 dark:border-slate-600 dark:bg-slate-900/90 dark:ring-white/[0.06] dark:hover:border-primary/70 dark:hover:bg-primary/10
          ${open ? "rounded-t-lg rounded-b-none border-b-transparent ring-0" : "rounded-lg"}
        `}
      >
        <span className="truncate text-dark dark:text-slate-100">
          {selected || "Select Voucher Type"}
        </span>
        <ChevronDown
          size={14}
          className={`shrink-0 text-slate-500 transition-transform dark:text-slate-400 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute left-0 z-20 max-h-80 w-full overflow-auto rounded-b-lg border border-t-0 border-slate-200/90 bg-white p-2 shadow-lg shadow-slate-900/10 ring-1 ring-slate-900/5 dark:border-slate-600 dark:bg-slate-900 dark:shadow-black/30 dark:ring-white/5">
          {voucherNavItems.map((item, index) => {
            const isSelected = selected === item.name;
            return (
              <label
                key={index}
                className="flex items-center gap-3 px-3 py-3 rounded-md cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-800"
              >
                <input
                  type="radio"
                  name="voucher"
                  checked={isSelected}
                  onChange={() => handleSelect(item)}
                  className="accent-primary"
                />
                <div
                  className={`flex items-center gap-2 ${
                    isSelected ? "text-primary font-medium" : "text-gray-700 dark:text-slate-300"
                  }`}
                >
                  {item.name}
                </div>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
};
