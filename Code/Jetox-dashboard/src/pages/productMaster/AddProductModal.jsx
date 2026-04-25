import { useState, useEffect, useCallback } from "react";
import { productsApi } from "../../services/api";
import toast from "react-hot-toast";
import { getApiErrorMessage } from "../../utils/apiError";
import dayjs from "dayjs";
import {
  CommonModal,
  InputField,
  CommonDropdown,
  Button,
  FormSection,
} from "../../components/ui/CommanUI";
import { DatePicker } from "antd";
import {
  createEmptyProductForm,
  mapApiProductToForm,
  mergeDropdownOption,
} from "../../utils/productMappers";

function parseUnits(v) {
  const n = Number(v);
  if (Number.isFinite(n) && n > 0) return n;
  const map = { kg: 1, ltr: 2, gm: 3, ml: 4 };
  return map[String(v).toLowerCase()] ?? 1;
}

const slugCategory = (name) => {
  const s = String(name).trim().toLowerCase().replace(/\s+/g, "-");
  return s || `cat-${Date.now()}`;
};

const DEFAULT_CATEGORY_OPTIONS = [
  { value: "cat1", label: "Category 1" },
  { value: "cat2", label: "Category 2" },
];
const DEFAULT_GROUP_OPTIONS = [
  { value: "grp1", label: "Group 1" },
  { value: "grp2", label: "Group 2" },
];

