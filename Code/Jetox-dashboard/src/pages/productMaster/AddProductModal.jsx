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
import {
  mergeDefaultAndStoredExtras,
  persistFullOptions,
  readStoredExtras,
} from "../../utils/dropdownExtrasStorage";

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

const DEFAULT_GST_RATE_OPTIONS = [
  { value: "5", label: "5%" },
  { value: "12", label: "12%" },
  { value: "18", label: "18%" },
];

const DEFAULT_UNITS_OPTIONS = [
  { value: "kg", label: "KG" },
  { value: "ltr", label: "Litre" },
];

const DEFAULT_ALTERNATE_UNITS_OPTIONS = [
  { value: "gm", label: "Gram" },
  { value: "ml", label: "ML" },
];

const DEFAULT_PACKING_STYLE_OPTIONS = [
  { value: "box", label: "Box" },
  { value: "bag", label: "Bag" },
];

const DEFAULT_PACKAGING_OPTIONS = [
  { value: "Bag", label: "Bag" },
  { value: "Box", label: "Box" },
  { value: "Carton", label: "Carton" },
  { value: "Drum", label: "Drum" },
  { value: "Loose", label: "Loose" },
];

/** Persist user-added dropdown rows across modal opens (browser localStorage). */
const OPTION_KEYS = {
  category: "jitox_product_dropdown_extras_category_v1",
  group: "jitox_product_dropdown_extras_group_v1",
  gstRate: "jitox_product_dropdown_extras_gstRate_v1",
  units: "jitox_product_dropdown_extras_units_v1",
  alternateUnits: "jitox_product_dropdown_extras_alternateUnits_v1",
  packingStyle: "jitox_product_dropdown_extras_packingStyle_v1",
  packaging: "jitox_product_dropdown_extras_packaging_v1",
};

/** Green section titles — same font size as dense `FormSection`, bold forced. */
const ADD_PRODUCT_SECTION_TITLE_CLASS =
  "!font-bold !text-primary dark:!text-emerald-400";

