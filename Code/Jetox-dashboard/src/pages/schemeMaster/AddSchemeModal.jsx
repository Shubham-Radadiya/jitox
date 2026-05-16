import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { CommonModal, InputField, CommonDropdown, Button } from "../../components/ui/CommanUI";
import { DatePicker } from "antd";
import dayjs from "dayjs";
import toast from "react-hot-toast";
import SchemeQuickAddOptionModal from "./SchemeQuickAddOptionModal";
import { usePurchaseFormMeta } from "../../hooks/usePurchaseFormMeta";
import { getApiErrorMessage } from "../../utils/apiError";
import {
  DEFAULT_SCHEME_TYPE_OPTIONS,
  DEFAULT_TARGET_AUDIENCE_OPTIONS,
  DEFAULT_OFFER_DETAILS_OPTIONS,
  schemeOptionFromLabel,
  mergeSchemeSelectOption,
} from "./schemeFormDropdownOptions";
import {
  mergeApplicableDefaultsAndProducts,
  stripJitoxDemoProductNamePrefix,
} from "./schemeProductDropdownUtils";
import {
  SCHEME_FORM_PERSIST_KEYS,
  mergeDefaultsWithPersistedCustom,
  appendPersistedSchemeOption,
} from "./schemeFormPersistedOptions";

/**
 * AddSchemeModal Component
 * Unified modal for adding and editing schemes.
 */