const AddProductModal = ({
  open,
  onClose,
  onSaved,
  mode = "create",
  product = null,
  onSwitchToEdit,
}) => {
  const [saving, setSaving] = useState(false);
  const [categoryOptions, setCategoryOptions] = useState(DEFAULT_CATEGORY_OPTIONS);
  const [groupOptions, setGroupOptions] = useState(DEFAULT_GROUP_OPTIONS);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [form, setForm] = useState(() => createEmptyProductForm());

  const isView = mode === "view";
  const isReadOnly = isView;

  useEffect(() => {
    if (!open) return;
    if (!product) {
      setForm(createEmptyProductForm());
      setCategoryOptions(DEFAULT_CATEGORY_OPTIONS);
      setGroupOptions(DEFAULT_GROUP_OPTIONS);
      return;
    }
    const next = mapApiProductToForm(product);
    setForm(next);
    setCategoryOptions((prev) =>
      mergeDropdownOption(prev, next.category, next.category)
    );
    setGroupOptions((prev) =>
      mergeDropdownOption(prev, next.group, next.group)
    );
  }, [open, product]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const resetCategoryQuickAdd = useCallback(() => setNewCategoryName(""), []);

  const submitNewCategory = useCallback(
    (closeModal) => {
      const name = String(newCategoryName || "").trim();
      if (!name) {
        toast.error("Enter a category name");
        return;
      }
      const value = slugCategory(name);
      setCategoryOptions((opts) => {
        if (opts.some((o) => o.value === value || o.label === name)) return opts;
        return [...opts, { value, label: name }];
      });
      setForm((f) => ({ ...f, category: value }));
      resetCategoryQuickAdd();
      closeModal?.();
    },
    [newCategoryName, resetCategoryQuickAdd]
  );

  useEffect(() => {
    const q = parseFloat(String(form.qty));
    const r = parseFloat(String(form.rate));
    if (!Number.isFinite(q) || !Number.isFinite(r)) return;
    const next = String(q * r);
    setForm((p) => (p.amount === next ? p : { ...p, amount: next }));
  }, [form.qty, form.rate]);

  const handleSave = async () => {
    if (isReadOnly) return;
    if (!String(form.productName || "").trim()) {
      toast.error("Product name is required");
      return;
    }
    if (!String(form.category || "").trim()) {
      toast.error("Category is required");
      return;
    }
    if (!String(form.group || "").trim()) {
      toast.error("Group is required");
      return;
    }
    const billingRatePerUnit = parseFloat(String(form.billingRate));
    if (!Number.isFinite(billingRatePerUnit)) {
      toast.error("Billing rate per unit is required");
      return;
    }
    const where =
      [form.whereFrom, form.whereTo].filter(Boolean).length === 2
        ? `${form.whereFrom} = ${form.whereTo}`
        : "";
    const qty = parseFloat(String(form.qty));
    const rate = parseFloat(String(form.rate));
    const amountNum = parseFloat(String(form.amount));
    const payload = {
      productName: String(form.productName).trim(),
      category: String(form.category).trim(),
      group: String(form.group).trim(),
      units: parseUnits(form.units),
      billingRatePerUnit,
      alternateUnits: form.alternateUnits || undefined,
      packingStyle: form.packagingType || form.packingStyle || undefined,
      where: where || undefined,
      mrpPerUnit: form.mrp ? String(form.mrp) : undefined,
      gstRate: form.gstRate || undefined,
      hsnCode: form.hsnCode ? String(form.hsnCode).trim() : undefined,
      productDescription: form.productDescription
        ? String(form.productDescription).trim()
        : undefined,
      packagingType: form.packagingType
        ? String(form.packagingType).trim()
        : undefined,
      defaultPackSize: form.defaultPackSize
        ? String(form.defaultPackSize).trim()
        : undefined,
      batchNo: form.batchNo || undefined,
      mfgDt: form.mfgDate
        ? dayjs.isDayjs(form.mfgDate)
          ? form.mfgDate.toISOString()
          : dayjs(form.mfgDate).toISOString()
        : undefined,
      expDt: form.expDate
        ? dayjs.isDayjs(form.expDate)
          ? form.expDate.toISOString()
          : dayjs(form.expDate).toISOString()
        : undefined,
      quantity: Number.isFinite(qty) ? qty : undefined,
      rate: Number.isFinite(rate) ? rate : undefined,
      amout: Number.isFinite(amountNum) ? amountNum : undefined,
      stockQuantity: Boolean(form.stockEnabled),
      minimumReorderLevel: parseFloat(String(form.minReorderLevel)) || undefined,
    };
    const id = product?._id || product?.id;
    const isEdit = mode === "edit" && id;

    setSaving(true);
    try {
      if (isEdit) {
        await productsApi.update(id, payload);
        toast.success("Product updated");
      } else {
        await productsApi.create(payload);
        toast.success("Product saved");
      }
      onSaved?.();
      onClose?.();
    } catch (e) {
      toast.error(getApiErrorMessage(e, "Save failed"));
    } finally {
      setSaving(false);
    }
  };

  const modalTitle =
    mode === "view"
      ? "View product"
      : mode === "edit"
        ? "Edit product"
        : "Add product";

  const footerActions =
    mode === "view"
      ? [
          <Button
            key="close"
            label="Close"
            variant="outline"
            size="sm"
            onClick={onClose}
            className="!min-h-8 !py-1.5 text-[13px]"
          />,
          <Button
            key="edit"
            label="Edit"
            variant="primary"
            size="sm"
            onClick={() => onSwitchToEdit?.()}
            className="min-w-[5.5rem] !min-h-8 !py-1.5 text-[13px]"
          />,
        ]
      : [
          <Button
            key="cancel"
            label="Cancel"
            variant="outline"
            size="sm"
            onClick={onClose}
            className="!min-h-8 !py-1.5 text-[13px]"
          />,
          <Button
            key="save"
            label={saving ? "Saving…" : "Save"}
            variant="primary"
            size="sm"
            onClick={handleSave}
            className="min-w-[5.5rem] !min-h-8 !py-1.5 text-[13px]"
            disabled={saving}
          />,
        ];

  return (
    <CommonModal
      open={open}
      onClose={onClose}
      title={modalTitle}
      width="1040px"
      bodyClassName="!pt-2.5 !pb-10 sm:!px-4 sm:!pb-12"
      footer={footerActions}
    >
      <div className="flex flex-col gap-3">
        <FormSection title="Product" dense>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <InputField
              readOnly={isReadOnly}
              label="Product name"
              name="productName"
              value={form.productName}
              onChange={handleChange}
              placeholder="Name of product"
            />

            <CommonDropdown
              label="Category"
              searchable
              searchPlaceholder="Search categories…"
              value={form.category}
              onChange={(v) => setForm((f) => ({ ...f, category: v }))}
              placeholder="Select category"
              options={categoryOptions}
              disabled={isReadOnly}
              hideAdd={isReadOnly}
              closeOnAdd={false}
              renderAddModal={({ open: catModalOpen, onClose: closeCatModal }) => (
                <CommonModal
                  open={catModalOpen}
                  onClose={() => {
                    resetCategoryQuickAdd();
                    closeCatModal();
                  }}
                  title="New category"
                  size="md"
                  footer={[
                    <Button
                      key="cancel"
                      label="Cancel"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        resetCategoryQuickAdd();
                        closeCatModal();
                      }}
                    />,
                    <Button
                      key="add"
                      label="Add"
                      variant="primary"
                      size="sm"
                      onClick={() => submitNewCategory(closeCatModal)}
                    />,
                  ]}
                >
                  <InputField
                    label="Category name"
                    name="newCategoryName"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="e.g. Organic inputs"
                  />
                </CommonModal>
              )}
            />

            <CommonDropdown
              label="Group"
              value={form.group}
              onChange={(v) => setForm((f) => ({ ...f, group: v }))}
              placeholder="Select or create"
              options={groupOptions}
              disabled={isReadOnly}
              hideAdd={isReadOnly}
              addNavigateTo="/dashboard/product"
            />

            <InputField
              readOnly={isReadOnly}
              label="Billing rate per unit"
              name="billingRate"
              value={form.billingRate}
              onChange={handleChange}
              placeholder="Amount"
            />

            <InputField
              readOnly={isReadOnly}
              label="MRP per unit"
              name="mrp"
              value={form.mrp}
              onChange={handleChange}
              placeholder="MRP"
            />

            <CommonDropdown
              label="GST rate"
              value={form.gstRate}
              onChange={(v) => setForm((f) => ({ ...f, gstRate: v }))}
              placeholder="Select or create"
              options={[
                { value: "5", label: "5%" },
                { value: "12", label: "12%" },
                { value: "18", label: "18%" },
              ]}
              disabled={isReadOnly}
              hideAdd={isReadOnly}
              addNavigateTo="/dashboard/product"
            />

            <InputField
              readOnly={isReadOnly}
              label="HSN Code"
              name="hsnCode"
              value={form.hsnCode}
              onChange={handleChange}
              placeholder="e.g. 31021000"
            />

            <CommonDropdown
              label="Units"
              value={form.units}
              onChange={(v) => setForm((f) => ({ ...f, units: v }))}
              placeholder="e.g. Ltr, Kg, Nos"
              options={[
                { value: "kg", label: "KG" },
                { value: "ltr", label: "Litre" },
              ]}
              disabled={isReadOnly}
              hideAdd={isReadOnly}
              addNavigateTo="/dashboard/product"
            />

            <CommonDropdown
              label="Alternate units"
              value={form.alternateUnits}
              onChange={(v) => setForm((f) => ({ ...f, alternateUnits: v }))}
              placeholder="Alternate unit"
              options={[
                { value: "gm", label: "Gram" },
                { value: "ml", label: "ML" },
              ]}
              disabled={isReadOnly}
              hideAdd={isReadOnly}
              addNavigateTo="/dashboard/product"
            />

            <CommonDropdown
              label="Packing style"
              value={form.packingStyle}
              onChange={(v) => setForm((f) => ({ ...f, packingStyle: v }))}
              placeholder="Select or create"
              options={[
                { value: "box", label: "Box" },
                { value: "bag", label: "Bag" },
              ]}
              disabled={isReadOnly}
              hideAdd={isReadOnly}
              addNavigateTo="/dashboard/product"
            />

            <CommonDropdown
              label="Packaging"
              value={form.packagingType}
              onChange={(v) => setForm((f) => ({ ...f, packagingType: v }))}
              placeholder="Bag, box, etc."
              options={[
                { value: "Bag", label: "Bag" },
                { value: "Box", label: "Box" },
                { value: "Carton", label: "Carton" },
                { value: "Drum", label: "Drum" },
                { value: "Loose", label: "Loose" },
              ]}
              disabled={isReadOnly}
              hideAdd={isReadOnly}
              addNavigateTo="/dashboard/product"
            />

            <InputField
              readOnly={isReadOnly}
              label="Default pack size"
              name="defaultPackSize"
              value={form.defaultPackSize}
              onChange={handleChange}
              placeholder="e.g. 50 kg / 12 pcs"
            />
          </div>

          <div className="flex flex-wrap items-end gap-2 sm:gap-3 mt-1 pt-2.5 border-t border-light-border/80">
            <span className="text-[12px] font-medium text-slate-600 leading-none pb-2.5 shrink-0 w-full sm:w-auto sm:min-w-[2.75rem]">
              Where
            </span>
            <div className="flex-1 min-w-[7rem] basis-[calc(50%-1.5rem)] sm:basis-0 sm:min-w-[8rem]">
              <InputField
                readOnly={isReadOnly}
                label=""
                name="whereFrom"
                value={form.whereFrom}
                onChange={handleChange}
                placeholder="From"
              />
            </div>
            <span
              className="hidden sm:flex items-center justify-center text-slate-500 text-[13px] font-semibold leading-none pb-2.5 w-6 shrink-0"
              aria-hidden
            >
              =
            </span>
            <div className="flex-1 min-w-[7rem] basis-[calc(50%-1.5rem)] sm:basis-0 sm:min-w-[8rem] sm:flex-1">
              <InputField
                readOnly={isReadOnly}
                label=""
                name="whereTo"
                value={form.whereTo}
                onChange={handleChange}
                placeholder="To"
              />
            </div>
          </div>

          <InputField
            readOnly={isReadOnly}
            label="Product description"
            name="productDescription"
            value={form.productDescription}
            onChange={handleChange}
            multiline
            rows={2}
            placeholder="Short description (specs, grade, notes)"
            inputClassName="resize-y min-h-[4rem] max-h-32 leading-snug"
          />
        </FormSection>

        <FormSection title="Opening balance" dense>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <InputField
              readOnly={isReadOnly}
              label="Batch no."
              name="batchNo"
              value={form.batchNo}
              onChange={handleChange}
            />

            <div className="flex flex-col min-w-0">
              <label className="text-[12px] font-medium text-slate-600 mb-1 leading-tight">
                Mfg date
              </label>
              <DatePicker
                className="w-full"
                disabled={isReadOnly}
                value={form.mfgDate ? dayjs(form.mfgDate) : null}
                onChange={(d) => setForm((f) => ({ ...f, mfgDate: d }))}
              />
            </div>

            <div className="flex flex-col min-w-0">
              <label className="text-[12px] font-medium text-slate-600 mb-1 leading-tight">
                Exp date
              </label>
              <DatePicker
                className="w-full"
                disabled={isReadOnly}
                value={form.expDate ? dayjs(form.expDate) : null}
                onChange={(d) => setForm((f) => ({ ...f, expDate: d }))}
              />
            </div>

            <InputField
              readOnly={isReadOnly}
              label="Quantity"
              name="qty"
              value={form.qty}
              onChange={handleChange}
              placeholder="Qty"
            />

            <InputField
              readOnly={isReadOnly}
              label="Rate"
              name="rate"
              value={form.rate}
              onChange={handleChange}
              placeholder="Rate"
            />

            <InputField
              readOnly={isReadOnly}
              label="Amount"
              name="amount"
              value={form.amount}
              onChange={handleChange}
              placeholder="Amount"
            />
          </div>
        </FormSection>

        <FormSection title="Stock" dense>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-end">
            <label
              className={`inline-flex items-center gap-2.5 select-none pb-0.5 ${isReadOnly ? "cursor-default opacity-80" : "cursor-pointer"}`}
            >
              <input
                type="checkbox"
                disabled={isReadOnly}
                checked={form.stockEnabled}
                onChange={() =>
                  setForm((p) => ({ ...p, stockEnabled: !p.stockEnabled }))
                }
                className="sr-only peer"
              />
              <span className="relative w-11 h-6 shrink-0 rounded-full bg-gray-300 transition-colors peer-checked:bg-primary after:content-[''] after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:after:translate-x-5" />
              <span className="text-[12px] font-medium text-slate-600">
                Track stock
              </span>
              <span className="text-[12px] font-semibold text-primary tabular-nums">
                {form.stockEnabled ? "On" : "Off"}
              </span>
            </label>

            <InputField
              readOnly={isReadOnly}
              label="Minimum reorder level"
              name="minReorderLevel"
              value={form.minReorderLevel}
              onChange={handleChange}
              placeholder="50"
            />
          </div>
        </FormSection>
      </div>
    </CommonModal>
  );
};

export default AddProductModal;
