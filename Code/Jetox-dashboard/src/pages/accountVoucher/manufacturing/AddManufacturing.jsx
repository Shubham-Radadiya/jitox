import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import dayjs from "dayjs";
import DashboardLayout from "../../../layouts/DashboardLayout";
import { Trash2 } from "lucide-react";
import { TbEdit } from "react-icons/tb";
import {
  Button,
  Card,
  CommonDropdown,
  DateInput,
  InputField,
} from "../../../components/ui/CommanUI";
import { IoMdSave } from "react-icons/io";
import TruncatedText from "../../../components/ui/table/TruncatedText";
import { productsApi, manufacturingVouchersApi } from "../../../services/api";
import { getApiErrorMessage } from "../../../utils/apiError";
import { invalidateProductAndStockQueries } from "../../../utils/invalidateStockQueries";
import {
  ManufacturingBlockedModal,
  ManufacturingReadyModal,
} from "./ManufacturingStockModals";
import { mapManufacturingApiToForm } from "./manufacturingFormPrefill";

const accountOptions = [
  { value: "labor", label: "Labor Charges" },
  { value: "power", label: "Power & Electricity" },
  { value: "packaging", label: "Packaging" },
  { value: "transport", label: "Transport" },
];

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isNaN(value) ? 0 : value || 0);

function getProductId(p) {
  return String(p?._id || p?.id || "");
}

function getProductRate(p) {
  const billing = Number(p?.billingRatePerUnit);
  if (Number.isFinite(billing)) return billing;
  const rate = Number(p?.rate);
  return Number.isFinite(rate) ? rate : 0;
}

function getProductUnit(p) {
  const alt = String(p?.alternateUnits || "").trim();
  return alt || "Unit";
}

function extractStockIssues(error) {
  const body = error?.response?.data;
  return Array.isArray(body?.stockIssues) ? body.stockIssues : [];
}

/** Axios may return `{ nextVoucherNo }` or nested `{ data: { ... } }`. */
function unwrapFormMeta(payload) {
  if (!payload || typeof payload !== "object") return null;
  if (payload.nextVoucherNo != null || payload.nextBatchCode != null) {
    return payload;
  }
  if (payload.data && typeof payload.data === "object") return payload.data;
  return null;
}

function clientPreviewNumbers() {
  const stamp = dayjs().format("YYYYMMDD");
  return {
    nextVoucherNo: `MFG-${stamp}-01`,
    nextBatchCode: `${stamp}-01`,
  };
}

const emptyNewRow = () => ({
  productId: "",
  name: "",
  requiredQty: "",
  unit: "Unit",
  rate: "",
});

const emptyNewCostRow = () => ({
  account: "labor",
  qty: "",
  unit: "",
  rate: "",
});