const AddSchemeModal = ({ open, onClose, scheme, mode = "add", onSuccess }) => {
  const isView = mode === "view";
  const formId = "add-scheme-form";
  const navigate = useNavigate();

  const {
    data: purchaseMeta,
    isError: purchaseMetaError,
    error: purchaseMetaErrorObj,
  } = usePurchaseFormMeta({ enabled: open });
  const [form, setForm] = useState({
    name: "",
    description: "",
    type: "",
    targetAudience: "",
    applicable: "",
    offerDetails: "",
    startDate: null,
    endDate: null,
  });

  const [schemeTypeOptions, setSchemeTypeOptions] = useState(() =>
    mergeDefaultsWithPersistedCustom(
      DEFAULT_SCHEME_TYPE_OPTIONS,
      SCHEME_FORM_PERSIST_KEYS.schemeTypes
    )
  );
  const [targetAudienceOptions, setTargetAudienceOptions] = useState(() =>
    mergeDefaultsWithPersistedCustom(
      DEFAULT_TARGET_AUDIENCE_OPTIONS,
      SCHEME_FORM_PERSIST_KEYS.targetAudiences
    )
  );
  const [applicableOptions, setApplicableOptions] = useState(() =>
    mergeApplicableDefaultsAndProducts([])
  );
  const [offerDetailsOptions, setOfferDetailsOptions] = useState(() =>
    mergeDefaultsWithPersistedCustom(
      DEFAULT_OFFER_DETAILS_OPTIONS,
      SCHEME_FORM_PERSIST_KEYS.offerDetails
    )
  );

  const schemeTypeOptionsRef = useRef(schemeTypeOptions);
  const targetAudienceOptionsRef = useRef(targetAudienceOptions);
  const offerDetailsOptionsRef = useRef(offerDetailsOptions);

  useEffect(() => {
    schemeTypeOptionsRef.current = schemeTypeOptions;
  }, [schemeTypeOptions]);
  useEffect(() => {
    targetAudienceOptionsRef.current = targetAudienceOptions;
  }, [targetAudienceOptions]);
  useEffect(() => {
    offerDetailsOptionsRef.current = offerDetailsOptions;
  }, [offerDetailsOptions]);

  const ensureOptionInList = useCallback((prev, raw) => {
    const s = String(raw ?? "").trim();
    if (!s) return prev;
    if (prev.some((o) => String(o.value).toLowerCase() === s.toLowerCase()))
      return prev;
    return [...prev, { label: s, value: s }];
  }, []);

  useEffect(() => {
    if (!open) return;
    if (!scheme && mode === "add") {
      setSchemeTypeOptions(
        mergeDefaultsWithPersistedCustom(
          DEFAULT_SCHEME_TYPE_OPTIONS,
          SCHEME_FORM_PERSIST_KEYS.schemeTypes
        )
      );
      setTargetAudienceOptions(
        mergeDefaultsWithPersistedCustom(
          DEFAULT_TARGET_AUDIENCE_OPTIONS,
          SCHEME_FORM_PERSIST_KEYS.targetAudiences
        )
      );
      setOfferDetailsOptions(
        mergeDefaultsWithPersistedCustom(
          DEFAULT_OFFER_DETAILS_OPTIONS,
          SCHEME_FORM_PERSIST_KEYS.offerDetails
        )
      );
    }
  }, [open, scheme, mode]);

  useEffect(() => {
    if (!open) return;
    const baseApplicable = mergeApplicableDefaultsAndProducts(
      purchaseMeta?.products
    );
    if (!scheme && mode === "add") {
      setApplicableOptions(baseApplicable);
    } else if (scheme && (mode === "edit" || mode === "view")) {
      setApplicableOptions(
        ensureOptionInList(
          baseApplicable,
          stripJitoxDemoProductNamePrefix(scheme["Applied Products"])
        )
      );
    }
  }, [open, scheme, mode, purchaseMeta?.products, ensureOptionInList]);

  useEffect(() => {
    if (!open || !purchaseMetaError || !purchaseMetaErrorObj) return;
    toast.error(
      getApiErrorMessage(
        purchaseMetaErrorObj,
        "Could not load product list for Applicable"
      )
    );
  }, [open, purchaseMetaError, purchaseMetaErrorObj]);

  useEffect(() => {
    if (!open || !scheme || (mode !== "edit" && mode !== "view")) return;
    setSchemeTypeOptions(
      ensureOptionInList(
        mergeDefaultsWithPersistedCustom(
          DEFAULT_SCHEME_TYPE_OPTIONS,
          SCHEME_FORM_PERSIST_KEYS.schemeTypes
        ),
        scheme["Type"]
      )
    );
    setTargetAudienceOptions(
      ensureOptionInList(
        mergeDefaultsWithPersistedCustom(
          DEFAULT_TARGET_AUDIENCE_OPTIONS,
          SCHEME_FORM_PERSIST_KEYS.targetAudiences
        ),
        scheme["Target Audience"]
      )
    );
    setOfferDetailsOptions(
      ensureOptionInList(
        mergeDefaultsWithPersistedCustom(
          DEFAULT_OFFER_DETAILS_OPTIONS,
          SCHEME_FORM_PERSIST_KEYS.offerDetails
        ),
        scheme["Offer Name"]
      )
    );
  }, [open, scheme, mode, ensureOptionInList]);

  useEffect(() => {
    if (scheme && (mode === "edit" || mode === "view")) {
      setForm({
        name: scheme["Scheme Name"] || "",
        description: scheme["Scheme Description"] ?? "",
        type: scheme["Type"] || "",
        targetAudience: scheme["Target Audience"] || "",
        applicable: stripJitoxDemoProductNamePrefix(
          scheme["Applied Products"] || ""
        ),
        offerDetails: scheme["Offer Name"] || "",
        startDate: scheme["Start Date"]
          ? dayjs(scheme["Start Date"], "DD MMMM, YYYY")
          : null,
        endDate: scheme["End Date"]
          ? dayjs(scheme["End Date"], "DD MMMM, YYYY")
          : null,
      });
    } else {
      setForm({
        name: "",
        description: "",
        type: "",
        targetAudience: "",
        applicable: "",
        offerDetails: "",
        startDate: null,
        endDate: null,
      });
    }
  }, [scheme, mode, open]);

  const buildPayload = () => ({
    id: scheme?.id || Date.now(),
    "Scheme Name": form.name,
    "Offer Name": form.offerDetails,
    ...form,
  });

  const runSubmit = () => {
    if (isView) return;
    onSuccess(buildPayload());
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    runSubmit();
  };

  const addSchemeType = useCallback((label) => {
    const opt = schemeOptionFromLabel(label);
    if (!opt) {
      toast.error("Enter a name");
      return;
    }
    const { next, value, isNew } = mergeSchemeSelectOption(
      schemeTypeOptionsRef.current,
      opt
    );
    setSchemeTypeOptions(next);
    setForm((f) => ({ ...f, type: value }));
    if (isNew) {
      appendPersistedSchemeOption(
        SCHEME_FORM_PERSIST_KEYS.schemeTypes,
        opt,
        DEFAULT_SCHEME_TYPE_OPTIONS
      );
    }
    toast.success(isNew ? "Scheme type added" : "Scheme type selected");
  }, []);

  const addTargetAudience = useCallback((label) => {
    const opt = schemeOptionFromLabel(label);
    if (!opt) {
      toast.error("Enter a name");
      return;
    }
    const { next, value, isNew } = mergeSchemeSelectOption(
      targetAudienceOptionsRef.current,
      opt
    );
    setTargetAudienceOptions(next);
    setForm((f) => ({ ...f, targetAudience: value }));
    if (isNew) {
      appendPersistedSchemeOption(
        SCHEME_FORM_PERSIST_KEYS.targetAudiences,
        opt,
        DEFAULT_TARGET_AUDIENCE_OPTIONS
      );
    }
    toast.success(isNew ? "Audience added" : "Audience selected");
  }, []);

  const addOfferDetails = useCallback((label) => {
    const opt = schemeOptionFromLabel(label);
    if (!opt) {
      toast.error("Enter a name");
      return;
    }
    const { next, value, isNew } = mergeSchemeSelectOption(
      offerDetailsOptionsRef.current,
      opt
    );
    setOfferDetailsOptions(next);
    setForm((f) => ({ ...f, offerDetails: value }));
    if (isNew) {
      appendPersistedSchemeOption(
        SCHEME_FORM_PERSIST_KEYS.offerDetails,
        opt,
        DEFAULT_OFFER_DETAILS_OPTIONS
      );
    }
    toast.success(isNew ? "Offer added" : "Offer selected");
  }, []);

  return (
    <CommonModal
      open={open}
      onClose={onClose}
      title={mode === "add" ? "Add Scheme" : isView ? "View Scheme" : "Edit Scheme"}
      width="min(96vw, 720px)"
      className="max-h-[88vh] sm:max-h-[90vh]"
      headerClassName="!px-2.5 !py-2 sm:!px-4 sm:!py-2.5"
      titleClassName="!text-base sm:!text-lg"
      bodyClassName="!px-2.5 !pt-1.5 !pb-3 sm:!px-4 sm:!pt-3 sm:!pb-6"
      footerClassName="!px-2.5 !py-2 sm:!px-4 sm:!py-2.5"
      footer={
        isView ? (
          <Button
            label="Close"
            variant="outline"
            size="sm"
            onClick={onClose}
            className="min-h-8! rounded-md px-3.5! py-2! text-sm! font-semibold whitespace-nowrap sm:min-h-9! sm:px-4! sm:py-2! sm:text-sm!"
          />
        ) : (
          [
            <Button
              key="cancel"
              label="Cancel"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="min-h-8! rounded-md px-3.5! py-2! text-sm! font-semibold whitespace-nowrap sm:min-h-9! sm:px-4! sm:py-2! sm:text-sm!"
            />,
            <Button
              key="submit"
              label={mode === "add" ? "Add Scheme" : "Save Changes"}
              variant="primary"
              size="sm"
              type="button"
              onClick={runSubmit}
              className="min-h-8! rounded-md px-3.5! py-2! text-sm! font-semibold whitespace-nowrap sm:min-h-9! sm:px-4! sm:py-2! sm:text-sm!"
            />,
          ]
        )
      }
    >
      <form id={formId} onSubmit={handleSubmit} className="flex min-w-0 flex-col gap-2.5 sm:gap-3.5">
        <button type="submit" className="sr-only" tabIndex={-1} aria-hidden>
          Submit
        </button>

        <div className="flex flex-col gap-1.5 sm:gap-2">
          <h3 className="text-xs font-bold text-dark sm:text-base">Description</h3>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-x-3 sm:gap-y-2">
            <InputField
              label="Scheme Name"
              placeholder="Monsoon Cashback"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              title={form.name || "Scheme Name"}
              readOnly={isView}
              dense
              className="gap-0!"
              inputClassName="text-[12px]! placeholder:text-[12px]! sm:text-[13px]!"
              labelClassName="!mb-0.5 !text-[11px] sm:!text-xs"
            />
            <InputField
              label="Scheme Description"
              placeholder="Enter scheme details..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              title={form.description || "Scheme Description"}
              readOnly={isView}
              dense
              className="gap-0!"
              inputClassName="text-[12px]! placeholder:text-[12px]! sm:text-[13px]!"
              labelClassName="!mb-0.5 !text-[11px] sm:!text-xs"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5 sm:gap-2">
          <h3 className="text-xs font-bold text-dark sm:text-base">Scheme Details</h3>
          <div
            className={`grid grid-cols-1 gap-x-3 gap-y-2 sm:grid-cols-2 sm:gap-x-4 sm:gap-y-2.5 ${isView ? "pointer-events-none opacity-90" : ""}`}
          >
            <CommonDropdown
              label="Scheme Type"
              hideAdd={isView}
              menuPortal
              placeholder="Discount / Cashback / Combo Offer Etc."
              options={schemeTypeOptions}
              value={form.type}
              onChange={(v) => setForm({ ...form, type: v })}
              formCompact
              compactValue
              renderAddModal={({ open: addOpen, onClose: addClose }) => (
                <SchemeQuickAddOptionModal
                  open={addOpen}
                  onClose={addClose}
                  title="Add scheme type"
                  placeholder="e.g. Volume discount"
                  onConfirm={addSchemeType}
                />
              )}
            />
            <CommonDropdown
              label="Target audience"
              hideAdd={isView}
              menuPortal
              placeholder="Dealers / Distributors / Farmers Etc."
              options={targetAudienceOptions}
              value={form.targetAudience}
              onChange={(v) => setForm({ ...form, targetAudience: v })}
              formCompact
              compactValue
              renderAddModal={({ open: addOpen, onClose: addClose }) => (
                <SchemeQuickAddOptionModal
                  open={addOpen}
                  onClose={addClose}
                  title="Add target audience"
                  placeholder="e.g. Retail partner"
                  onConfirm={addTargetAudience}
                />
              )}
            />
            <CommonDropdown
              label="Applicable"
              hideAdd={isView}
              menuPortal
              searchable
              searchPlaceholder="Search scopes or products…"
              placeholder="All products or pick from product master"
              options={applicableOptions}
              value={form.applicable}
              onChange={(v) => setForm({ ...form, applicable: v })}
              formCompact
              compactValue
              onAddClick={() => {
                onClose();
                navigate("/dashboard/product");
              }}
            />
            <CommonDropdown
              label="Offer Details"
              hideAdd={isView}
              menuPortal
              placeholder="20% Off / Buy 2 Get 1 Free / ₹500 Cashback Etc."
              options={offerDetailsOptions}
              value={form.offerDetails}
              onChange={(v) => setForm({ ...form, offerDetails: v })}
              formCompact
              compactValue
              renderAddModal={({ open: addOpen, onClose: addClose }) => (
                <SchemeQuickAddOptionModal
                  open={addOpen}
                  onClose={addClose}
                  title="Add offer"
                  placeholder="e.g. Free delivery over ₹10k"
                  onConfirm={addOfferDetails}
                />
              )}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5 sm:gap-2">
          <h3 className="text-xs font-bold text-dark sm:text-base">Scheme Date</h3>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-x-3 sm:gap-y-2">
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold uppercase tracking-tight text-gray-500 dark:text-slate-400 sm:text-xs">
                Start Date
              </label>
              <DatePicker
                placeholder="01 July, 2025"
                className="h-9! rounded-md border-gray-100 px-2.5 py-0 text-[12px] hover:border-primary focus:border-primary sm:h-9! sm:rounded-md sm:text-[13px] [&_.ant-picker-input>input]:h-full [&_.ant-picker-input>input]:text-[12px] sm:[&_.ant-picker-input>input]:text-[13px] [&_.ant-picker-input>input]:leading-snug"
                value={form.startDate}
                onChange={(d) => setForm({ ...form, startDate: d })}
                format="DD MMMM, YYYY"
                disabled={isView}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold uppercase tracking-tight text-gray-500 dark:text-slate-400 sm:text-xs">
                End Date
              </label>
              <DatePicker
                placeholder="31 July, 2025"
                className="h-9! rounded-md border-gray-100 px-2.5 py-0 text-[12px] hover:border-primary focus:border-primary sm:h-9! sm:rounded-md sm:text-[13px] [&_.ant-picker-input>input]:h-full [&_.ant-picker-input>input]:text-[12px] sm:[&_.ant-picker-input>input]:text-[13px] [&_.ant-picker-input>input]:leading-snug"
                value={form.endDate}
                onChange={(d) => setForm({ ...form, endDate: d })}
                format="DD MMMM, YYYY"
                disabled={isView}
              />
            </div>
          </div>
        </div>
      </form>
    </CommonModal>
  );
};

export default AddSchemeModal;
