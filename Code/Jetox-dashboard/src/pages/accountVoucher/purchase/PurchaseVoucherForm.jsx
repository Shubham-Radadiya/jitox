import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Button,
  Card,
  CommonDropdown,
  CommonModal,
  DateInput,
  InputField,
} from "../../../components/ui/CommanUI";
import dayjs from "dayjs";
import {
  ArrowLeft,
  Keyboard,
  Plus,
  ScanLine,
  Settings,
  Trash2,
} from "lucide-react";
import { fmtInr, parseNum } from "./voucherFormConstants";
import InvoicePurchaseModalLayout from "./InvoicePurchaseModalLayout";
import {
  emptyMeta,
  usePurchaseFormMeta,
} from "../../../hooks/usePurchaseFormMeta";
import toast from "react-hot-toast";
import {
  mergeDefaultAndStoredExtras,
  persistFullOptions,
  readStoredExtras,
} from "../../../utils/dropdownExtrasStorage";
import { PURCHASE_INVOICE_EXTRA_KEYS } from "../../../utils/purchaseInvoiceDropdownKeys";

const autoFieldInputClass =
  "bg-slate-100 text-slate-600 cursor-not-allowed border-slate-200 dark:bg-slate-800/80 dark:text-slate-400 dark:border-slate-600";

export { fmtInr } from "./voucherFormConstants";

const emptyProductRow = () => ({
  id: Date.now() + Math.random(),
  product: "",
  description: "",
  hsn: "",
  batch: "",
  expDate: "",
  mfgDate: "",
  mrp: "",
  group: "",
  unit: "",
  category: "",
  qty: "",
  rate: "",
  discountPct: "",
  discountAmt: "",
});

