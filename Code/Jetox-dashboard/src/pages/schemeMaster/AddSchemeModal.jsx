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
      width="1000px"
    >
      <form onSubmit={handleSubmit} className="ds-modal-body-stack">
        
        {/* Section 1: Description */}
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-bold text-dark mb-1">Description</h3>
          <div className="ds-form-grid-2">
            <InputField 
              label="Scheme Name" 
              placeholder="Monsoon Cashback" 
              value={form.name}
              onChange={(e) => setForm({...form, name: e.target.value})}
              readOnly={isView}
            />
            <InputField 
              label="Scheme Description" 
              placeholder="Enter scheme details..." 
              value={form.description}
              onChange={(e) => setForm({...form, description: e.target.value})}
              readOnly={isView}
            />
          </div>
        </div>

        {/* Section 2: Scheme Details */}
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-bold text-dark mb-1">Scheme Details</h3>
          <div className={`grid grid-cols-2 gap-x-6 gap-y-4 ${isView ? "pointer-events-none opacity-90" : ""}`}>
            <CommonDropdown 
              label="Scheme Type"
              addNavigateTo="/dashboard/scheme-master"
              placeholder="Discount / Cashback / Combo Offer Etc."
              options={[{ label: "Cashback", value: "cashback" }]}
              value={form.type}
              onChange={(v) => setForm({...form, type: v})}
            />
            <CommonDropdown 
               label="Target audience"
               addNavigateTo="/dashboard/scheme-master"
               placeholder="Dealers / Distributors / Farmers Etc."
               options={[{ label: "Farmer", value: "farmer" }]}
               value={form.targetAudience}
               onChange={(v) => setForm({...form, targetAudience: v})}
            />
            <CommonDropdown 
               label="Applicable"
               addNavigateTo="/dashboard/scheme-master"
               placeholder="Group / Category / Product"
               options={[{ label: "All Products", value: "all" }]}
               value={form.applicable}
               onChange={(v) => setForm({...form, applicable: v})}
            />
            <CommonDropdown 
               label="Offer Details"
               addNavigateTo="/dashboard/scheme-master"
               placeholder="20% Off / Buy 2 Get 1 Free / ₹500 Cashback Etc."
               options={[{ label: "Buy 2 Get 1 Free", value: "b2g1" }]}
               value={form.offerDetails}
               onChange={(v) => setForm({...form, offerDetails: v})}
            />
          </div>
        </div>

        {/* Section 3: Scheme Date */}
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-bold text-dark mb-1">Scheme Date</h3>
          <div className="ds-form-grid-2">
            <div className="flex flex-col gap-2">
               <label className="text-xs font-bold text-gray-500 uppercase tracking-tight">Start Date</label>
               <DatePicker 
                  placeholder="01 July, 2025"
                  className="h-11 rounded-xl border-gray-100 hover:border-primary focus:border-primary"
                  value={form.startDate}
                  onChange={(d) => setForm({...form, startDate: d})}
                  format="DD MMMM, YYYY"
                  disabled={isView}
               />
            </div>
            <div className="flex flex-col gap-2">
               <label className="text-xs font-bold text-gray-500 uppercase tracking-tight">End Date</label>
               <DatePicker 
                  placeholder="31 July, 2025"
                  className="h-11 rounded-xl border-gray-100 hover:border-primary focus:border-primary"
                  value={form.endDate}
                  onChange={(d) => setForm({...form, endDate: d})}
                  format="DD MMMM, YYYY"
                  disabled={isView}
               />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 mt-4">
          {isView ? (
            <Button 
              label="Close" 
              variant="outline" 
              onClick={onClose} 
              className="w-40 py-3 rounded-xl border border-gray-100 font-bold"
            />
          ) : (
            <>
              <Button 
                label="Cancel" 
                variant="outline" 
                onClick={onClose} 
                className="w-40 py-3 rounded-xl border border-gray-100 font-bold"
              />
              <Button 
                label={mode === "add" ? "Add Scheme" : "Save Changes"} 
                variant="primary" 
                type="submit"
                className="w-48 py-3 rounded-xl font-bold"
              />
            </>
          )}
        </div>
      </form>
    </CommonModal>
  );
};

export default AddSchemeModal;
