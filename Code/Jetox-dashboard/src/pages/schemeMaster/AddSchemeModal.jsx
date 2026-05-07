import React, { useState, useEffect } from "react";
import { CommonModal, InputField, CommonDropdown, Button } from "../../components/ui/CommanUI";
import { DatePicker } from "antd";
import dayjs from "dayjs";

/**
 * AddSchemeModal Component
 * Unified modal for adding and editing schemes.
 */
const AddSchemeModal = ({ open, onClose, scheme, mode = "add", onSuccess }) => {
  const isView = mode === "view";
  const formId = "add-scheme-form";
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

  useEffect(() => {
    if (scheme && (mode === "edit" || mode === "view")) {
      setForm({
        name: scheme["Scheme Name"] || "",
        description: scheme["Scheme Description"] || "Enjoy instant cashback on select agri-products this monsoon—...",
        type: scheme["Type"] || "",
        targetAudience: scheme["Target Audience"] || "",
        applicable: scheme["Applied Products"] || "",
        offerDetails: scheme["Offer Name"] || "",
        startDate: scheme["Start Date"] ? dayjs(scheme["Start Date"], "DD MMMM, YYYY") : null,
        endDate: scheme["End Date"] ? dayjs(scheme["End Date"], "DD MMMM, YYYY") : null,
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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isView) return;
    onSuccess({
      id: scheme?.id || Date.now(),
      "Scheme Name": form.name,
      "Offer Name": form.offerDetails,
      ...form
    });
  };

  return (
    <CommonModal 
      open={open} 
      onClose={onClose} 
      title={mode === "add" ? "Add Scheme" : isView ? "View Scheme" : "Edit Scheme"} 
      width="min(92vw, 520px)"
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
        ) : ([
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
            type="submit"
            form={formId}
            className="min-h-8! rounded-md px-3.5! py-2! text-sm! font-semibold whitespace-nowrap sm:min-h-9! sm:px-4! sm:py-2! sm:text-sm!"
          />,
        ])
      }
    >
      <form id={formId} onSubmit={handleSubmit} className="flex min-w-0 flex-col gap-2.5 sm:gap-3.5">
        
        {/* Section 1: Description */}
        <div className="flex flex-col gap-1.5 sm:gap-2">
          <h3 className="text-xs font-bold text-dark sm:text-base">Description</h3>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-x-3 sm:gap-y-2">
            <InputField 
              label="Scheme Name" 
              placeholder="Monsoon Cashback" 
              value={form.name}
              onChange={(e) => setForm({...form, name: e.target.value})}
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
              onChange={(e) => setForm({...form, description: e.target.value})}
              title={form.description || "Scheme Description"}
              readOnly={isView}
              dense
              className="gap-0!"
              inputClassName="text-[12px]! placeholder:text-[12px]! sm:text-[13px]!"
              labelClassName="!mb-0.5 !text-[11px] sm:!text-xs"
            />
          </div>
        </div>

        {/* Section 2: Scheme Details */}
        <div className="flex flex-col gap-1.5 sm:gap-2">
          <h3 className="text-xs font-bold text-dark sm:text-base">Scheme Details</h3>
          <div className={`grid grid-cols-1 gap-x-3 gap-y-2 sm:grid-cols-2 sm:gap-x-4 sm:gap-y-2.5 ${isView ? "pointer-events-none opacity-90" : ""}`}>
            <CommonDropdown 
              label="Scheme Type"
              addNavigateTo="/dashboard/scheme-master"
              placeholder="Discount / Cashback / Combo Offer Etc."
              options={[{ label: "Cashback", value: "cashback" }]}
              value={form.type}
              onChange={(v) => setForm({...form, type: v})}
              formCompact
              compactValue
            />
            <CommonDropdown 
               label="Target audience"
               addNavigateTo="/dashboard/scheme-master"
               placeholder="Dealers / Distributors / Farmers Etc."
               options={[{ label: "Farmer", value: "farmer" }]}
               value={form.targetAudience}
               onChange={(v) => setForm({...form, targetAudience: v})}
               formCompact
               compactValue
            />
            <CommonDropdown 
               label="Applicable"
               addNavigateTo="/dashboard/scheme-master"
               placeholder="Group / Category / Product"
               options={[{ label: "All Products", value: "all" }]}
               value={form.applicable}
               onChange={(v) => setForm({...form, applicable: v})}
               formCompact
               compactValue
            />
            <CommonDropdown 
               label="Offer Details"
               addNavigateTo="/dashboard/scheme-master"
               placeholder="20% Off / Buy 2 Get 1 Free / ₹500 Cashback Etc."
               options={[{ label: "Buy 2 Get 1 Free", value: "b2g1" }]}
               value={form.offerDetails}
               onChange={(v) => setForm({...form, offerDetails: v})}
               formCompact
               compactValue
            />
          </div>
        </div>

        {/* Section 3: Scheme Date */}
        <div className="flex flex-col gap-1.5 sm:gap-2">
          <h3 className="text-xs font-bold text-dark sm:text-base">Scheme Date</h3>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-x-3 sm:gap-y-2">
            <div className="flex flex-col gap-1">
               <label className="text-[11px] font-bold uppercase tracking-tight text-gray-500 dark:text-slate-400 sm:text-xs">Start Date</label>
               <DatePicker 
                  placeholder="01 July, 2025"
                  className="h-9! rounded-md border-gray-100 px-2.5 py-0 text-[12px] hover:border-primary focus:border-primary sm:h-9! sm:rounded-md sm:text-[13px] [&_.ant-picker-input>input]:h-full [&_.ant-picker-input>input]:text-[12px] sm:[&_.ant-picker-input>input]:text-[13px] [&_.ant-picker-input>input]:leading-snug"
                  value={form.startDate}
                  onChange={(d) => setForm({...form, startDate: d})}
                  format="DD MMMM, YYYY"
                  disabled={isView}
               />
            </div>
            <div className="flex flex-col gap-1">
               <label className="text-[11px] font-bold uppercase tracking-tight text-gray-500 dark:text-slate-400 sm:text-xs">End Date</label>
               <DatePicker 
                  placeholder="31 July, 2025"
                  className="h-9! rounded-md border-gray-100 px-2.5 py-0 text-[12px] hover:border-primary focus:border-primary sm:h-9! sm:rounded-md sm:text-[13px] [&_.ant-picker-input>input]:h-full [&_.ant-picker-input>input]:text-[12px] sm:[&_.ant-picker-input>input]:text-[13px] [&_.ant-picker-input>input]:leading-snug"
                  value={form.endDate}
                  onChange={(d) => setForm({...form, endDate: d})}
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