const PurchaseVoucherForm = forwardRef(function PurchaseVoucherForm(
  {
    formType = "purchase",
    prefill = null,
    showPageHeader = true,
    layout = "default",
    onClose,
    onInvoiceAction,
    liveNow,
  },
  ref
) {
  /** Default ON for purchase/sales/return so save updates Product Master qty (quotations skip stock). */
  const [stockToggle, setStockToggle] = useState(() => formType !== "quotation");
  const [purchaseDate, setPurchaseDate] = useState(
    () => dayjs().format("YYYY-MM-DD")
  );
  const [partyName, setPartyName] = useState("");
  const [voucherNo, setVoucherNo] = useState("V001");
  const [invoiceNo] = useState("PUR-001");
  const [transporter, setTransporter] = useState("");
  const [deliveryAt, setDeliveryAt] = useState("");
  const [orderBy, setOrderBy] = useState("");
  const [billTo, setBillTo] = useState("");
  const [shipDifferent, setShipDifferent] = useState(false);
  const [shipTo, setShipTo] = useState("");
  const [termsPayment, setTermsPayment] = useState("");
  const [gstRate, setGstRate] = useState("");
  const [productRows, setProductRows] = useState([emptyProductRow()]);
  const [invoicePrefix, setInvoicePrefix] = useState("RH-P-24-25/");
  const [invoiceNumber, setInvoiceNumber] = useState("51");
  const [originalInvNo, setOriginalInvNo] = useState("");
  const [ewayBill, setEwayBill] = useState("");
  const [termsText, setTermsText] = useState("");
  const [narration, setNarration] = useState("");
  const [internalNotes, setInternalNotes] = useState("");
  const [moreDetailsOpen, setMoreDetailsOpen] = useState(false);
  const [invoiceDropdownExtrasVersion, setInvoiceDropdownExtrasVersion] =
    useState(0);
  const [newInvoiceGstDraft, setNewInvoiceGstDraft] = useState("");
  const [newInvoiceTermsDraft, setNewInvoiceTermsDraft] = useState("");

  const { data: meta, isError: metaError } = usePurchaseFormMeta();
  const nextVoucherAppliedRef = useRef(false);
  /** Snapshot of ship-to from API prefill / last edit while “different ship” is on — survives toggling the checkbox off/on. */
  const persistedShipToRef = useRef("");
  /**
   * Mirrors “Different ship address” immediately (before React re-render). gatherPayload reads this
   * so Save after toggling the checkbox cannot snapshot stale shipDifferent=false.
   */
  const shipDifferentLiveRef = useRef(false);
  /** After applying API prefill, skip one passive run of “sync ship to bill” so it cannot wipe ship-to from DB. */
  const suppressShipToBillSyncRef = useRef(false);

  const setShipDifferentLive = useCallback((next) => {
    setShipDifferent((prev) => {
      const resolved = typeof next === "function" ? next(prev) : next;
      const b = Boolean(resolved);
      shipDifferentLiveRef.current = b;
      return b;
    });
  }, []);

  useEffect(() => {
    if (metaError) {
      toast.error(
        "Could not load accounts/products. Check API and sign-in, then refresh."
      );
    }
  }, [metaError]);

  /** Apply next free voucher no. from API once (avoids duplicate `V001` on every new voucher). */
  useEffect(() => {
    if (prefill?.voucherNo != null && String(prefill.voucherNo).trim() !== "")
      return;
    const next =
      formType === "quotation"
        ? meta?.nextQuotationVoucherNo
        : meta?.nextPurchaseVoucherNo;
    if (typeof next !== "string" || !next.trim()) return;
    if (nextVoucherAppliedRef.current) return;
    setVoucherNo(next.trim());
    nextVoucherAppliedRef.current = true;
  }, [meta?.nextPurchaseVoucherNo, meta?.nextQuotationVoucherNo, formType, prefill]);

  const dropdownOptions = useMemo(() => {
    const gstBase = meta?.gst?.length ? meta.gst : emptyMeta.gst;
    const termsBase = meta?.terms?.length ? meta.terms : emptyMeta.terms;
    const gstOpts = mergeDefaultAndStoredExtras(
      gstBase,
      readStoredExtras(PURCHASE_INVOICE_EXTRA_KEYS.gst)
    );
    const termsOpts = mergeDefaultAndStoredExtras(
      termsBase,
      readStoredExtras(PURCHASE_INVOICE_EXTRA_KEYS.termsPayment)
    );
    if (!meta) {
      return { ...emptyMeta, gst: gstOpts, terms: termsOpts };
    }
    return {
      parties: meta.parties?.length ? meta.parties : emptyMeta.parties,
      partyCreditHints:
        meta.partyCreditHints && typeof meta.partyCreditHints === "object"
          ? meta.partyCreditHints
          : {},
      products: meta.products?.length ? meta.products : emptyMeta.products,
      groups: meta.groups?.length ? meta.groups : emptyMeta.groups,
      units: meta.units?.length ? meta.units : emptyMeta.units,
      locations: meta.locations?.length ? meta.locations : emptyMeta.locations,
      transporters: meta.transporters?.length
        ? meta.transporters
        : emptyMeta.transporters,
      employees: meta.employees?.length ? meta.employees : emptyMeta.employees,
      terms: termsOpts,
      gst: gstOpts,
    };
  }, [meta, invoiceDropdownExtrasVersion]);

  const partyCreditHints = dropdownOptions.partyCreditHints || {};

  const productMetaById = useMemo(() => {
    const m = new Map();
    for (const p of dropdownOptions.products || []) {
      if (p?.value) m.set(String(p.value), p);
    }
    return m;
  }, [dropdownOptions.products]);

  /** Layout phase so bill/ship/checkbox state exists before the passive ship-sync effect runs (avoids wiping ship on edit). */
  useLayoutEffect(() => {
    if (!prefill) return;
    if (prefill.partyName != null) setPartyName(prefill.partyName);
    if (prefill.purchaseDate) setPurchaseDate(prefill.purchaseDate);
    if (prefill.voucherNo) setVoucherNo(prefill.voucherNo);
    if (prefill.narration != null) setNarration(prefill.narration);
    if (prefill.internalNotes != null) setInternalNotes(prefill.internalNotes);
    if (prefill.transporter != null) setTransporter(prefill.transporter);
    if (prefill.deliveryAt != null) setDeliveryAt(prefill.deliveryAt);
    if (prefill.orderBy != null) setOrderBy(prefill.orderBy);
    {
      const sd = Boolean(prefill.shipDifferent);
      shipDifferentLiveRef.current = sd;
      setShipDifferent(sd);
      setBillTo(String(prefill.billTo ?? ""));
      setShipTo(String(prefill.shipTo ?? ""));
      persistedShipToRef.current = String(prefill.shipTo ?? "");
      suppressShipToBillSyncRef.current = true;
    }
    if (prefill.termsPayment != null) setTermsPayment(prefill.termsPayment);
    if (prefill.gstRate != null && String(prefill.gstRate).trim() !== "") {
      setGstRate(prefill.gstRate);
    }
    if (prefill.stockToggle != null) setStockToggle(prefill.stockToggle);
    if (prefill.invoicePrefix != null) setInvoicePrefix(prefill.invoicePrefix);
    if (prefill.invoiceNumber != null) setInvoiceNumber(prefill.invoiceNumber);
    if (prefill.originalInvNo != null) setOriginalInvNo(prefill.originalInvNo);
    if (prefill.ewayBill != null) setEwayBill(prefill.ewayBill);
    if (prefill.termsText != null) setTermsText(prefill.termsText);
    if (Array.isArray(prefill.productRows) && prefill.productRows.length > 0) {
      setProductRows(prefill.productRows);
    }
  }, [prefill]);

  useEffect(() => {
    if (shipDifferent) {
      persistedShipToRef.current = String(shipTo ?? "");
    }
  }, [shipTo, shipDifferent]);

  useEffect(() => {
    if (suppressShipToBillSyncRef.current) {
      suppressShipToBillSyncRef.current = false;
      return;
    }
    if (!shipDifferent) {
      setShipTo(billTo);
    }
  }, [billTo, shipDifferent]);

  const handleDateChange = ({ target }) => {
    const v = target?.value;
    if (v && typeof v.format === "function") {
      setPurchaseDate(v.format("YYYY-MM-DD"));
    } else if (typeof v === "string") {
      setPurchaseDate(v);
    } else {
      setPurchaseDate(dayjs().format("YYYY-MM-DD"));
    }
  };

  const addProductRow = () => {
    setProductRows((prev) => [...prev, emptyProductRow()]);
  };

  const removeProductRow = (id) => {
    setProductRows((prev) => {
      if (prev.length === 1) return prev;
      return prev.filter((row) => row.id !== id);
    });
  };

  const updateProductRow = useCallback((id, field, value) => {
    if (field === "product") {
      const p = productMetaById.get(String(value));
      setProductRows((prev) =>
        prev.map((row) => {
          if (row.id !== id) return row;
          if (!value || !p) {
            return { ...row, product: value };
          }
          const rateStr =
            row.rate && String(row.rate).trim()
              ? row.rate
              : p.defaultRate != null && p.defaultRate !== ""
                ? String(p.defaultRate)
                : "";
          return {
            ...row,
            product: value,
            hsn: p.hsn != null && String(p.hsn).trim() ? String(p.hsn) : "",
            group: p.group != null && String(p.group).trim() ? String(p.group) : "",
            category:
              p.category != null && String(p.category).trim() ? String(p.category) : "",
            unit: p.unit != null && String(p.unit).trim() ? String(p.unit) : "",
            rate: rateStr,
            batch:
              p.batchNo != null && String(p.batchNo).trim() !== ""
                ? String(p.batchNo)
                : "",
            mrp:
              p.mrpPerUnit != null && String(p.mrpPerUnit).trim() !== ""
                ? String(p.mrpPerUnit)
                : "",
            qty:
              p.quantity != null && String(p.quantity).trim() !== ""
                ? String(p.quantity)
                : "",
            mfgDate:
              p.mfgDt != null && String(p.mfgDt).trim() !== "" ? String(p.mfgDt) : "",
            expDate:
              p.expDt != null && String(p.expDt).trim() !== "" ? String(p.expDt) : "",
          };
        })
      );
      return;
    }
    setProductRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, [field]: value } : row))
    );
  }, [productMetaById]);

  const isQuotation = formType === "quotation";
  const isPurchaseReturn = formType === "purchase-return";
  const isSales = formType === "sales";
  const pageTitle = isQuotation
    ? "Add Quotation"
    : isPurchaseReturn
      ? "Purchase Return Voucher"
      : isSales
        ? "Sales Voucher"
        : "Purchase Voucher";

  const lineTotals = useMemo(() => {
    return productRows.reduce(
      (acc, row) => {
        const q = parseNum(row.qty);
        const r = parseNum(row.rate);
        const base = q * r;
        const dAmt = parseNum(row.discountAmt);
        const dPct = parseNum(row.discountPct);
        const disc = dAmt > 0 ? dAmt : base * (dPct / 100);
        const gstPct = parseNum(gstRate);
        const taxable = Math.max(0, base - disc);
        const tax = gstPct ? (taxable * gstPct) / 100 : 0;
        return {
          qty: acc.qty + q,
          subtotal: acc.subtotal + base,
          taxable: acc.taxable + taxable,
          tax: acc.tax + tax,
        };
      },
      { qty: 0, subtotal: 0, taxable: 0, tax: 0 }
    );
  }, [productRows, gstRate]);

  const resetInvoiceGstDraft = useCallback(() => setNewInvoiceGstDraft(""), []);
  const resetInvoiceTermsDraft = useCallback(
    () => setNewInvoiceTermsDraft(""),
    []
  );

  const submitNewInvoiceGstRate = useCallback(
    (closeModal) => {
      const raw = String(newInvoiceGstDraft || "").trim().replace(/%/g, "");
      if (!raw || !/^\d+(\.\d{1,2})?$/.test(raw)) {
        toast.error("Enter a valid GST rate (e.g. 28 or 28.5)");
        return;
      }
      const value = raw;
      const label = `${raw}%`;
      const gstBase = meta?.gst?.length ? meta.gst : emptyMeta.gst;
      const current = mergeDefaultAndStoredExtras(
        gstBase,
        readStoredExtras(PURCHASE_INVOICE_EXTRA_KEYS.gst)
      );
      if (current.some((o) => o.value === value || o.label === label)) {
        toast.error("This GST rate is already in the list");
        closeModal?.();
        return;
      }
      const next = [...current, { value, label }];
      persistFullOptions(PURCHASE_INVOICE_EXTRA_KEYS.gst, gstBase, next);
      setGstRate(value);
      resetInvoiceGstDraft();
      setInvoiceDropdownExtrasVersion((v) => v + 1);
      closeModal?.();
    },
    [meta, newInvoiceGstDraft, resetInvoiceGstDraft]
  );

  const submitNewInvoiceTerms = useCallback(
    (closeModal) => {
      const name = String(newInvoiceTermsDraft || "").trim();
      if (!name) {
        toast.error("Enter a payment term");
        return;
      }
      const termsBase = meta?.terms?.length ? meta.terms : emptyMeta.terms;
      const current = mergeDefaultAndStoredExtras(
        termsBase,
        readStoredExtras(PURCHASE_INVOICE_EXTRA_KEYS.termsPayment)
      );
      const lower = name.toLowerCase();
      if (
        current.some(
          (o) =>
            String(o.label).toLowerCase() === lower ||
            String(o.value).toLowerCase() === lower
        )
      ) {
        toast.error("This term is already in the list");
        closeModal?.();
        return;
      }
      const value = name;
      const next = [...current, { value, label: name }];
      persistFullOptions(
        PURCHASE_INVOICE_EXTRA_KEYS.termsPayment,
        termsBase,
        next
      );
      setTermsPayment(value);
      resetInvoiceTermsDraft();
      setInvoiceDropdownExtrasVersion((v) => v + 1);
      closeModal?.();
    },
    [meta, newInvoiceTermsDraft, resetInvoiceTermsDraft]
  );

  const renderGstAddModal = useCallback(
    ({ open: gstModalOpen, onClose: closeGstModal }) => (
      <CommonModal
        open={gstModalOpen}
        onClose={() => {
          resetInvoiceGstDraft();
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
              resetInvoiceGstDraft();
              closeGstModal();
            }}
          />,
          <Button
            key="add"
            label="Add"
            variant="primary"
            size="sm"
            onClick={() => submitNewInvoiceGstRate(closeGstModal)}
            className="!text-white hover:!text-white dark:!text-white dark:hover:!text-white"
          />,
        ]}
      >
        <InputField
          label="GST %"
          name="newInvoiceGstDraft"
          value={newInvoiceGstDraft}
          onChange={(e) => setNewInvoiceGstDraft(e.target.value)}
          placeholder="e.g. 28"
          inputMode="decimal"
        />
      </CommonModal>
    ),
    [newInvoiceGstDraft, resetInvoiceGstDraft, submitNewInvoiceGstRate]
  );

  const renderTermsAddModal = useCallback(
    ({ open: termsModalOpen, onClose: closeTermsModal }) => (
      <CommonModal
        open={termsModalOpen}
        onClose={() => {
          resetInvoiceTermsDraft();
          closeTermsModal();
        }}
        title="New payment term"
        size="md"
        footer={[
          <Button
            key="cancel"
            label="Cancel"
            variant="outline"
            size="sm"
            onClick={() => {
              resetInvoiceTermsDraft();
              closeTermsModal();
            }}
          />,
          <Button
            key="add"
            label="Add"
            variant="primary"
            size="sm"
            onClick={() => submitNewInvoiceTerms(closeTermsModal)}
            className="!text-white hover:!text-white dark:!text-white dark:hover:!text-white"
          />,
        ]}
      >
        <InputField
          label="Term name"
          name="newInvoiceTermsDraft"
          value={newInvoiceTermsDraft}
          onChange={(e) => setNewInvoiceTermsDraft(e.target.value)}
          placeholder="e.g. Net 30"
        />
      </CommonModal>
    ),
    [newInvoiceTermsDraft, resetInvoiceTermsDraft, submitNewInvoiceTerms]
  );

  const partyHint = partyName ? partyCreditHints[partyName] : null;

  const partyLabel = useMemo(() => {
    const p = dropdownOptions.parties.find(
      (x) => x.value === partyName || x.label === partyName
    );
    return p?.label || partyName || "Select party";
  }, [dropdownOptions.parties, partyName]);

  const gatherPayload = useCallback(() => {
    return {
      formType,
      partyName,
      purchaseDate,
      voucherNo,
      invoiceNo,
      invoicePrefix,
      invoiceNumber,
      originalInvNo,
      ewayBill,
      termsText,
      narration,
      internalNotes,
      transporter,
      deliveryAt,
      orderBy,
      billTo,
      shipTo,
      shipDifferent: shipDifferentLiveRef.current,
      termsPayment,
      gstRate,
      productRows,
      lineTotals,
      stockToggle,
    };
  }, [
    formType,
    partyName,
    purchaseDate,
    voucherNo,
    invoiceNo,
    invoicePrefix,
    invoiceNumber,
    originalInvNo,
    ewayBill,
    termsText,
    narration,
    internalNotes,
    transporter,
    deliveryAt,
    orderBy,
    billTo,
    shipTo,
    termsPayment,
    gstRate,
    productRows,
    lineTotals,
    stockToggle,
  ]);

  useImperativeHandle(ref, () => ({ gatherPayload }), [gatherPayload]);

  const runInvoiceSave = useCallback(
    async (kind) => {
      const payload = gatherPayload();
      const createdAt = new Date().toISOString();
      await onInvoiceAction?.({ ...payload, createdAt }, kind);
    },
    [gatherPayload, onInvoiceAction]
  );

  if (layout === "invoice" && !isQuotation) {
    return (
      <InvoicePurchaseModalLayout
        formType={formType}
        dropdownOptions={dropdownOptions}
        liveNow={liveNow}
        onClose={onClose}
        onSave={runInvoiceSave}
        partyLabel={partyLabel}
        partyName={partyName}
        setPartyName={setPartyName}
        partyHint={partyHint}
        billTo={billTo}
        setBillTo={setBillTo}
        shipDifferent={shipDifferent}
        setShipDifferent={setShipDifferentLive}
        shipTo={shipTo}
        setShipTo={setShipTo}
        persistedShipToRef={persistedShipToRef}
        purchaseDate={purchaseDate}
        handleDateChange={handleDateChange}
        invoicePrefix={invoicePrefix}
        setInvoicePrefix={setInvoicePrefix}
        invoiceNumber={invoiceNumber}
        setInvoiceNumber={setInvoiceNumber}
        originalInvNo={originalInvNo}
        setOriginalInvNo={setOriginalInvNo}
        ewayBill={ewayBill}
        setEwayBill={setEwayBill}
        voucherNo={voucherNo}
        transporter={transporter}
        setTransporter={setTransporter}
        deliveryAt={deliveryAt}
        setDeliveryAt={setDeliveryAt}
        orderBy={orderBy}
        setOrderBy={setOrderBy}
        productRows={productRows}
        addProductRow={addProductRow}
        removeProductRow={removeProductRow}
        updateProductRow={updateProductRow}
        gstRate={gstRate}
        setGstRate={setGstRate}
        termsPayment={termsPayment}
        setTermsPayment={setTermsPayment}
        termsText={termsText}
        setTermsText={setTermsText}
        narration={narration}
        setNarration={setNarration}
        internalNotes={internalNotes}
        setInternalNotes={setInternalNotes}
        getShareSnapshot={gatherPayload}
        stockToggle={stockToggle}
        setStockToggle={setStockToggle}
        moreDetailsOpen={moreDetailsOpen}
        setMoreDetailsOpen={setMoreDetailsOpen}
        lineTotals={lineTotals}
        renderGstAddModal={renderGstAddModal}
        renderTermsAddModal={renderTermsAddModal}
      />
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 pb-2">
      {showPageHeader && (
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            {pageTitle}
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {isQuotation
              ? "Capture line items, delivery, and pricing for your quotation."
              : isPurchaseReturn
                ? "Record items being returned to the supplier — stock leaves on save."
                : isSales
                  ? "Record items being sold to the customer — stock leaves on save."
                  : "Record party, delivery, products, and tax for this purchase entry."}
          </p>
        </div>
      )}

      <div className="flex flex-col gap-4">
        <Card title="Description">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-x-5 sm:gap-y-4 xl:grid-cols-4">
            <div className="min-w-0 sm:col-span-2 xl:col-span-1">
              <CommonDropdown
                label="Party Name"
                options={dropdownOptions.parties}
                value={partyName}
                onChange={setPartyName}
                placeholder="Select party"
                addNavigateTo="/dashboard/account"
              />
              {partyHint ? (
                <p className="mt-1.5 text-xs font-medium text-red-600 dark:text-red-400">
                  {partyHint}
                </p>
              ) : null}
            </div>
            <DateInput
              label="Purchase date"
              value={purchaseDate}
              name="purchaseDate"
              onChange={handleDateChange}
            />
            <InputField
              label="Voucher Number"
              value={voucherNo}
              readOnly
              inputClassName={autoFieldInputClass}
            />
            <InputField
              label="Invoice Number"
              value={invoiceNo}
              readOnly
              inputClassName={autoFieldInputClass}
            />
          </div>
        </Card>

        <Card title="Narration & notes">
          <div className="grid grid-cols-1 gap-4 sm:gap-x-5">
            <InputField
              label="Voucher narration"
              placeholder="Short ledger-style description for this voucher (optional)"
              multiline
              rows={3}
              value={narration}
              onChange={(e) => setNarration(e.target.value)}
              inputClassName="resize-y min-h-[4.5rem]"
            />
            <InputField
              label="Internal notes"
              placeholder="Team-only notes — not shown on customer-facing documents (optional)"
              multiline
              rows={2}
              value={internalNotes}
              onChange={(e) => setInternalNotes(e.target.value)}
              inputClassName="resize-y min-h-[3.5rem]"
            />
          </div>
        </Card>

        <Card title="Delivery">
          <div className="flex flex-col gap-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 sm:gap-x-5 sm:gap-y-4">
              <CommonDropdown
                label="Transporter"
                options={dropdownOptions.transporters}
                value={transporter}
                onChange={setTransporter}
                placeholder="Select transporter"
                addNavigateTo="/dashboard/account"
              />
              <CommonDropdown
                label="Delivery At"
                options={dropdownOptions.locations}
                value={deliveryAt}
                onChange={setDeliveryAt}
                placeholder="Select location"
                addNavigateTo="/dashboard/stock"
              />
              <CommonDropdown
                label="Order By"
                options={dropdownOptions.employees}
                value={orderBy}
                onChange={setOrderBy}
                placeholder="Select employee"
                addNavigateTo="/dashboard/hrm/employees"
              />
            </div>
            <InputField
              label="Bill to"
              placeholder="Billing address (multi-line)"
              multiline
              rows={3}
              value={billTo}
              onChange={(e) => setBillTo(e.target.value)}
              inputClassName="min-h-[5.25rem] resize-y"
            />
            <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                className="accent-primary h-4 w-4 rounded"
                checked={shipDifferent}
                onChange={(e) => {
                  const on = e.target.checked;
                  setShipDifferentLive(on);
                  if (!on) {
                    setShipTo(billTo);
                  } else {
                    const snap = persistedShipToRef.current;
                    setShipTo(
                      String(snap ?? "").trim() ? snap : billTo
                    );
                  }
                }}
              />
              Ship to is different from bill to
            </label>
            {shipDifferent ? (
              <InputField
                label="Ship to"
                placeholder="Shipping address (multi-line)"
                multiline
                rows={3}
                value={shipTo}
                onChange={(e) => setShipTo(e.target.value)}
                inputClassName="min-h-[5.25rem] resize-y"
              />
            ) : null}
          </div>
        </Card>

        <Card
          title="Line items"
          description="Add one row per product. Auto fields update when product data is linked."
          actionLabel="+ Add row"
          onAction={addProductRow}
        >
          <div className="flex flex-col gap-4">
            {productRows.map((row) => (
              <div
                key={row.id}
                className="rounded-xl border border-slate-200 bg-slate-50/40 p-4 dark:border-slate-700 dark:bg-slate-800/30"
              >
                <div className="flex flex-col gap-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 sm:gap-x-4 sm:gap-y-4">
                    <div className="min-w-0 sm:col-span-2 lg:col-span-1">
                      <CommonDropdown
                        label="Product"
                        options={dropdownOptions.products}
                        value={row.product}
                        onChange={(value) =>
                          updateProductRow(row.id, "product", value)
                        }
                        placeholder="Select product"
                        addNavigateTo="/dashboard/product"
                      />
                    </div>
                    <div className="min-w-0">
                      <CommonDropdown
                        label="Group"
                        options={dropdownOptions.groups}
                        value={row.group}
                        onChange={(value) =>
                          updateProductRow(row.id, "group", value)
                        }
                        placeholder="Select group"
                        addNavigateTo="/dashboard/product"
                      />
                    </div>
                    <div className="min-w-0">
                      <InputField
                        label="Category"
                        placeholder="From product master"
                        readOnly
                        value={row.category}
                        inputClassName={autoFieldInputClass}
                      />
                    </div>
                    <div className="min-w-0">
                      <CommonDropdown
                        label="Unit"
                        options={dropdownOptions.units}
                        value={row.unit}
                        onChange={(value) =>
                          updateProductRow(row.id, "unit", value)
                        }
                        placeholder="Select unit"
                        addNavigateTo="/dashboard/product"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:items-end sm:gap-x-4">
                    <InputField
                      label="Qty"
                      placeholder="—"
                      readOnly
                      value={row.qty}
                      inputClassName={autoFieldInputClass}
                    />
                    <InputField
                      label="Rate per unit (₹)"
                      placeholder="Enter rate"
                      value={row.rate}
                      onChange={(e) =>
                        updateProductRow(row.id, "rate", e.target.value)
                      }
                    />
                    <div className="flex justify-stretch sm:justify-end">
                      <button
                        type="button"
                        onClick={() => removeProductRow(row.id)}
                        disabled={productRows.length === 1}
                        title="Remove line"
                        className={`inline-flex h-10 w-full min-w-0 items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700 dark:border-slate-600 dark:text-slate-300 dark:hover:border-red-900 dark:hover:bg-red-950/40 dark:hover:text-red-400 sm:w-auto sm:min-w-[10rem] ${
                          productRows.length === 1
                            ? "pointer-events-none opacity-40"
                            : ""
                        }`}
                      >
                        <Trash2 size={18} aria-hidden className="shrink-0" />
                        <span className="sm:hidden">Remove line</span>
                        <span className="hidden sm:inline">Remove</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex flex-col gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 dark:border-slate-600 dark:bg-slate-900/80 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Totals (from lines)
            </p>
            <div className="flex flex-wrap items-baseline gap-6 text-sm tabular-nums text-slate-800 dark:text-slate-100">
              <span>
                Total qty:{" "}
                <strong className="font-semibold">
                  {lineTotals.qty.toLocaleString("en-IN", {
                    maximumFractionDigits: 2,
                  })}
                </strong>
              </span>
              <span>
                Subtotal:{" "}
                <strong className="font-semibold">
                  {fmtInr(lineTotals.subtotal)}
                </strong>
              </span>
            </div>
          </div>
        </Card>

        <Card title="Payment & terms">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-x-5">
            <CommonDropdown
              searchable
              searchPlaceholder="Search terms…"
              closeOnAdd={false}
              renderAddModal={renderTermsAddModal}
              label="Terms of Payment"
              options={dropdownOptions.terms}
              value={termsPayment}
              onChange={setTermsPayment}
              placeholder="Select term"
            />
            <InputField
              label="Due Date"
              placeholder="Auto-calculated from party terms"
              readOnly
              inputClassName={autoFieldInputClass}
            />
          </div>
        </Card>

        <Card title="Pricing">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-x-5">
            <CommonDropdown
              searchable
              searchPlaceholder="Search rate…"
              closeOnAdd={false}
              renderAddModal={renderGstAddModal}
              label="GST"
              options={dropdownOptions.gst}
              value={gstRate}
              onChange={setGstRate}
              placeholder="Select GST"
            />
            <InputField
              label="Base price"
              placeholder="Sum of qty × rate"
              readOnly
              inputClassName={autoFieldInputClass}
            />
          </div>
        </Card>

        <Card title="Options">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                Stock quantity
              </span>
              <Toggle
                on={stockToggle}
                onToggle={() => setStockToggle(!stockToggle)}
              />
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-6">
              <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                <input type="checkbox" className="accent-primary h-4 w-4 rounded" />
                Generate purchase bill
              </label>
              <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                <input type="checkbox" className="accent-primary h-4 w-4 rounded" />
                Update stock when order is placed
              </label>
              <div className="flex items-center gap-2 border-t border-slate-200 pt-3 sm:border-t-0 sm:pt-0 dark:border-slate-600">
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  Product status
                </span>
                <Toggle on disabled />
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
});

export function Toggle({ on, onToggle, disabled = false }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      className={`flex h-6 w-12 items-center rounded-full px-1 transition ${
        on ? "justify-end bg-primary" : "justify-start bg-gray"
      } ${disabled ? "cursor-not-allowed opacity-70" : ""}`}
    >
      <span className="h-4 w-4 rounded-full bg-white shadow" />
    </button>
  );
}

PurchaseVoucherForm.displayName = "PurchaseVoucherForm";

export default PurchaseVoucherForm;