/** Smaller **value** text only — keeps default control heights (`h-10`, paddings). */
const ADD_PRODUCT_VALUE_TEXT =
  "!text-[12px] !leading-snug !placeholder:text-[12px]";

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
  const [gstRateOptions, setGstRateOptions] = useState(DEFAULT_GST_RATE_OPTIONS);
  const [unitsOptions, setUnitsOptions] = useState(DEFAULT_UNITS_OPTIONS);
  const [alternateUnitsOptions, setAlternateUnitsOptions] = useState(
    DEFAULT_ALTERNATE_UNITS_OPTIONS
  );
  const [packingStyleOptions, setPackingStyleOptions] = useState(
    DEFAULT_PACKING_STYLE_OPTIONS
  );
  const [packagingOptions, setPackagingOptions] = useState(DEFAULT_PACKAGING_OPTIONS);

  const [newCategoryName, setNewCategoryName] = useState("");
  const [newGroupName, setNewGroupName] = useState("");
  const [newGstRateDraft, setNewGstRateDraft] = useState("");
  const [newUnitsName, setNewUnitsName] = useState("");
  const [newAlternateUnitsName, setNewAlternateUnitsName] = useState("");
  const [newPackingStyleName, setNewPackingStyleName] = useState("");
  const [newPackagingName, setNewPackagingName] = useState("");
  const [form, setForm] = useState(() => createEmptyProductForm());

  const isView = mode === "view";
  const isReadOnly = isView;

  useEffect(() => {
    if (!open) return;

    const categoryBase = mergeDefaultAndStoredExtras(
      DEFAULT_CATEGORY_OPTIONS,
      readStoredExtras(OPTION_KEYS.category)
    );
    const groupBase = mergeDefaultAndStoredExtras(
      DEFAULT_GROUP_OPTIONS,
      readStoredExtras(OPTION_KEYS.group)
    );
    const gstBase = mergeDefaultAndStoredExtras(
      DEFAULT_GST_RATE_OPTIONS,
      readStoredExtras(OPTION_KEYS.gstRate)
    );
    const unitsBase = mergeDefaultAndStoredExtras(
      DEFAULT_UNITS_OPTIONS,
      readStoredExtras(OPTION_KEYS.units)
    );
    const alternateBase = mergeDefaultAndStoredExtras(
      DEFAULT_ALTERNATE_UNITS_OPTIONS,
      readStoredExtras(OPTION_KEYS.alternateUnits)
    );
    const packingStyleBase = mergeDefaultAndStoredExtras(
      DEFAULT_PACKING_STYLE_OPTIONS,
      readStoredExtras(OPTION_KEYS.packingStyle)
    );
    const packagingBase = mergeDefaultAndStoredExtras(
      DEFAULT_PACKAGING_OPTIONS,
      readStoredExtras(OPTION_KEYS.packaging)
    );

    if (!product) {
      setForm(createEmptyProductForm());
      setCategoryOptions(categoryBase);
      setGroupOptions(groupBase);
      setGstRateOptions(gstBase);
      setUnitsOptions(unitsBase);
      setAlternateUnitsOptions(alternateBase);
      setPackingStyleOptions(packingStyleBase);
      setPackagingOptions(packagingBase);
      return;
    }

    const next = mapApiProductToForm(product);
    setForm(next);
    setCategoryOptions(
      mergeDropdownOption(categoryBase, next.category, next.category)
    );
    setGroupOptions(mergeDropdownOption(groupBase, next.group, next.group));
    setGstRateOptions(
      next.gstRate
        ? mergeDropdownOption(gstBase, next.gstRate, `${next.gstRate}%`)
        : gstBase
    );
    setUnitsOptions(
      mergeDropdownOption(unitsBase, next.units, next.units)
    );
    setAlternateUnitsOptions(
      mergeDropdownOption(alternateBase, next.alternateUnits, next.alternateUnits)
    );
    setPackingStyleOptions(
      mergeDropdownOption(
        packingStyleBase,
        next.packingStyle,
        next.packingStyle
      )
    );
    setPackagingOptions(
      mergeDropdownOption(packagingBase, next.packagingType, next.packagingType)
    );
  }, [open, product]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const resetCategoryQuickAdd = useCallback(() => setNewCategoryName(""), []);
  const resetGroupQuickAdd = useCallback(() => setNewGroupName(""), []);
  const resetGstQuickAdd = useCallback(() => setNewGstRateDraft(""), []);
  const resetUnitsQuickAdd = useCallback(() => setNewUnitsName(""), []);
  const resetAlternateUnitsQuickAdd = useCallback(
    () => setNewAlternateUnitsName(""),
    []
  );
  const resetPackingStyleQuickAdd = useCallback(
    () => setNewPackingStyleName(""),
    []
  );
  const resetPackagingQuickAdd = useCallback(() => setNewPackagingName(""), []);

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
        const next = [...opts, { value, label: name }];
        persistFullOptions(
          OPTION_KEYS.category,
          DEFAULT_CATEGORY_OPTIONS,
          next
        );
        return next;
      });
      setForm((f) => ({ ...f, category: value }));
      resetCategoryQuickAdd();
      closeModal?.();
    },
    [newCategoryName, resetCategoryQuickAdd]
  );

  const submitNewGroup = useCallback(
    (closeModal) => {
      const name = String(newGroupName || "").trim();
      if (!name) {
        toast.error("Enter a group name");
        return;
      }
      const value = slugCategory(name);
      setGroupOptions((opts) => {
        if (opts.some((o) => o.value === value || o.label === name)) return opts;
        const next = [...opts, { value, label: name }];
        persistFullOptions(OPTION_KEYS.group, DEFAULT_GROUP_OPTIONS, next);
        return next;
      });
      setForm((f) => ({ ...f, group: value }));
      resetGroupQuickAdd();
      closeModal?.();
    },
    [newGroupName, resetGroupQuickAdd]
  );

  const submitNewGstRate = useCallback(
    (closeModal) => {
      const raw = String(newGstRateDraft || "")
        .trim()
        .replace(/%/g, "");
      if (!raw || !/^\d+(\.\d{1,2})?$/.test(raw)) {
        toast.error("Enter a valid GST rate (e.g. 28 or 28.5)");
        return;
      }
      const value = raw;
      const label = `${raw}%`;
      setGstRateOptions((opts) => {
        if (opts.some((o) => o.value === value || o.label === label)) return opts;
        const next = [...opts, { value, label }];
        persistFullOptions(
          OPTION_KEYS.gstRate,
          DEFAULT_GST_RATE_OPTIONS,
          next
        );
        return next;
      });
      setForm((f) => ({ ...f, gstRate: value }));
      resetGstQuickAdd();
      closeModal?.();
    },
    [newGstRateDraft, resetGstQuickAdd]
  );

  const submitNewUnits = useCallback(
    (closeModal) => {
      const name = String(newUnitsName || "").trim();
      if (!name) {
        toast.error("Enter a unit name");
        return;
      }
      const value = slugCategory(name);
      setUnitsOptions((opts) => {
        if (
          opts.some(
            (o) =>
              o.value === value ||
              String(o.label).toLowerCase() === name.toLowerCase()
          )
        )
          return opts;
        const next = [...opts, { value, label: name }];
        persistFullOptions(OPTION_KEYS.units, DEFAULT_UNITS_OPTIONS, next);
        return next;
      });
      setForm((f) => ({ ...f, units: value }));
      resetUnitsQuickAdd();
      closeModal?.();
    },
    [newUnitsName, resetUnitsQuickAdd]
  );

  const submitNewAlternateUnits = useCallback(
    (closeModal) => {
      const name = String(newAlternateUnitsName || "").trim();
      if (!name) {
        toast.error("Enter alternate unit name");
        return;
      }
      const value = slugCategory(name);
      setAlternateUnitsOptions((opts) => {
        if (
          opts.some(
            (o) =>
              o.value === value ||
              String(o.label).toLowerCase() === name.toLowerCase()
          )
        )
          return opts;
        const next = [...opts, { value, label: name }];
        persistFullOptions(
          OPTION_KEYS.alternateUnits,
          DEFAULT_ALTERNATE_UNITS_OPTIONS,
          next
        );
        return next;
      });
      setForm((f) => ({ ...f, alternateUnits: value }));
      resetAlternateUnitsQuickAdd();
      closeModal?.();
    },
    [newAlternateUnitsName, resetAlternateUnitsQuickAdd]
  );

  const submitNewPackingStyle = useCallback(
    (closeModal) => {
      const name = String(newPackingStyleName || "").trim();
      if (!name) {
        toast.error("Enter packing style");
        return;
      }
      const value = slugCategory(name);
      setPackingStyleOptions((opts) => {
        if (
          opts.some(
            (o) =>
              o.value === value ||
              String(o.label).toLowerCase() === name.toLowerCase()
          )
        )
          return opts;
        const next = [...opts, { value, label: name }];
        persistFullOptions(
          OPTION_KEYS.packingStyle,
          DEFAULT_PACKING_STYLE_OPTIONS,
          next
        );
        return next;
      });
      setForm((f) => ({ ...f, packingStyle: value }));
      resetPackingStyleQuickAdd();
      closeModal?.();
    },
    [newPackingStyleName, resetPackingStyleQuickAdd]
  );

  const submitNewPackaging = useCallback(
    (closeModal) => {
      const name = String(newPackagingName || "").trim();
      if (!name) {
        toast.error("Enter packaging type");
        return;
      }
      setPackagingOptions((opts) => {
        if (
          opts.some(
            (o) =>
              o.value === name ||
              String(o.label).toLowerCase() === name.toLowerCase()
          )
        )
          return opts;
        const next = [...opts, { value: name, label: name }];
        persistFullOptions(
          OPTION_KEYS.packaging,
          DEFAULT_PACKAGING_OPTIONS,
          next
        );
        return next;
      });
      setForm((f) => ({ ...f, packagingType: name }));
      resetPackagingQuickAdd();
      closeModal?.();
    },
    [newPackagingName, resetPackagingQuickAdd]
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
            className="min-w-[5.5rem] !min-h-8 !py-1.5 text-[13px] !text-white hover:!text-white dark:!text-white dark:hover:!text-white"
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
            className="min-w-[5.5rem] !min-h-8 !py-1.5 text-[13px] !text-white hover:!text-white dark:!text-white dark:hover:!text-white"
            disabled={saving}
          />,
        ];

  return (
    <CommonModal
      open={open}
      onClose={onClose}
      title={modalTitle}
      width="780px"
      shellClassName="max-sm:!px-5 max-sm:!py-7 sm:!p-5"
      bodyClassName="!pt-2 !pb-8 sm:!px-3.5 sm:!pb-10"
      footer={footerActions}
    >
      <div className="flex flex-col gap-3">
        <FormSection
          title="Product"
          dense
          titleClassName={ADD_PRODUCT_SECTION_TITLE_CLASS}
        >
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            <InputField
              readOnly={isReadOnly}
              label="Product name"
              name="productName"
              value={form.productName}
              onChange={handleChange}
              placeholder="Name of product"
              inputClassName={ADD_PRODUCT_VALUE_TEXT}
            />

            <CommonDropdown
              label="Category"
              compactValue
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
                      className="!text-white hover:!text-white dark:!text-white dark:hover:!text-white"
                    />,
                  ]}
                >
                  <InputField
                    label="Category name"
                    name="newCategoryName"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="e.g. Organic inputs"
                    inputClassName={ADD_PRODUCT_VALUE_TEXT}
                  />
                </CommonModal>
              )}
            />

            <CommonDropdown
              label="Group"
              compactValue
              value={form.group}
              onChange={(v) => setForm((f) => ({ ...f, group: v }))}
              placeholder="Select or create"
              options={groupOptions}
              disabled={isReadOnly}
              hideAdd={isReadOnly}
              closeOnAdd={false}
              renderAddModal={({
                open: groupModalOpen,
                onClose: closeGroupModal,
              }) => (
                <CommonModal
                  open={groupModalOpen}
                  onClose={() => {
                    resetGroupQuickAdd();
                    closeGroupModal();
                  }}
                  title="New group"
                  size="md"
                  footer={[
                    <Button
                      key="cancel"
                      label="Cancel"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        resetGroupQuickAdd();
                        closeGroupModal();
                      }}
                    />,
                    <Button
                      key="add"
                      label="Add"
                      variant="primary"
                      size="sm"
                      onClick={() => submitNewGroup(closeGroupModal)}
                      className="!text-white hover:!text-white dark:!text-white dark:hover:!text-white"
                    />,
                  ]}
                >
                  <InputField
                    label="Group name"
                    name="newGroupName"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    placeholder="e.g. Seeds"
                    inputClassName={ADD_PRODUCT_VALUE_TEXT}
                  />
                </CommonModal>
              )}
            />

            <InputField
              readOnly={isReadOnly}
              label="Billing rate per unit"
              name="billingRate"
              value={form.billingRate}
              onChange={handleChange}
              placeholder="Amount"
              inputClassName={ADD_PRODUCT_VALUE_TEXT}
            />

            <InputField
              readOnly={isReadOnly}
              label="MRP per unit"
              name="mrp"
              value={form.mrp}
              onChange={handleChange}
              placeholder="MRP"
              inputClassName={ADD_PRODUCT_VALUE_TEXT}
            />

            <CommonDropdown
              label="GST rate"
              compactValue
              value={form.gstRate}
              onChange={(v) => setForm((f) => ({ ...f, gstRate: v }))}
              placeholder="Select or create"
              options={gstRateOptions}
              disabled={isReadOnly}
              hideAdd={isReadOnly}
              closeOnAdd={false}
              renderAddModal={({
                open: gstModalOpen,
                onClose: closeGstModal,
              }) => (
                <CommonModal
                  open={gstModalOpen}
                  onClose={() => {
                    resetGstQuickAdd();
                    closeGstModal();
                  }}
                  title="New GST rate"
                  size="md"
                  footer={[
                    <Button
                      key="cancel"
                      label="Cancel"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        resetGstQuickAdd();
                        closeGstModal();
                      }}
                    />,
                    <Button
                      key="add"
                      label="Add"
                      variant="primary"
                      size="sm"
                      onClick={() => submitNewGstRate(closeGstModal)}
                      className="!text-white hover:!text-white dark:!text-white dark:hover:!text-white"
                    />,
                  ]}
                >
                  <InputField
                    label="GST %"
                    name="newGstRateDraft"
                    value={newGstRateDraft}
                    onChange={(e) => setNewGstRateDraft(e.target.value)}
                    placeholder="e.g. 28"
                    inputMode="decimal"
                    inputClassName={ADD_PRODUCT_VALUE_TEXT}
                  />
                </CommonModal>
              )}
            />

            <InputField
              readOnly={isReadOnly}
              label="HSN Code"
              name="hsnCode"
              value={form.hsnCode}
              onChange={handleChange}
              placeholder="e.g. 31021000"
              inputClassName={ADD_PRODUCT_VALUE_TEXT}
            />

            <CommonDropdown
              label="Units"
              compactValue
              value={form.units}
              onChange={(v) => setForm((f) => ({ ...f, units: v }))}
              placeholder="e.g. Ltr, Kg, Nos"
              options={unitsOptions}
              disabled={isReadOnly}
              hideAdd={isReadOnly}
              closeOnAdd={false}
              renderAddModal={({
                open: unitsModalOpen,
                onClose: closeUnitsModal,
              }) => (
                <CommonModal
                  open={unitsModalOpen}
                  onClose={() => {
                    resetUnitsQuickAdd();
                    closeUnitsModal();
                  }}
                  title="New unit"
                  size="md"
                  footer={[
                    <Button
                      key="cancel"
                      label="Cancel"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        resetUnitsQuickAdd();
                        closeUnitsModal();
                      }}
                    />,
                    <Button
                      key="add"
                      label="Add"
                      variant="primary"
                      size="sm"
                      onClick={() => submitNewUnits(closeUnitsModal)}
                      className="!text-white hover:!text-white dark:!text-white dark:hover:!text-white"
                    />,
                  ]}
                >
                  <InputField
                    label="Unit name"
                    name="newUnitsName"
                    value={newUnitsName}
                    onChange={(e) => setNewUnitsName(e.target.value)}
                    placeholder="e.g. Nos, Bag"
                    inputClassName={ADD_PRODUCT_VALUE_TEXT}
                  />
                </CommonModal>
              )}
            />

            <CommonDropdown
              label="Alternate units"
              compactValue
              value={form.alternateUnits}
              onChange={(v) => setForm((f) => ({ ...f, alternateUnits: v }))}
              placeholder="Alternate unit"
              options={alternateUnitsOptions}
              disabled={isReadOnly}
              hideAdd={isReadOnly}
              closeOnAdd={false}
              renderAddModal={({
                open: altModalOpen,
                onClose: closeAltModal,
              }) => (
                <CommonModal
                  open={altModalOpen}
                  onClose={() => {
                    resetAlternateUnitsQuickAdd();
                    closeAltModal();
                  }}
                  title="New alternate unit"
                  size="md"
                  footer={[
                    <Button
                      key="cancel"
                      label="Cancel"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        resetAlternateUnitsQuickAdd();
                        closeAltModal();
                      }}
                    />,
                    <Button
                      key="add"
                      label="Add"
                      variant="primary"
                      size="sm"
                      onClick={() => submitNewAlternateUnits(closeAltModal)}
                      className="!text-white hover:!text-white dark:!text-white dark:hover:!text-white"
                    />,
                  ]}
                >
                  <InputField
                    label="Alternate unit name"
                    name="newAlternateUnitsName"
                    value={newAlternateUnitsName}
                    onChange={(e) => setNewAlternateUnitsName(e.target.value)}
                    placeholder="e.g. Dozen"
                    inputClassName={ADD_PRODUCT_VALUE_TEXT}
                  />
                </CommonModal>
              )}
            />

            <CommonDropdown
              label="Packing style"
              compactValue
              value={form.packingStyle}
              onChange={(v) => setForm((f) => ({ ...f, packingStyle: v }))}
              placeholder="Select or create"
              options={packingStyleOptions}
              disabled={isReadOnly}
              hideAdd={isReadOnly}
              closeOnAdd={false}
              renderAddModal={({
                open: psModalOpen,
                onClose: closePsModal,
              }) => (
                <CommonModal
                  open={psModalOpen}
                  onClose={() => {
                    resetPackingStyleQuickAdd();
                    closePsModal();
                  }}
                  title="New packing style"
                  size="md"
                  footer={[
                    <Button
                      key="cancel"
                      label="Cancel"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        resetPackingStyleQuickAdd();
                        closePsModal();
                      }}
                    />,
                    <Button
                      key="add"
                      label="Add"
                      variant="primary"
                      size="sm"
                      onClick={() => submitNewPackingStyle(closePsModal)}
                      className="!text-white hover:!text-white dark:!text-white dark:hover:!text-white"
                    />,
                  ]}
                >
                  <InputField
                    label="Packing style"
                    name="newPackingStyleName"
                    value={newPackingStyleName}
                    onChange={(e) => setNewPackingStyleName(e.target.value)}
                    placeholder="e.g. Pallet"
                    inputClassName={ADD_PRODUCT_VALUE_TEXT}
                  />
                </CommonModal>
              )}
            />

            <CommonDropdown
              label="Packaging"
              compactValue
              value={form.packagingType}
              onChange={(v) => setForm((f) => ({ ...f, packagingType: v }))}
              placeholder="Bag, box, etc."
              options={packagingOptions}
              disabled={isReadOnly}
              hideAdd={isReadOnly}
              closeOnAdd={false}
              renderAddModal={({
                open: pkgModalOpen,
                onClose: closePkgModal,
              }) => (
                <CommonModal
                  open={pkgModalOpen}
                  onClose={() => {
                    resetPackagingQuickAdd();
                    closePkgModal();
                  }}
                  title="New packaging"
                  size="md"
                  footer={[
                    <Button
                      key="cancel"
                      label="Cancel"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        resetPackagingQuickAdd();
                        closePkgModal();
                      }}
                    />,
                    <Button
                      key="add"
                      label="Add"
                      variant="primary"
                      size="sm"
                      onClick={() => submitNewPackaging(closePkgModal)}
                      className="!text-white hover:!text-white dark:!text-white dark:hover:!text-white"
                    />,
                  ]}
                >
                  <InputField
                    label="Packaging type"
                    name="newPackagingName"
                    value={newPackagingName}
                    onChange={(e) => setNewPackagingName(e.target.value)}
                    placeholder="e.g. Crate"
                    inputClassName={ADD_PRODUCT_VALUE_TEXT}
                  />
                </CommonModal>
              )}
            />

            <InputField
              readOnly={isReadOnly}
              label="Default pack size"
              name="defaultPackSize"
              value={form.defaultPackSize}
              onChange={handleChange}
              placeholder="e.g. 50 kg / 12 pcs"
              inputClassName={ADD_PRODUCT_VALUE_TEXT}
            />
          </div>

          <div className="mt-1 flex flex-wrap items-end gap-2 pt-2.5 border-t border-light-border/80 sm:gap-3">
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
                inputClassName={ADD_PRODUCT_VALUE_TEXT}
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
                inputClassName={ADD_PRODUCT_VALUE_TEXT}
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
            inputClassName={`resize-y min-h-[4rem] max-h-32 leading-snug ${ADD_PRODUCT_VALUE_TEXT}`}
          />
        </FormSection>

        <FormSection
          title="Opening balance"
          dense
          titleClassName={ADD_PRODUCT_SECTION_TITLE_CLASS}
        >
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            <InputField
              readOnly={isReadOnly}
              label="Batch no."
              name="batchNo"
              value={form.batchNo}
              onChange={handleChange}
              inputClassName={ADD_PRODUCT_VALUE_TEXT}
            />

            <div className="relative flex min-w-0 flex-col">
              <label className="mb-1.5 text-left text-[12px] font-semibold leading-tight tracking-wide text-slate-800 dark:text-slate-200">
                Mfg date
              </label>
              <div className="relative min-w-0">
                <DatePicker
                  className="w-full jitox-picker-form jitox-picker-value-sm"
                  disabled={isReadOnly}
                  value={form.mfgDate ? dayjs(form.mfgDate) : null}
                  onChange={(d) => setForm((f) => ({ ...f, mfgDate: d }))}
                />
              </div>
            </div>

            <div className="relative flex min-w-0 flex-col">
              <label className="mb-1.5 text-left text-[12px] font-semibold leading-tight tracking-wide text-slate-800 dark:text-slate-200">
                Exp date
              </label>
              <div className="relative min-w-0">
                <DatePicker
                  className="w-full jitox-picker-form jitox-picker-value-sm"
                  disabled={isReadOnly}
                  value={form.expDate ? dayjs(form.expDate) : null}
                  onChange={(d) => setForm((f) => ({ ...f, expDate: d }))}
                />
              </div>
            </div>

            <InputField
              readOnly={isReadOnly}
              label="Quantity"
              name="qty"
              value={form.qty}
              onChange={handleChange}
              placeholder="Qty"
              inputClassName={ADD_PRODUCT_VALUE_TEXT}
            />

            <InputField
              readOnly={isReadOnly}
              label="Rate"
              name="rate"
              value={form.rate}
              onChange={handleChange}
              placeholder="Rate"
              inputClassName={ADD_PRODUCT_VALUE_TEXT}
            />

            <InputField
              readOnly={isReadOnly}
              label="Amount"
              name="amount"
              value={form.amount}
              onChange={handleChange}
              placeholder="Amount"
              inputClassName={ADD_PRODUCT_VALUE_TEXT}
            />
          </div>
        </FormSection>

        <FormSection
          title="Stock"
          dense
          titleClassName={ADD_PRODUCT_SECTION_TITLE_CLASS}
        >
          <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 md:items-center">
            <button
              type="button"
              role="switch"
              aria-checked={form.stockEnabled}
              disabled={isReadOnly}
              onClick={() =>
                setForm((p) => ({ ...p, stockEnabled: !p.stockEnabled }))
              }
              className={`inline-flex max-w-full items-center gap-2.5 rounded-lg py-1 text-left outline-none select-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-900 ${
                isReadOnly
                  ? "cursor-default opacity-80"
                  : "cursor-pointer"
              }`}
            >
              <span
                className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                  form.stockEnabled
                    ? "bg-primary"
                    : "bg-gray-300 dark:bg-slate-600"
                }`}
                aria-hidden
              >
                <span
                  className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform dark:bg-slate-100 ${
                    form.stockEnabled ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </span>
              <span className="text-[12px] font-medium text-slate-600 dark:text-slate-300">
                Track stock
              </span>
              <span className="text-[12px] font-semibold text-primary tabular-nums">
                {form.stockEnabled ? "On" : "Off"}
              </span>
            </button>

            <InputField
              readOnly={isReadOnly}
              label="Minimum reorder level"
              name="minReorderLevel"
              value={form.minReorderLevel}
              onChange={handleChange}
              placeholder="50"
              inputClassName={ADD_PRODUCT_VALUE_TEXT}
            />
          </div>
        </FormSection>
      </div>
    </CommonModal>
  );
};

export default AddProductModal;
