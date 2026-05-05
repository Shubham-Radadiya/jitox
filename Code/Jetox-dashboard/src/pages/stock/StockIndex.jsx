import React, { useMemo, useState, useEffect, useCallback } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import DataTable from "../../components/ui/table/DataTable";
import {
  TABLE_CELL_BORDER,
  tableFooterTdClasses,
  tableTdClasses,
} from "../../utils/tableUi";
import { mergePageAddButton } from "../../utils/pageAddButton";
import { CommonDropdown, Button } from "../../components/ui/CommanUI";
import { ChevronDown, ChevronRight, Eye } from "lucide-react";
import AddProductModal from "../productMaster/AddProductModal";
import { dashboardUiService } from "../../services/dashboardUi.service";
import toast from "react-hot-toast";

function parseInrLike(v) {
  if (v == null) return 0;
  const n = Number(String(v).replace(/[₹,\s]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

const StockIndex = () => {
  const [summary, setSummary] = useState(null);
  const [viewMode, setViewMode] = useState("product");
  const [products, setProducts] = useState([]);
  const [groups, setGroups] = useState([]);
  const [expanded, setExpanded] = useState(() => new Set());
  const [expandedCats, setExpandedCats] = useState(() => new Set());
  const [addOpen, setAddOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadSummary = useCallback(async () => {
    try {
      const { data } = await dashboardUiService.getStockSummary();
      setSummary(data);
    } catch {
      setSummary({
        totalItems: 320,
        inStock: 290,
        lowStock: 15,
        reserved: 15,
        damaged: 8,
        totalValue: "₹6,20,000",
      });
    }
  }, []);

  const loadProducts = useCallback(async () => {
    try {
      const { data } = await dashboardUiService.getStockProducts({});
      setProducts(data.products || []);
    } catch {
      toast.error("Could not load stock products");
      setProducts([]);
    }
  }, []);

  const loadGroups = useCallback(async () => {
    try {
      const { data } = await dashboardUiService.getStockGroups();
      setGroups(data.groups || []);
    } catch {
      toast.error("Could not load stock groups");
      setGroups([]);
    }
  }, []);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  useEffect(() => {
    setLoading(true);
    (async () => {
      if (viewMode === "product") await loadProducts();
      else await loadGroups();
      setLoading(false);
    })();
  }, [viewMode, loadProducts, loadGroups]);

  const summaryCards = summary
    ? [
        { label: "Total Stock Items", value: String(summary.totalItems) },
        { label: "In Stock (Available)", value: String(summary.inStock) },
        { label: "Low Stock", value: String(summary.lowStock) },
        { label: "Reserved Stock", value: String(summary.reserved) },
        { label: "Damaged / Wastage", value: String(summary.damaged) },
        { label: "Total Stock Value", value: summary.totalValue },
      ]
    : [];

  const productColumns = useMemo(
    () => [
      "Product",
      "SKU",
      "Group",
      "Category",
      "Unit",
      "Qty",
      "Rate",
      "Value",
      "Status",
    ],
    []
  );

  const productRows = useMemo(
    () =>
      products.map((p) => ({
        Product: p.product,
        SKU: p.sku,
        Group: p.group,
        Category: p.category,
        Unit: p.unit,
        Qty: p.qty,
        Rate: p.rate,
        Value: p.value,
        Status: p.status,
      })),
    [products]
  );

  const stockGroupGrandTotal = useMemo(() => {
    return groups.reduce((sum, g) => sum + parseInrLike(g.value), 0);
  }, [groups]);

  const stockTableFooterTop =
    "border-t-2 border-t-slate-200 dark:border-t-slate-600";

  const renderProductTableFooter = useCallback((displayedRows = []) => {
    if (!displayedRows.length) return null;
    const fmt = (n) =>
      `₹${Math.round(n).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
    let qty = 0;
    let value = 0;
    displayedRows.forEach((r) => {
      qty += Number(r.Qty) || 0;
      value += parseInrLike(r.Value);
    });
    return (
      <tfoot className="sticky bottom-0 z-[1] bg-gray-50 dark:bg-slate-800/95">
        <tr>
          {productColumns.map((col) => {
            if (col === "Product") {
              return (
                <td
                  key={col}
                  className={tableFooterTdClasses(col, {
                    extra: stockTableFooterTop,
                  })}
                >
                  Total
                </td>
              );
            }
            if (col === "Qty") {
              return (
                <td
                  key={col}
                  className={tableFooterTdClasses(col, {
                    extra: `${stockTableFooterTop} font-bold`,
                  })}
                >
                  {qty.toLocaleString("en-IN")}
                </td>
              );
            }
            if (col === "Value") {
              return (
                <td
                  key={col}
                  className={tableFooterTdClasses(col, {
                    extra: `${stockTableFooterTop} font-bold`,
                  })}
                >
                  {fmt(value)}
                </td>
              );
            }
            return (
              <td
                key={col}
                className={tableFooterTdClasses(col, {
                  extra: stockTableFooterTop,
                })}
              />
            );
          })}
        </tr>
      </tfoot>
    );
  }, [productColumns]);

  /** Light: original solid pills. Dark: ghost outline + subtle tint. */
  const getStatusStyle = (status) => {
    switch (status) {
      case "Sufficient":
        return "border border-transparent bg-[#E6FFFA] text-[#2C8C7E] dark:border-emerald-400/55 dark:bg-emerald-500/10 dark:text-emerald-300";
      case "Shortage":
        return "border border-transparent bg-[#FFF7E6] text-[#F7951D] dark:border-amber-400/50 dark:bg-amber-500/10 dark:text-amber-300";
      case "Out of Stock":
        return "border border-transparent bg-[#FFE8E5] text-[#E5463E] dark:border-red-400/55 dark:bg-red-500/10 dark:text-red-300";
      default:
        return "border border-transparent bg-gray-100 text-gray-600 dark:border-slate-500/55 dark:bg-slate-400/10 dark:text-slate-300";
    }
  };

  const renderProductCell = (key, value) => {
    if (key === "Status") {
      return (
        <td key={key} className={tableTdClasses("Status")}>
          <span
            className={`px-3 py-1 rounded-lg text-sm font-medium ${getStatusStyle(
              value
            )}`}
          >
            {value}
          </span>
        </td>
      );
    }
    return (
      <td
        key={key}
        className={`${tableTdClasses(key)} text-light dark:text-slate-300`}
      >
        {value}
      </td>
    );
  };

  const toggleGroup = (id) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleCategory = (key) => {
    setExpandedCats((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const refreshStock = () => {
    loadSummary();
    if (viewMode === "product") loadProducts();
    else loadGroups();
  };

  /** Pairs metrics for the 2×3 layout: col1 = totals / risk, col2 = availability / value */
  const summaryColLeft = summaryCards.filter((_, i) => i % 2 === 0);
  const summaryColRight = summaryCards.filter((_, i) => i % 2 === 1);

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-2 sm:gap-4 min-w-0 max-w-full">
        <div className="rounded-xl jitox-panel jitox-panel--shadow p-2.5 sm:p-3 lg:p-4">
          {/* Below lg: stacked pillars on xs; side-by-side from sm. Every stat = label | count on one row. */}
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3 lg:hidden min-w-0">
            {[summaryColLeft, summaryColRight].map((col, pillarIdx) => (
              <div
                key={pillarIdx}
                className="flex min-w-0 flex-col overflow-hidden rounded-lg border border-slate-200/90 bg-slate-50/90 dark:border-slate-600/60 dark:bg-slate-950/40"
              >
                {col.map((card, rowIdx) => (
                  <div
                    key={card.label}
                    className={`flex min-h-10 w-full min-w-0 flex-row items-center justify-between gap-2 px-2 py-2 sm:min-h-11 sm:px-2.5 sm:py-2 ${
                      rowIdx !== col.length - 1
                        ? "border-b border-slate-200/80 dark:border-slate-600/55"
                        : ""
                    }`}
                  >
                    <span className="min-w-0 flex-1 text-left text-xs font-medium leading-snug text-light sm:text-sm sm:leading-snug">
                      {card.label}
                    </span>
                    <span className="max-w-[50%] shrink-0 text-right text-sm font-bold tabular-nums tracking-tight text-dark sm:text-base">
                      {card.value}
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* lg+: original desktop strip — bold value centered above label */}
          <div className="hidden min-w-0 lg:grid lg:grid-cols-6 lg:gap-0">
            {summaryCards.map((card, idx) => (
              <div
                key={card.label}
                className={`flex flex-col items-center gap-1 px-2 py-1 ${
                  idx !== summaryCards.length - 1
                    ? "border-gray-200 lg:border-r dark:border-slate-600/50"
                    : ""
                }`}
              >
                <div className="text-center text-base font-bold tabular-nums text-dark md:text-lg">
                  {card.value}
                </div>
                <div className="px-0.5 text-center text-[10px] leading-snug text-light sm:text-xs">
                  {card.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {viewMode === "product" ? (
          <div className="rounded-xl jitox-panel jitox-panel--shadow p-2.5 sm:p-3 md:p-4 flex flex-col gap-2 sm:gap-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-3">
              <h2 className="text-sm font-semibold leading-snug text-dark sm:text-base md:text-lg">
                Stock Management — Product Wise
              </h2>
              <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                <CommonDropdown
                  placeholder="Product Wise"
                  addNavigateTo="/dashboard/product"
                  className="min-w-0 flex-1 sm:w-40 sm:flex-none"
                  value={viewMode}
                  onChange={(v) => setViewMode(v)}
                  options={[
                    { label: "Product Wise", value: "product" },
                    { label: "Group Wise", value: "group" },
                  ]}
                />
                <Button
                  label="Add"
                  {...mergePageAddButton({
                    size: "sm",
                    className:
                      "!min-h-8 shrink-0 px-3 text-xs sm:!min-h-10 sm:px-5 sm:text-[14px]",
                  })}
                  onClick={() => setAddOpen(true)}
                />
              </div>
            </div>

            <DataTable
              columns={productColumns}
              data={loading ? [] : productRows}
              renderRowCell={renderProductCell}
              tableClassName="text-center"
              maxHeight="none"
              renderFooter={
                !loading && productRows.length ? renderProductTableFooter : undefined
              }
            />
            {loading && (
              <div className="text-center text-light py-4">Loading…</div>
            )}
          </div>
        ) : (
          <div className="rounded-xl jitox-panel jitox-panel--shadow p-2.5 sm:p-3 md:p-4 flex flex-col gap-2 sm:gap-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-3">
              <h2 className="text-sm font-semibold leading-snug text-dark sm:text-base md:text-lg">
                Stock Management — Group Wise
              </h2>
              <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                <CommonDropdown
                  placeholder="Group Wise"
                  addNavigateTo="/dashboard/product"
                  className="min-w-0 flex-1 sm:w-40 sm:flex-none"
                  value={viewMode}
                  onChange={(v) => setViewMode(v)}
                  options={[
                    { label: "Group Wise", value: "group" },
                    { label: "Product Wise", value: "product" },
                  ]}
                />
                <Button
                  label="Add"
                  {...mergePageAddButton({
                    size: "sm",
                    className:
                      "!min-h-8 shrink-0 px-3 text-xs sm:!min-h-10 sm:px-5 sm:text-[14px]",
                  })}
                  onClick={() => setAddOpen(true)}
                />
              </div>
            </div>

            <div className="max-w-full overflow-x-auto overscroll-x-contain rounded-xl border border-slate-200 dark:border-slate-600">
              <table className="min-w-max w-full border-collapse text-sm text-center whitespace-nowrap">
                <thead className="bg-headBg">
                  <tr>
                    <th className={`px-3 py-3 w-10 ${TABLE_CELL_BORDER}`} />
                    <th
                      className={`min-w-48 max-w-none px-3 py-3 text-left ${TABLE_CELL_BORDER} text-xs font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-200`}
                    >
                      Group Name
                    </th>
                    <th
                      className={`px-3 py-3 ${TABLE_CELL_BORDER} text-xs font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-200`}
                    >
                      Qty
                    </th>
                    <th
                      className={`px-3 py-3 ${TABLE_CELL_BORDER} text-xs font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-200`}
                    >
                      Rate
                    </th>
                    <th
                      className={`px-3 py-3 ${TABLE_CELL_BORDER} text-xs font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-200`}
                    >
                      Value
                    </th>
                    <th
                      className={`px-3 py-3 w-24 ${TABLE_CELL_BORDER} text-xs font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-200`}
                    >
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {groups.map((g) => {
                    const cats = g.categories || [];
                    const nCat = cats.length;
                    return (
                      <React.Fragment key={g.id}>
                        <tr className="bg-white hover:bg-gray-50 dark:bg-slate-900 dark:hover:bg-slate-800/80">
                          <td className={`px-3 py-3 align-middle ${TABLE_CELL_BORDER}`}>
                            <button
                              type="button"
                              onClick={() => toggleGroup(g.id)}
                              className="text-light hover:text-primary"
                            >
                              {expanded.has(g.id) ? (
                                <ChevronDown size={18} />
                              ) : (
                                <ChevronRight size={18} />
                              )}
                            </button>
                          </td>
                          <td className={`max-w-none px-3 py-3 text-left align-middle ${TABLE_CELL_BORDER}`}>
                            <span className="inline-flex items-center gap-2 whitespace-nowrap font-medium text-dark">
                              {g.groupName}
                              <span className="shrink-0 text-[10px] font-bold leading-none rounded bg-primary px-1.5 py-0.5 text-white">
                                {nCat}
                              </span>
                            </span>
                          </td>
                          <td className={`text-light ${TABLE_CELL_BORDER}`}>—</td>
                          <td className={`text-light ${TABLE_CELL_BORDER}`}>—</td>
                          <td className={`text-dark font-medium ${TABLE_CELL_BORDER}`}>
                            {g.value}
                          </td>
                          <td className={TABLE_CELL_BORDER}>
                            <button
                              type="button"
                              className="inline-flex text-blue-500 hover:text-blue-700"
                              title="Expand group"
                              onClick={() => toggleGroup(g.id)}
                            >
                              <Eye size={18} />
                            </button>
                          </td>
                        </tr>
                        {expanded.has(g.id) && (
                          <>
                            <tr className="bg-[#f8fafc] dark:bg-slate-800/50">
                              <td className={TABLE_CELL_BORDER} />
                              <td
                                colSpan={5}
                                className={`py-2 pl-6 text-left text-xs font-bold text-primary tracking-wide ${TABLE_CELL_BORDER}`}
                              >
                                Category Wise ({nCat})
                              </td>
                            </tr>
                            {cats.map((c) => {
                              const ckey = `${g.id}:${c.id}`;
                              const prods = c.products || [];
                              const hasProducts = prods.length > 0;
                              const catOpen = expandedCats.has(ckey);
                              return (
                                <React.Fragment key={c.id}>
                                  <tr className="bg-rowBg/80">
                                    <td className={TABLE_CELL_BORDER} />
                                    <td className={`max-w-none px-3 py-2 pl-8 text-left align-middle ${TABLE_CELL_BORDER}`}>
                                      {hasProducts ? (
                                        <button
                                          type="button"
                                          onClick={() => toggleCategory(ckey)}
                                          className="inline-flex items-center gap-1.5 whitespace-nowrap font-medium text-dark hover:text-primary"
                                        >
                                          {catOpen ? (
                                            <ChevronDown size={16} />
                                          ) : (
                                            <ChevronRight size={16} />
                                          )}
                                          {c.name}
                                        </button>
                                      ) : (
                                        <span className="whitespace-nowrap pl-6 font-medium text-light">
                                          {c.name}
                                        </span>
                                      )}
                                    </td>
                                    <td className={TABLE_CELL_BORDER}>{c.qty ?? "—"}</td>
                                    <td className={TABLE_CELL_BORDER}>—</td>
                                    <td className={TABLE_CELL_BORDER}>{c.value}</td>
                                    <td className={TABLE_CELL_BORDER} />
                                  </tr>
                                  {catOpen && hasProducts && (
                                    <>
                                      <tr className="bg-gray-50 dark:bg-slate-800/60">
                                        <td className={TABLE_CELL_BORDER} />
                                        <td
                                          colSpan={5}
                                          className={`py-1.5 pl-12 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide ${TABLE_CELL_BORDER}`}
                                        >
                                          Product List ({prods.length})
                                        </td>
                                      </tr>
                                      {prods.map((p, i) => (
                                        <tr
                                          key={i}
                                          className="bg-white dark:bg-slate-900/90"
                                        >
                                          <td className={TABLE_CELL_BORDER} />
                                          <td
                                            className={`max-w-none px-3 py-2 pl-14 text-left text-xs align-middle text-dark ${TABLE_CELL_BORDER}`}
                                          >
                                            <span className="inline-block whitespace-nowrap">
                                              {p.productName}
                                            </span>
                                          </td>
                                          <td className={`text-xs ${TABLE_CELL_BORDER}`}>
                                            {p.closingQty}
                                          </td>
                                          <td className={`text-xs ${TABLE_CELL_BORDER}`}>
                                            {p.rate}
                                          </td>
                                          <td className={`text-xs ${TABLE_CELL_BORDER}`}>
                                            {p.value}
                                          </td>
                                          <td className={TABLE_CELL_BORDER}>
                                            <span
                                              className={`text-xs px-2 py-0.5 rounded-md inline-block ${getStatusStyle(
                                                p.status
                                              )}`}
                                            >
                                              {p.status}
                                            </span>
                                          </td>
                                        </tr>
                                      ))}
                                    </>
                                  )}
                                </React.Fragment>
                              );
                            })}
                          </>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
                {!loading && groups.length > 0 && (
                  <tfoot className="bg-gray-50 dark:bg-slate-800/95">
                    <tr>
                      <td className={`${TABLE_CELL_BORDER} ${stockTableFooterTop}`} />
                      <td
                        className={`px-3 py-3 text-left text-sm font-semibold text-dark dark:text-slate-100 ${TABLE_CELL_BORDER} ${stockTableFooterTop}`}
                      >
                        Grand total
                      </td>
                      <td
                        className={`px-3 py-3 text-sm text-light ${TABLE_CELL_BORDER} ${stockTableFooterTop}`}
                      >
                        —
                      </td>
                      <td
                        className={`px-3 py-3 text-sm text-light ${TABLE_CELL_BORDER} ${stockTableFooterTop}`}
                      >
                        —
                      </td>
                      <td
                        className={`px-3 py-3 text-sm font-semibold text-dark tabular-nums dark:text-slate-100 ${TABLE_CELL_BORDER} ${stockTableFooterTop}`}
                      >
                        ₹
                        {Math.round(stockGroupGrandTotal).toLocaleString("en-IN")}
                      </td>
                      <td className={`${TABLE_CELL_BORDER} ${stockTableFooterTop}`} />
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
            {loading && (
              <div className="text-center text-light py-4">Loading…</div>
            )}
          </div>
        )}

        <AddProductModal
          open={addOpen}
          onClose={() => setAddOpen(false)}
          onSaved={refreshStock}
        />
      </div>
    </DashboardLayout>
  );
};

export default StockIndex;
