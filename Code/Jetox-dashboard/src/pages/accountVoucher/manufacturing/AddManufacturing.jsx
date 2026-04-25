import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
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

const productOptions = [
  { value: "organic-fertilizer", label: "Organic Fertilizer" },
  { value: "mulch-sheet", label: "Mulch Sheet" },
  { value: "bio-pesticide", label: "Bio Pesticide" },
];

const accountOptions = [
  { value: "labor", label: "Labor Charges" },
  { value: "power", label: "Power & Electricity" },
  { value: "packaging", label: "Packaging" },
  { value: "transport", label: "Transport" },
];

const initialRawMaterials = [
  { id: 1, name: "Seed", requiredQty: 100, unit: "kg", rate: 30 },
  { id: 2, name: "Pesticides", requiredQty: 150, unit: "L", rate: 120 },
  { id: 3, name: "Cocoa Powder", requiredQty: 56, unit: "kg", rate: 60 },
];

const initialAdditionalCosts = [
  { id: 1, account: "labor", qty: 5, unit: "Hrs", rate: 200 },
  { id: 2, account: "power", qty: 300, unit: "Unit", rate: 10 },
];

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isNaN(value) ? 0 : value || 0);

const AddManufacturing = () => {
  const navigate = useNavigate();
  const [batchCode, setBatchCode] = useState("Auto-Generated Or Manual");
  const [mfgDate, setMfgDate] = useState("2024-01-01");
  const [expDate, setExpDate] = useState("2024-01-31");
  const [product, setProduct] = useState("organic-fertilizer");
  const [quantityToProduce, setQuantityToProduce] = useState("100");
  const unit = "Kg";
  const [rawMaterials, setRawMaterials] = useState(initialRawMaterials);
  const [editingRowId, setEditingRowId] = useState(null);
  const [editingCostRowId, setEditingCostRowId] = useState(null);
  const [additionalCosts, setAdditionalCosts] = useState(
    initialAdditionalCosts
  );
  const [remarks, setRemarks] = useState("");
  const [isAddingNewRow, setIsAddingNewRow] = useState(false);
  const [newRowData, setNewRowData] = useState({
    name: "",
    requiredQty: "",
    unit: "kg",
    rate: "",
  });

  const handleRawMaterialChange = (id, field, value) => {
    setRawMaterials((prev) =>
      prev.map((row) => (row.id === id ? { ...row, [field]: value } : row))
    );
  };

  const addRawMaterial = () => {
    setIsAddingNewRow(true);
    setNewRowData({ name: "", requiredQty: "", unit: "kg", rate: "" });
  };

  const saveNewRawMaterial = () => {
    if (newRowData.name && newRowData.requiredQty && newRowData.rate) {
      setRawMaterials((prev) => [
        ...prev,
        {
          id: Date.now(),
          name: newRowData.name,
          requiredQty: newRowData.requiredQty,
          unit: newRowData.unit,
          rate: newRowData.rate,
        },
      ]);
      setIsAddingNewRow(false);
      setNewRowData({ name: "", requiredQty: "", unit: "kg", rate: "" });
    }
  };

  const cancelNewRawMaterial = () => {
    setIsAddingNewRow(false);
    setNewRowData({ name: "", requiredQty: "", unit: "kg", rate: "" });
  };

  const removeRawMaterial = (id) => {
    setRawMaterials((prev) => prev.filter((row) => row.id !== id));
  };

  const handleAdditionalCostChange = (id, field, value) => {
    setAdditionalCosts((prev) =>
      prev.map((row) => (row.id === id ? { ...row, [field]: value } : row))
    );
  };

  const addCostRow = () => {
    setAdditionalCosts((prev) => [
      ...prev,
      { id: Date.now(), account: "labor", qty: "", unit: "", rate: "" },
    ]);
    setEditingCostRowId(Date.now());
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

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-3 2xl:gap-4 bg-white">
        <div className="text-lg font-semibold ">Manufacturing Start</div>

        <div className="flex flex-col gap-3 2xl:gap-4 2xl:max-h-[calc(100vh-15rem)] max-h-[calc(100vh-13rem)] overflow-auto scrollbar-hide">
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <InputField label="Voucher No" value="Auto" readOnly />
            </div>
            <div className="flex-1">
              <InputField
                label="Batch Code"
                value={batchCode}
                onChange={(e) => setBatchCode(e.target.value)}
              />
            </div>
            <div className="flex-1">
              <DateInput
                label="Mfg Date"
                value={mfgDate}
                onChange={(e) => setMfgDate(e.target.value)}
              />
            </div>
            <div className="flex-1">
              <DateInput
                label="Exp Date"
                value={expDate}
                onChange={(e) => setExpDate(e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <CommonDropdown
                label="Select Finished Product"
                options={productOptions}
                value={product}
                addNavigateTo="/dashboard/product"
                onChange={setProduct}
              />
            </div>
            <div className="flex-1">
              <InputField
                label="Quantity to Produce"
                value={quantityToProduce}
                onChange={(e) => setQuantityToProduce(e.target.value)}
                placeholder="100"
              />
            </div>
          </div>

          {/* Raw Materials Table */}
          <div className="space-y-2">
            <div className="text-base font-semibold">
              Auto-List Raw Materials
            </div>
            <div className="w-full min-w-0 overflow-x-auto rounded border border-light-border">
              <table className="w-full min-w-full table-auto border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-100 border-b border-light-border">
                    <th className="w-[32%] min-w-0 px-3 py-2.5 text-left align-middle font-medium sm:px-4">
                      Raw Materials ({rawMaterials.length})
                    </th>
                    <th className="w-[20%] min-w-0 px-3 py-2.5 text-left align-middle font-medium sm:px-4">
                      Required Qty (auto)
                    </th>
                    <th className="w-[14%] min-w-0 px-3 py-2.5 text-left align-middle font-medium sm:px-4">
                      Rate/Unit (Editable)
                    </th>
                    <th className="w-[18%] min-w-0 px-3 py-2.5 text-right align-middle font-medium tabular-nums sm:px-4">
                      Subtotal (Auto)
                    </th>
                    <th className="w-[96px] min-w-[96px] max-w-[96px] px-2 py-2.5 text-center align-middle font-medium">
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
                        className="border-b border-light-border transition-colors duration-200 hover:bg-emerald-50/30"
                      >
                        <td className="min-w-0 px-3 py-3 align-middle sm:px-4">
                          {isEditing ? (
                            <input
                              type="text"
                              value={row.name}
                              onChange={(e) =>
                                handleRawMaterialChange(
                                  row.id,
                                  "name",
                                  e.target.value
                                )
                              }
                              className="min-w-0 w-full bg-transparent border-b border-light-border focus:border-primary outline-none py-1"
                              placeholder="Raw material"
                            />
                          ) : (
                            <TruncatedText>{row.name}</TruncatedText>
                          )}
                        </td>
                        <td className="min-w-0 px-3 py-3 align-middle sm:px-4">
                          {isEditing ? (
                            <input
                              type="text"
                              value={`${row.requiredQty} ${row.unit}`}
                              onChange={(e) => {
                                const parts = e.target.value.split(" ");
                                handleRawMaterialChange(
                                  row.id,
                                  "requiredQty",
                                  parts[0]
                                );
                                if (parts[1])
                                  handleRawMaterialChange(
                                    row.id,
                                    "unit",
                                    parts[1]
                                  );
                              }}
                              className="min-w-0 w-full bg-transparent border-b border-light-border focus:border-primary outline-none py-1"
                              placeholder="100 kg"
                            />
                          ) : (
                            <TruncatedText>
                              {row.requiredQty} {row.unit}
                            </TruncatedText>
                          )}
                        </td>
                        <td className="min-w-0 px-3 py-3 align-middle sm:px-4">
                          {isEditing ? (
                            <input
                              type="text"
                              value={row.rate}
                              onChange={(e) =>
                                handleRawMaterialChange(
                                  row.id,
                                  "rate",
                                  e.target.value
                                )
                              }
                              className="min-w-0 w-full bg-transparent border-b border-light-border focus:border-primary outline-none py-1"
                              placeholder="₹0"
                            />
                          ) : (
                            <TruncatedText className="tabular-nums">₹{row.rate}</TruncatedText>
                          )}
                        </td>
                        <td className="min-w-0 px-3 py-3 align-middle text-right tabular-nums sm:px-4">
                          <TruncatedText align="right">{formatCurrency(subtotal)}</TruncatedText>
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
                    <tr className="border-b border-light-border">
                      <td className="min-w-0 px-3 py-3 align-middle sm:px-4">
                        <input
                          type="text"
                          value={newRowData.name}
                          onChange={(e) =>
                            setNewRowData({
                              ...newRowData,
                              name: e.target.value,
                            })
                          }
                          className="min-w-0 w-full border-b border-light-border rounded px-2 py-1 focus:border-primary outline-none"
                          placeholder="Enter material name"
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
                          <input
                            type="text"
                            value={newRowData.unit}
                            onChange={(e) =>
                              setNewRowData({
                                ...newRowData,
                                unit: e.target.value,
                              })
                            }
                            className="w-16 border-b border-light-border rounded px-2 py-1 focus:border-primary outline-none"
                            placeholder="Unit"
                          />
                        </div>
                      </td>
                      <td className="min-w-0 px-3 py-3 align-middle sm:px-4">
                        <input
                          type="number"
                          value={newRowData.rate}
                          onChange={(e) =>
                            setNewRowData({
                              ...newRowData,
                              rate: e.target.value,
                            })
                          }
                          className="min-w-0 w-full border-b border-light-border rounded px-2 py-1 focus:border-primary outline-none"
                          placeholder="₹0"
                        />
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
                          <IoMdSave size={16} onClick={saveNewRawMaterial} />

                          <Trash2 size={16} onClick={cancelNewRawMaterial} />
                        </div>
                      </td>
                    </tr>
                  )}

                  <tr className="border-b border-light-border">
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
                  <tr className="border-t border-light-border bg-gray-100">
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
            <div className="space-y-2">
              <p className="text-xs text-red">
                Cannot proceed: "Seeds (kg)" is currently out of stock. Please
                replenish before continuing manufacturing.
              </p>
              <p className="text-xs text-red">
                Pesticides is low in stock. Required: 100L, Available: 50L.
                Please reduce quantity or reorder before proceeding.
              </p>
            </div>
          </div>

          {/* Additional Cost Table */}
          <div className="flex flex-col gap-3">
            <div className="font-semibold text-base">Additional Cost</div>
            <div className="w-full min-w-0 overflow-x-auto rounded border border-light-border">
              <table className="w-full min-w-full table-auto border-collapse text-sm">
                <thead className="bg-headBg">
                  <tr className="border-b border-light-border">
                    <th className="w-[28%] min-w-0 px-3 py-2.5 text-left align-middle sm:px-4">
                      Account
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
                        className="border-b border-light-border transition-colors duration-200 hover:bg-emerald-50/30"
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
                            <TruncatedText className="tabular-nums">₹{row.rate}</TruncatedText>
                          )}
                        </td>
                        <td className="min-w-0 px-3 py-3 align-middle text-right tabular-nums sm:px-4">
                          <TruncatedText align="right">{formatCurrency(amount)}</TruncatedText>
                        </td>
                        <td className="w-[96px] min-w-[96px] max-w-[96px] shrink-0 px-2 py-3 align-middle">
                          <div className="flex flex-nowrap items-center justify-center gap-2 text-light">
                            {isEditing ? (
                              // SAVE BUTTON - when row is in edit mode
                              <button
                                type="button"
                                onClick={() => setEditingCostRowId(null)}
                                className="hover:text-blue transition"
                              >
                                <IoMdSave size={16} />
                              </button>
                            ) : (
                              // EDIT ICON - default
                              <button
                                type="button"
                                onClick={() => setEditingCostRowId(row.id)}
                                className="hover:text-blue transition"
                                title="Edit"
                              >
                                <TbEdit size={16} />
                              </button>
                            )}

                            {/* Delete Icon */}
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
                </tbody>
                <tfoot>
                  <tr className="border-t border-light-border bg-headBg">
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
            <label className="text-sm">Narration / Remark</label>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Textarea"
              rows={4}
              className="w-full border border-light-border rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-primary focus:outline-none resize-none"
            />
          </div>

          <Card title="Total & Landing Cost">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span>Raw Material Total</span>
                  <strong>{formatCurrency(materialTotal)}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span>Additional Cost</span>
                  <strong>{formatCurrency(additionalTotal)}</strong>
                </div>
                <div className="flex items-center justify-between border-t border-light-border pt-2">
                  <span className=" font-semibold">Grand Total</span>
                  <strong>{formatCurrency(landingCost)}</strong>
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span>Quantity Produced</span>
                  <strong>
                    {quantityToProduce} {unit}
                  </strong>
                </div>
                <div className="flex items-center justify-between">
                  <span>Landing Cost/Unit</span>
                  <strong>
                    {formatCurrency(perUnitLandingCost)} per {unit}
                  </strong>
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div className="flex items-center justify-end gap-4 pt-4 border-t border-light-border">
          <Button
            label="Cancel"
            variant="outline"
            className="w-full sm:w-40"
            onClick={() => navigate(-1)}
          />
          <Button
            label="Save"
            className="w-full sm:w-40"
            onClick={() => {
              toast.success("Manufacturing batch saved as draft.");
              navigate("/dashboard/accounting-voucher/manufacturing");
            }}
          />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AddManufacturing;