const AddManufacturing = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editBatchId = String(searchParams.get("batchId") || "").trim();
  const queryClient = useQueryClient();
  const [voucherNo, setVoucherNo] = useState("");
  const [batchCode, setBatchCode] = useState("");
  const [batchCodeTouched, setBatchCodeTouched] = useState(false);
  const [mfgDate, setMfgDate] = useState(() => dayjs().format("YYYY-MM-DD"));
  const [expDate, setExpDate] = useState(() =>
    dayjs().add(30, "day").format("YYYY-MM-DD")
  );
  const [finishedProductId, setFinishedProductId] = useState("");
  const [quantityToProduce, setQuantityToProduce] = useState("100");
  const [rawMaterials, setRawMaterials] = useState([]);
  const [editingRowId, setEditingRowId] = useState(null);
  const [editingCostRowId, setEditingCostRowId] = useState(null);
  const [additionalCosts, setAdditionalCosts] = useState([]);
  const [remarks, setRemarks] = useState("");
  const [isAddingNewRow, setIsAddingNewRow] = useState(false);
  const [newRowData, setNewRowData] = useState(emptyNewRow);
  const [isAddingNewCostRow, setIsAddingNewCostRow] = useState(false);
  const [newCostRowData, setNewCostRowData] = useState(emptyNewCostRow);
  const [saving, setSaving] = useState(false);
  const [starting, setStarting] = useState(false);
  const [savedBatchId, setSavedBatchId] = useState(null);
  const [blockedOpen, setBlockedOpen] = useState(false);
  const [readyOpen, setReadyOpen] = useState(false);
  const [stockIssues, setStockIssues] = useState([]);
  const [rechecking, setRechecking] = useState(false);
  const [metaLoading, setMetaLoading] = useState(true);
  const [editLoading, setEditLoading] = useState(Boolean(editBatchId));
  const [batchStatus, setBatchStatus] = useState("Planned");

  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data } = await productsApi.getAll();
      return Array.isArray(data) ? data : [];
    },
  });

  useEffect(() => {
    if (!editBatchId || productsLoading) return;
    let cancelled = false;
    (async () => {
      setEditLoading(true);
      try {
        const { data } = await manufacturingVouchersApi.getById(editBatchId);
        const doc = data?.data ?? data;
        if (cancelled || !doc) return;
        const prefill = mapManufacturingApiToForm(doc, {
          getProductUnit,
          getProductRate,
        });
        if (!prefill) return;
        setVoucherNo(prefill.voucherNo);
        setBatchCode(prefill.batchCode);
        setBatchCodeTouched(true);
        setMfgDate(prefill.mfgDate);
        setExpDate(prefill.expDate);
        setFinishedProductId(prefill.finishedProductId);
        setQuantityToProduce(prefill.quantityToProduce);
        setRawMaterials(prefill.rawMaterials);
        setAdditionalCosts(prefill.additionalCosts);
        setRemarks(prefill.remarks);
        setSavedBatchId(prefill.savedBatchId);
        setBatchStatus(prefill.status);
        if (prefill.status !== "Planned" && prefill.status !== "Paused") {
          toast.error("Only planned or paused batches can be edited and saved.");
        }
      } catch (e) {
        if (!cancelled) {
          toast.error(getApiErrorMessage(e, "Could not load manufacturing batch"));
          navigate("/dashboard/accounting-voucher/manufacturing");
        }
      } finally {
        if (!cancelled) setEditLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [editBatchId, productsLoading, navigate]);

  useEffect(() => {
    if (!editBatchId || !products.length || !rawMaterials.length) return;
    setRawMaterials((prev) =>
      prev.map((row) => {
        if (!row.productId) return row;
        const p = products.find((x) => getProductId(x) === row.productId);
        if (!p) return row;
        return {
          ...row,
          name: String(p.productName || row.name || "—"),
          unit: row.unit || getProductUnit(p),
          rate: row.rate || String(getProductRate(p)),
        };
      })
    );
  }, [editBatchId, products, rawMaterials.length]);

  useEffect(() => {
    if (editBatchId || savedBatchId) {
      setMetaLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setMetaLoading(true);
      try {
        const { data } = await manufacturingVouchersApi.getFormMeta();
        const meta = unwrapFormMeta(data);
        if (cancelled || !meta) return;
        const nextVoucher = String(meta.nextVoucherNo || "").trim();
        const nextBatch = String(meta.nextBatchCode || "").trim();
        if (nextVoucher) setVoucherNo(nextVoucher);
        if (nextBatch) setBatchCode(nextBatch);
      } catch (e) {
        if (cancelled) return;
        const fallback = clientPreviewNumbers();
        setVoucherNo(fallback.nextVoucherNo);
        setBatchCode(fallback.nextBatchCode);
        const status = e?.response?.status;
        if (status !== 404 && status !== 400) {
          console.warn("Manufacturing preview-numbers:", e);
        }
      } finally {
        if (!cancelled) setMetaLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [editBatchId, savedBatchId]);

  const productById = useMemo(() => {
    const map = new Map();
    products.forEach((p) => map.set(getProductId(p), p));
    return map;
  }, [products]);

  const productOptions = useMemo(
    () =>
      products.map((p) => ({
        value: getProductId(p),
        label: String(p.productName || "—"),
      })),
    [products]
  );

  const finishedProduct = productById.get(finishedProductId);
  const unit = finishedProduct ? getProductUnit(finishedProduct) : "Unit";

  const applyProductToRow = useCallback(
    (productId) => {
      const p = productById.get(productId);
      if (!p) return { productId: "", name: "", unit: "Unit", rate: "" };
      return {
        productId,
        name: String(p.productName || ""),
        unit: getProductUnit(p),
        rate: String(getProductRate(p)),
      };
    },
    [productById]
  );

  const handleRawMaterialChange = (id, field, value) => {
    setRawMaterials((prev) =>
      prev.map((row) => {
        if (row.id !== id) return row;
        if (field === "productId") {
          const applied = applyProductToRow(value);
          return { ...row, ...applied };
        }
        return { ...row, [field]: value };
      })
    );
  };

  const addRawMaterial = () => {
    setIsAddingNewRow(true);
    setNewRowData(emptyNewRow());
  };

  const saveNewRawMaterial = () => {
    if (!newRowData.productId || !newRowData.requiredQty) {
      toast.error("Select a raw material and enter required quantity.");
      return;
    }
    setRawMaterials((prev) => [
      ...prev,
      {
        id: Date.now(),
        productId: newRowData.productId,
        name: newRowData.name,
        requiredQty: newRowData.requiredQty,
        unit: newRowData.unit,
        rate: newRowData.rate,
      },
    ]);
    setIsAddingNewRow(false);
    setNewRowData(emptyNewRow());
  };

  const cancelNewRawMaterial = () => {
    setIsAddingNewRow(false);
    setNewRowData(emptyNewRow());
  };

  const removeRawMaterial = (id) => {
    setRawMaterials((prev) => prev.filter((row) => row.id !== id));
  };

  const handleAdditionalCostChange = (id, field, value) => {
    setAdditionalCosts((prev) =>
      prev.map((row) => (row.id === id ? { ...row, [field]: value } : row))
    );
  };

  const addAdditionalCost = () => {
    setIsAddingNewCostRow(true);
    setNewCostRowData(emptyNewCostRow());
  };

  const saveNewAdditionalCost = () => {
    if (!newCostRowData.qty || !newCostRowData.rate) {
      toast.error("Enter quantity and rate for additional cost.");
      return;
    }
    setAdditionalCosts((prev) => [
      ...prev,
      { id: Date.now(), ...newCostRowData },
    ]);
    setIsAddingNewCostRow(false);
    setNewCostRowData(emptyNewCostRow());
  };

  const cancelNewAdditionalCost = () => {
    setIsAddingNewCostRow(false);
    setNewCostRowData(emptyNewCostRow());
  };

  const removeCostRow = (id) => {
    setAdditionalCosts((prev) => prev.filter((row) => row.id !== id));
  };

  const materialTotal = useMemo(
    () =>
      rawMaterials.reduce((sum, row) => {
        const qty = Number(row.requiredQty) || 0;
        const rate = Number(row.rate) || 0;
        return sum + qty * rate;
      }, 0),
    [rawMaterials]
  );

  const additionalTotal = useMemo(
    () =>
      additionalCosts.reduce((sum, row) => {
        const qty = Number(row.qty) || 0;
        const rate = Number(row.rate) || 0;
        return sum + qty * rate;
      }, 0),
    [additionalCosts]
  );

  const landingCost = materialTotal + additionalTotal;
  const productionQty = Number(quantityToProduce) || 0;
  const perUnitLandingCost = productionQty ? landingCost / productionQty : 0;

  const stockWarnings = useMemo(() => {
    if (!rawMaterials.length) return [];
    return rawMaterials
      .map((row) => {
        const p = productById.get(row.productId);
        const req = Number(row.requiredQty) || 0;
        if (!p || req <= 0) return null;
        const avail = Number(p.quantity) || 0;
        if (avail <= 0) {
          return `Cannot proceed: "${row.name}" is currently out of stock. Please replenish before continuing manufacturing.`;
        }
        if (req > avail) {
          return `${row.name} is low in stock. Required: ${req} ${row.unit}, Available: ${avail} ${row.unit}. Please reduce quantity or reorder before proceeding.`;
        }
        return null;
      })
      .filter(Boolean);
  }, [rawMaterials, productById]);

  const buildPayload = useCallback(() => {
    return {
      voucherNo: String(voucherNo).trim() || undefined,
      batchCode: String(batchCode).trim() || undefined,
      mfgDate: new Date(mfgDate).toISOString(),
      expDate: expDate ? new Date(expDate).toISOString() : undefined,
      finishedProduct: finishedProductId,
      quantityToProduce: productionQty,
      produceUnit: unit,
      rawMaterials: rawMaterials.map((row) => {
        const qty = Number(row.requiredQty) || 0;
        const rate = Number(row.rate) || 0;
        return {
          product: row.productId,
          requiredQty: qty,
          ratePerUnit: rate,
          unit: row.unit,
          subtotal: qty * rate,
        };
      }),
      additionalCosts: additionalCosts
        .filter((row) => row.account && row.qty !== "" && row.rate !== "")
        .map((row) => {
          const qty = Number(row.qty) || 0;
          const rate = Number(row.rate) || 0;
          return {
            account: row.account,
            qty,
            unit: row.unit,
            rate,
            amount: qty * rate,
          };
        }),
      remarks: remarks.trim() || undefined,
      rawMaterialTotal: materialTotal,
      additionalTotal,
      grandTotal: landingCost,
      landingCostPerUnit: perUnitLandingCost,
    };
  }, [
    additionalCosts,
    additionalTotal,
    batchCode,
    expDate,
    voucherNo,
    finishedProductId,
    landingCost,
    materialTotal,
    mfgDate,
    perUnitLandingCost,
    productionQty,
    rawMaterials,
    remarks,
    unit,
  ]);

  const openAfterSave = useCallback(
    async (batchId) => {
      try {
        invalidateProductAndStockQueries(queryClient);
        await queryClient.refetchQueries({ queryKey: ["products"] });
        const { data } = await manufacturingVouchersApi.recheckStock(batchId);
        if (data?.ok) {
          setBatchStatus(String(data?.status || "Planned"));
          setReadyOpen(true);
        } else {
          setStockIssues(data?.stockIssues || []);
          if (data?.status) setBatchStatus(String(data.status));
          setBlockedOpen(true);
        }
      } catch {
        setReadyOpen(true);
      }
    },
    [queryClient]
  );

  const handleSave = async () => {
    if (batchStatus !== "Planned" && batchStatus !== "Paused") {
      toast.error("Only planned or paused batches can be updated.");
      return;
    }
    if (!finishedProductId) {
      toast.error("Select a finished product.");
      return;
    }
    if (!productionQty || productionQty <= 0) {
      toast.error("Enter quantity to produce.");
      return;
    }
    if (!rawMaterials.length) {
      toast.error("Add at least one raw material row.");
      return;
    }

    setSaving(true);
    try {
      const payload = buildPayload();
      let batchId = savedBatchId;
      if (batchId) {
        await manufacturingVouchersApi.update(batchId, payload);
        toast.success("Manufacturing batch updated.");
      } else {
        const { data } = await manufacturingVouchersApi.create(payload);
        batchId = data?._id || data?.id;
        setSavedBatchId(batchId);
        if (data?.voucherNo) setVoucherNo(String(data.voucherNo));
        if (data?.batchCode) setBatchCode(String(data.batchCode));
        toast.success("Manufacturing batch saved.");
      }
      if (batchId) await openAfterSave(batchId);
    } catch (e) {
      toast.error(getApiErrorMessage(e, "Could not save batch"));
    } finally {
      setSaving(false);
    }
  };

  const handleStartBatch = async () => {
    if (!savedBatchId) return;
    setStarting(true);
    try {
      await manufacturingVouchersApi.start(savedBatchId);
      invalidateProductAndStockQueries(queryClient);
      toast.success("Manufacturing started. Raw stock updated.");
      setReadyOpen(false);
      navigate("/dashboard/accounting-voucher/manufacturing");
    } catch (e) {
      const issues = extractStockIssues(e);
      if (issues.length) {
        setStockIssues(issues);
        setReadyOpen(false);
        setBlockedOpen(true);
      } else {
        toast.error(getApiErrorMessage(e, "Could not start manufacturing"));
      }
    } finally {
      setStarting(false);
    }
  };

  const handleRecheckStock = async () => {
    const batchId = String(savedBatchId || editBatchId || "").trim();
    if (!batchId) {
      toast.error("Save the batch before rechecking stock.");
      return;
    }
    if (batchStatus !== "Planned" && batchStatus !== "Paused") {
      toast.error("Only planned or paused batches can be rechecked.");
      return;
    }
    if (!finishedProductId) {
      toast.error("Select a finished product first.");
      return;
    }
    if (!rawMaterials.length) {
      toast.error("Add at least one raw material row.");
      return;
    }

    setRechecking(true);
    try {
      const payload = buildPayload();
      const { data: updated } = await manufacturingVouchersApi.update(
        batchId,
        payload
      );
      if (updated?.status) setBatchStatus(String(updated.status));
      if (!savedBatchId) setSavedBatchId(batchId);

      invalidateProductAndStockQueries(queryClient);
      await queryClient.refetchQueries({ queryKey: ["products"] });

      const { data } = await manufacturingVouchersApi.recheckStock(batchId);
      if (data?.ok) {
        setBatchStatus(String(data?.status || "Planned"));
        setStockIssues([]);
        setBlockedOpen(false);
        setReadyOpen(true);
        toast.success("Stock is sufficient. You can start manufacturing.");
      } else {
        setStockIssues(data?.stockIssues || []);
        if (data?.status) setBatchStatus(String(data.status));
        toast.error("Some raw materials are still low on stock.");
      }
    } catch (e) {
      toast.error(getApiErrorMessage(e, "Could not recheck stock"));
    } finally {
      setRechecking(false);
    }
  };

  const onNewRowProductChange = (productId) => {
    const applied = applyProductToRow(productId);
    setNewRowData((prev) => ({
      ...prev,
      ...applied,
      requiredQty: prev.requiredQty,
    }));
  };

  return (
    <DashboardLayout>
      <ManufacturingBlockedModal
        open={blockedOpen}
        onClose={() => setBlockedOpen(false)}
        issues={stockIssues}
        onRecheck={handleRecheckStock}
        onEdit={() => setBlockedOpen(false)}
        rechecking={rechecking}
      />
      <ManufacturingReadyModal
        open={readyOpen}
        onClose={() => setReadyOpen(false)}
        onStart={handleStartBatch}
        onSaveOnly={() => {
          setReadyOpen(false);
          navigate("/dashboard/accounting-voucher/manufacturing");
        }}
        starting={starting}
      />

      <div className="flex flex-col gap-3 text-slate-900 dark:text-slate-100 2xl:gap-4">
        <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          {editBatchId ? "Edit Manufacturing Batch" : "Manufacturing Start"}
          {editLoading ? (
            <span className="ml-2 text-sm font-normal text-slate-500">
              Loading batch…
            </span>
          ) : null}
        </div>

        <div className="flex flex-col gap-3 xl:max-h-[calc(100vh-15rem)] xl:overflow-auto xl:scrollbar-hide 2xl:gap-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4 xl:gap-4">
            <div className="min-w-0">
              <InputField
                label="Voucher No"
                value={metaLoading ? "Loading…" : voucherNo || "—"}
                readOnly
              />
            </div>
            <div className="min-w-0">
              <InputField
                label="Batch Code"
                value={batchCode}
                placeholder={
                  metaLoading ? "Loading…" : "Auto-Generated Or Manual"
                }
                onChange={(e) => {
                  setBatchCodeTouched(true);
                  setBatchCode(e.target.value);
                }}
              />
            </div>
            <div className="min-w-0">
              <DateInput
                label="Mfg Date"
                value={mfgDate}
                onChange={(e) => setMfgDate(e.target.value)}
              />
            </div>
            <div className="min-w-0">
              <DateInput
                label="Exp Date"
                value={expDate}
                onChange={(e) => setExpDate(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:gap-4">
            <div className="min-w-0">
              <CommonDropdown
                label="Select Finished Product"
                options={productOptions}
                value={finishedProductId}
                placeholder={
                  productsLoading ? "Loading products…" : "Select product"
                }
                addNavigateTo="/dashboard/product"
                onChange={setFinishedProductId}
                searchable
              />
            </div>
            <div className="min-w-0">
              <InputField
                label="Quantity to Produce"
                value={quantityToProduce}
                onChange={(e) => setQuantityToProduce(e.target.value)}
                placeholder="100"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Raw Materials
            </div>
            <div className="w-full min-w-0 overflow-x-auto rounded border border-light-border dark:border-slate-600 dark:bg-slate-900">
              <table className="w-full min-w-full table-auto border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-100 border-b border-light-border dark:border-slate-600 dark:bg-slate-800">
                    <th className="w-[32%] min-w-0 px-3 py-2.5 text-left align-middle font-medium text-slate-700 dark:text-slate-200 sm:px-4">
                      Raw Materials ({rawMaterials.length})
                    </th>
                    <th className="w-[20%] min-w-0 px-3 py-2.5 text-left align-middle font-medium text-slate-700 dark:text-slate-200 sm:px-4">
                      Required Qty
                    </th>
                    <th className="w-[14%] min-w-0 px-3 py-2.5 text-left align-middle font-medium text-slate-700 dark:text-slate-200 sm:px-4">
                      Rate/Unit (Auto)
                    </th>
                    <th className="w-[18%] min-w-0 px-3 py-2.5 text-right align-middle font-medium tabular-nums text-slate-700 dark:text-slate-200 sm:px-4">
                      Subtotal (Auto)
                    </th>
                    <th className="w-[96px] min-w-[96px] max-w-[96px] px-2 py-2.5 text-center align-middle font-medium text-slate-700 dark:text-slate-200">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rawMaterials.map((row) => {
                    const subtotal =
                      (Number(row.requiredQty) || 0) * (Number(row.rate) || 0);
                    const isEditing = editingRowId === row.id;
                    return (
                      <tr
                        key={row.id}
                        className="border-b border-light-border transition-colors duration-200 hover:bg-emerald-50/30 dark:border-slate-700 dark:hover:bg-slate-800/50"
                      >
                        <td className="min-w-0 px-3 py-3 align-middle sm:px-4">
                          {isEditing ? (
                            <CommonDropdown
                              options={productOptions}
                              value={row.productId}
                              onChange={(v) =>
                                handleRawMaterialChange(row.id, "productId", v)
                              }
                              placeholder="Select material"
                              hideAdd
                              searchable
                              formCompact
                              menuPortal
                            />
                          ) : (
                            <TruncatedText>{row.name || "—"}</TruncatedText>
                          )}
                        </td>
                        <td className="min-w-0 px-3 py-3 align-middle sm:px-4">
                          {isEditing ? (
                            <div className="flex gap-2">
                              <input
                                type="number"
                                value={row.requiredQty}
                                onChange={(e) =>
                                  handleRawMaterialChange(
                                    row.id,
                                    "requiredQty",
                                    e.target.value
                                  )
                                }
                                className="min-w-0 w-20 bg-transparent border-b border-light-border focus:border-primary outline-none py-1"
                                placeholder="Qty"
                              />
                              <span className="text-xs text-slate-500 self-center">
                                {row.unit}
                              </span>
                            </div>
                          ) : (
                            <TruncatedText>
                              {row.requiredQty} {row.unit}
                            </TruncatedText>
                          )}
                        </td>
                        <td className="min-w-0 px-3 py-3 align-middle sm:px-4 tabular-nums">
                          <TruncatedText>₹{row.rate}</TruncatedText>
                        </td>
                        <td className="min-w-0 px-3 py-3 align-middle text-right tabular-nums sm:px-4">
                          <TruncatedText align="right">
                            {formatCurrency(subtotal)}
                          </TruncatedText>
                        </td>
                        <td className="w-[96px] min-w-[96px] max-w-[96px] shrink-0 px-2 py-3 align-middle text-light">
                          <div className="flex flex-nowrap items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                setEditingRowId(isEditing ? null : row.id)
                              }
                              className="hover:text-blue transition"
                              title={isEditing ? "Save" : "Edit"}
                            >
                              {isEditing ? (
                                <IoMdSave size={16} />
                              ) : (
                                <TbEdit size={16} />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => removeRawMaterial(row.id)}
                              className="hover:text-red transition"
                              title="Delete"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {isAddingNewRow && (
                    <tr className="border-b border-light-border dark:border-slate-700">
                      <td className="min-w-0 px-3 py-3 align-middle sm:px-4">
                        <CommonDropdown
                          options={productOptions}
                          value={newRowData.productId}
                          onChange={onNewRowProductChange}
                          placeholder="Select material"
                          hideAdd
                          searchable
                          formCompact
                          menuPortal
                        />
                      </td>
                      <td className="min-w-0 px-3 py-3 align-middle sm:px-4">
                        <div className="flex gap-2">
                          <input
                            type="number"
                            value={newRowData.requiredQty}
                            onChange={(e) =>
                              setNewRowData({
                                ...newRowData,
                                requiredQty: e.target.value,
                              })
                            }
                            className="w-20 border-b border-light-border rounded px-2 py-1 focus:border-primary outline-none"
                            placeholder="Qty"
                          />
                          <span className="text-xs text-slate-500 self-center">
                            {newRowData.unit}
                          </span>
                        </div>
                      </td>
                      <td className="min-w-0 px-3 py-3 align-middle sm:px-4 tabular-nums">
                        {newRowData.rate ? `₹${newRowData.rate}` : "—"}
                      </td>
                      <td className="min-w-0 px-3 py-3 align-middle text-right tabular-nums sm:px-4">
                        <TruncatedText align="right">
                          {formatCurrency(
                            (Number(newRowData.requiredQty) || 0) *
                              (Number(newRowData.rate) || 0)
                          )}
                        </TruncatedText>
                      </td>
                      <td className="w-[96px] min-w-[96px] max-w-[96px] shrink-0 px-2 py-3 align-middle">
                        <div className="flex flex-nowrap items-center justify-center gap-2 text-light">
                          <button type="button" onClick={saveNewRawMaterial}>
                            <IoMdSave size={16} />
                          </button>
                          <button type="button" onClick={cancelNewRawMaterial}>
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}

                  <tr className="border-b border-light-border dark:border-slate-700">
                    <td colSpan={5} className="px-3 py-3 sm:px-4">
                      <button
                        type="button"
                        onClick={addRawMaterial}
                        disabled={isAddingNewRow}
                        className="text-blue text-sm underline font-medium disabled:text-light disabled:cursor-not-allowed"
                      >
                        + Add
                      </button>
                    </td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr className="border-t border-light-border bg-gray-100 dark:border-slate-600 dark:bg-slate-800">
                    <td
                      className="px-3 py-3 text-left align-middle font-semibold sm:px-4"
                      colSpan={3}
                    >
                      Total
                    </td>
                    <td className="px-3 py-3 text-right align-middle font-semibold tabular-nums sm:px-4">
                      <TruncatedText align="right">
                        {formatCurrency(materialTotal)}
                      </TruncatedText>
                    </td>
                    <td className="w-[96px] min-w-[96px] align-middle" />
                  </tr>
                </tfoot>
              </table>
            </div>
            {stockWarnings.length > 0 && (
              <div className="space-y-2">
                {stockWarnings.map((msg) => (
                  <p key={msg} className="text-xs text-red">
                    {msg}
                  </p>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3">
            <div className="font-semibold text-base text-slate-900 dark:text-slate-100">
              Additional Cost
            </div>
            <div className="w-full min-w-0 overflow-x-auto rounded border border-light-border dark:border-slate-600 dark:bg-slate-900">
              <table className="w-full min-w-full table-auto border-collapse text-sm">
                <thead className="bg-headBg dark:bg-slate-800">
                  <tr className="border-b border-light-border dark:border-slate-600">
                    <th className="w-[28%] min-w-0 px-3 py-2.5 text-left align-middle sm:px-4">
                      Account ({additionalCosts.length})
                    </th>
                    <th className="w-[20%] min-w-0 px-3 py-2.5 text-left align-middle sm:px-4">
                      Qty
                    </th>
                    <th className="w-[26%] min-w-0 px-3 py-2.5 text-left align-middle sm:px-4">
                      Rate (Always GST-inclusive value)
                    </th>
                    <th className="w-[18%] min-w-0 px-3 py-2.5 text-right align-middle font-medium tabular-nums sm:px-4">
                      Amount
                    </th>
                    <th className="w-[96px] min-w-[96px] max-w-[96px] px-2 py-2.5 text-center align-middle">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {additionalCosts.map((row) => {
                    const amount =
                      (Number(row.qty) || 0) * (Number(row.rate) || 0);
                    const isEditing = editingCostRowId === row.id;
                    return (
                      <tr
                        key={row.id}
                        className="border-b border-light-border transition-colors duration-200 hover:bg-emerald-50/30 dark:border-slate-700 dark:hover:bg-slate-800/50"
                      >
                        <td className="min-w-0 px-3 py-3 align-middle sm:px-4">
                          {isEditing ? (
                            <select
                              value={row.account}
                              onChange={(e) =>
                                handleAdditionalCostChange(
                                  row.id,
                                  "account",
                                  e.target.value
                                )
                              }
                              className="min-w-0 w-full max-w-full border border-light-border rounded px-2 py-1"
                            >
                              {accountOptions.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <TruncatedText>
                              {accountOptions.find(
                                (opt) => opt.value === row.account
                              )?.label || row.account}
                            </TruncatedText>
                          )}
                        </td>
                        <td className="min-w-0 px-3 py-3 align-middle sm:px-4">
                          {isEditing ? (
                            <div className="flex min-w-0 flex-nowrap items-center gap-2">
                              <input
                                type="text"
                                value={row.qty}
                                placeholder="Qty"
                                onChange={(e) =>
                                  handleAdditionalCostChange(
                                    row.id,
                                    "qty",
                                    e.target.value
                                  )
                                }
                                className="min-w-0 flex-1 border-b-2 border-light-border focus:border-primary outline-none py-1"
                              />
                              <input
                                type="text"
                                value={row.unit}
                                placeholder="Unit"
                                onChange={(e) =>
                                  handleAdditionalCostChange(
                                    row.id,
                                    "unit",
                                    e.target.value
                                  )
                                }
                                className="min-w-0 w-14 shrink-0 border-b-2 border-light-border focus:border-primary outline-none py-1"
                              />
                            </div>
                          ) : (
                            <TruncatedText>
                              {row.qty} {row.unit}
                            </TruncatedText>
                          )}
                        </td>
                        <td className="min-w-0 px-3 py-3 align-middle sm:px-4">
                          {isEditing ? (
                            <input
                              type="text"
                              value={row.rate}
                              placeholder="₹0"
                              onChange={(e) =>
                                handleAdditionalCostChange(
                                  row.id,
                                  "rate",
                                  e.target.value
                                )
                              }
                              className="min-w-0 w-full border-b-2 border-light-border focus:border-primary outline-none py-1"
                            />
                          ) : (
                            <TruncatedText className="tabular-nums">
                              ₹{row.rate}
                            </TruncatedText>
                          )}
                        </td>
                        <td className="min-w-0 px-3 py-3 align-middle text-right tabular-nums sm:px-4">
                          <TruncatedText align="right">
                            {formatCurrency(amount)}
                          </TruncatedText>
                        </td>
                        <td className="w-[96px] min-w-[96px] max-w-[96px] shrink-0 px-2 py-3 align-middle">
                          <div className="flex flex-nowrap items-center justify-center gap-2 text-light">
                            {isEditing ? (
                              <button
                                type="button"
                                onClick={() => setEditingCostRowId(null)}
                                className="hover:text-blue transition"
                              >
                                <IoMdSave size={16} />
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setEditingCostRowId(row.id)}
                                className="hover:text-blue transition"
                                title="Edit"
                              >
                                <TbEdit size={16} />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => removeCostRow(row.id)}
                              className="hover:text-red transition"
                              title="Delete"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {isAddingNewCostRow && (
                    <tr className="border-b border-light-border dark:border-slate-700">
                      <td className="min-w-0 px-3 py-3 align-middle sm:px-4">
                        <select
                          value={newCostRowData.account}
                          onChange={(e) =>
                            setNewCostRowData({
                              ...newCostRowData,
                              account: e.target.value,
                            })
                          }
                          className="min-w-0 w-full max-w-full border border-light-border rounded px-2 py-1 dark:border-slate-600 dark:bg-slate-800"
                        >
                          {accountOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="min-w-0 px-3 py-3 align-middle sm:px-4">
                        <div className="flex min-w-0 flex-nowrap items-center gap-2">
                          <input
                            type="text"
                            value={newCostRowData.qty}
                            placeholder="Qty"
                            onChange={(e) =>
                              setNewCostRowData({
                                ...newCostRowData,
                                qty: e.target.value,
                              })
                            }
                            className="min-w-0 flex-1 border-b-2 border-light-border focus:border-primary outline-none py-1"
                          />
                          <input
                            type="text"
                            value={newCostRowData.unit}
                            placeholder="Unit"
                            onChange={(e) =>
                              setNewCostRowData({
                                ...newCostRowData,
                                unit: e.target.value,
                              })
                            }
                            className="min-w-0 w-14 shrink-0 border-b-2 border-light-border focus:border-primary outline-none py-1"
                          />
                        </div>
                      </td>
                      <td className="min-w-0 px-3 py-3 align-middle sm:px-4">
                        <input
                          type="text"
                          value={newCostRowData.rate}
                          placeholder="₹0"
                          onChange={(e) =>
                            setNewCostRowData({
                              ...newCostRowData,
                              rate: e.target.value,
                            })
                          }
                          className="min-w-0 w-full border-b-2 border-light-border focus:border-primary outline-none py-1"
                        />
                      </td>
                      <td className="min-w-0 px-3 py-3 align-middle text-right tabular-nums sm:px-4">
                        <TruncatedText align="right">
                          {formatCurrency(
                            (Number(newCostRowData.qty) || 0) *
                              (Number(newCostRowData.rate) || 0)
                          )}
                        </TruncatedText>
                      </td>
                      <td className="w-[96px] min-w-[96px] max-w-[96px] shrink-0 px-2 py-3 align-middle">
                        <div className="flex flex-nowrap items-center justify-center gap-2 text-light">
                          <button
                            type="button"
                            onClick={saveNewAdditionalCost}
                          >
                            <IoMdSave size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={cancelNewAdditionalCost}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}

                  <tr className="border-b border-light-border dark:border-slate-700">
                    <td colSpan={5} className="px-3 py-3 sm:px-4">
                      <button
                        type="button"
                        onClick={addAdditionalCost}
                        disabled={isAddingNewCostRow}
                        className="text-blue text-sm underline font-medium disabled:text-light disabled:cursor-not-allowed"
                      >
                        + Add
                      </button>
                    </td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr className="border-t border-light-border bg-headBg dark:border-slate-600 dark:bg-slate-800">
                    <td
                      className="px-3 py-3 text-left align-middle font-semibold sm:px-4"
                      colSpan={3}
                    >
                      Total
                    </td>
                    <td className="px-3 py-3 text-right align-middle font-semibold tabular-nums sm:px-4">
                      <TruncatedText align="right">
                        {formatCurrency(additionalTotal)}
                      </TruncatedText>
                    </td>
                    <td className="w-[96px] min-w-[96px] align-middle" />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm text-slate-700 dark:text-slate-300">
              Narration / Remark
            </label>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Textarea"
              rows={4}
              className="w-full border border-light-border rounded-lg px-3 py-2 text-sm text-slate-900 focus:ring-1 focus:ring-primary focus:outline-none resize-none dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>

          <Card title="Total & Landing Cost">
            <div className="grid grid-cols-1 gap-1.5 text-sm sm:text-[15px]">
              <div className="grid grid-cols-[8rem_minmax(0,1fr)] items-baseline gap-x-1.5 sm:grid-cols-[10.5rem_minmax(0,1fr)] sm:gap-x-2">
                <span className="whitespace-nowrap">Raw Material Total:</span>
                <strong className="break-words">
                  {formatCurrency(materialTotal)}
                </strong>
              </div>
              <div className="grid grid-cols-[8rem_minmax(0,1fr)] items-baseline gap-x-1.5 sm:grid-cols-[10.5rem_minmax(0,1fr)] sm:gap-x-2">
                <span className="whitespace-nowrap">Additional Cost:</span>
                <strong className="break-words">
                  {formatCurrency(additionalTotal)}
                </strong>
              </div>
              <div className="grid grid-cols-[8rem_minmax(0,1fr)] items-baseline gap-x-1.5 sm:grid-cols-[10.5rem_minmax(0,1fr)] sm:gap-x-2">
                <span className="whitespace-nowrap">Grand Total:</span>
                <strong className="break-words">
                  {formatCurrency(landingCost)}
                </strong>
              </div>
              <div className="grid grid-cols-[8rem_minmax(0,1fr)] items-baseline gap-x-1.5 sm:grid-cols-[10.5rem_minmax(0,1fr)] sm:gap-x-2">
                <span className="whitespace-nowrap">Quantity Produced:</span>
                <strong className="break-words">
                  {quantityToProduce} {unit}
                </strong>
              </div>
              <div className="grid grid-cols-[8rem_minmax(0,1fr)] items-baseline gap-x-1.5 sm:grid-cols-[10.5rem_minmax(0,1fr)] sm:gap-x-2">
                <span className="whitespace-nowrap">Landing Cost/Unit:</span>
                <strong className="break-words">
                  {formatCurrency(perUnitLandingCost)} per {unit}
                </strong>
              </div>
            </div>
          </Card>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-light-border pt-4 sm:flex-row sm:items-center sm:justify-end sm:gap-4 dark:border-slate-700">
          <Button
            label="Cancel"
            variant="outline"
            className="w-full sm:w-40"
            onClick={() => navigate(-1)}
          />
          <Button
            label={saving ? "Saving…" : "Save"}
            className="w-full sm:w-40"
            onClick={handleSave}
            disabled={saving}
          />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AddManufacturing;
