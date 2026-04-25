import { useMemo, useState, useCallback, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import DashboardLayout from "../../layouts/DashboardLayout";
import DataTable from "../../components/ui/table/DataTable";
import { Button } from "../../components/ui/CommanUI";
import { mergePageAddButton } from "../../utils/pageAddButton";
import AddProductModal from "./AddProductModal";
import CommonDeleteModal from "../../components/ui/modals/CommonDeleteModal";
import { IoEyeOutline } from "react-icons/io5";
import { TbEdit } from "react-icons/tb";
import { Trash2 } from "lucide-react";
import { productsApi } from "../../services/api";
import toast from "react-hot-toast";
import { getApiErrorMessage, isEmptyListNotFound } from "../../utils/apiError";
import {
  mapProductToListRow,
  mapProductToPriceRow,
} from "../../utils/productMappers";
import { TABLE_ACTION_ICON_BTN, tableFooterTdClasses } from "../../utils/tableUi";
import { downloadPrintableDocument, rowsToHtmlTable } from "../../utils/printAndExport";

const ProductIndex = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("productList");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [productModal, setProductModal] = useState({
    open: false,
    mode: "create",
    product: null,
  });

  const {
    data: rawProducts = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      try {
        const { data } = await productsApi.getAll();
        return Array.isArray(data) ? data : [];
      } catch (e) {
        if (isEmptyListNotFound(e)) return [];
        throw e;
      }
    },
  });

  useEffect(() => {
    if (isError && error) {
      toast.error(getApiErrorMessage(error, "Could not load products"));
    }
  }, [isError, error]);

  const productRows = useMemo(
    () => rawProducts.map(mapProductToListRow),
    [rawProducts]
  );

  const priceRows = useMemo(
    () => rawProducts.map(mapProductToPriceRow),
    [rawProducts]
  );

  const deleteMutation = useMutation({
    mutationFn: (id) => productsApi.delete(id),
    onSuccess: () => {
      toast.success("Product deleted");
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setDeleteTarget(null);
    },
    onError: (e) => {
      toast.error(getApiErrorMessage(e, "Delete failed"));
    },
  });

  const exportPriceListDocument = () => {
    if (!priceRows.length) {
      toast.error("No price rows to export");
      return;
    }
    const cols = priceColumns.filter((c) => c !== "Actions");
    downloadPrintableDocument(
      `Jitox-price-list-${new Date().toISOString().slice(0, 10)}`,
      rowsToHtmlTable(cols, priceRows)
    );
    toast.success(
      "Downloaded (.html). Open it and use Print → Save as PDF for a PDF copy."
    );
  };

  const totalProducts = rawProducts.length;
  const inactiveCount = rawProducts.filter((p) => p.stockQuantity === false)
    .length;
  const lowQty = rawProducts.filter(
    (p) =>
      p.minimumReorderLevel != null &&
      p.quantity != null &&
      Number(p.quantity) <= Number(p.minimumReorderLevel)
  ).length;

  const productColumns = useMemo(
    () => [
      "Date",
      "Product Name",
      "Group",
      "Category",
      "Unit",
      "Amount",
      "Actions",
    ],
    []
  );
  const priceColumns = useMemo(
    () => [
      "Product Name",
      "Packing Style",
      "Rate per Ltr",
      "GST Rate",
      "MRP Per Unit",
      "Actions",
    ],
    []
  );

  const renderProductTableFooter = useCallback((displayedRows = []) => {
    if (!displayedRows.length) return null;
    const productListAmountTotal = displayedRows.reduce((sum, row) => {
      const raw = String(row["Amount"] ?? "").replace(/[₹,\s]/g, "").trim();
      const n = Number(raw);
      return sum + (Number.isFinite(n) ? n : 0);
    }, 0);
    const formatted = `₹${productListAmountTotal.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
    return (
      <tfoot className="sticky bottom-0 z-[1] border-t-2 border-gray-300 bg-gray-100/95 dark:border-slate-600 dark:bg-slate-800/95">
        <tr>
          {productColumns.map((col) => {
            if (col === "Date") {
              return (
                <td key={col} className={tableFooterTdClasses(col)}>
                  Total
                </td>
              );
            }
            if (col === "Amount") {
              return (
                <td
                  key={col}
                  className={tableFooterTdClasses(col, {
                    extra: "text-emerald-700 dark:text-emerald-300",
                  })}
                >
                  {formatted}
                </td>
              );
            }
            return <td key={col} className={tableFooterTdClasses(col)} />;
          })}
        </tr>
      </tfoot>
    );
  }, [productColumns]);

  const resolveProduct = useCallback(
    (row) => rawProducts.find((p) => String(p._id || p.id) === String(row._id)),
    [rawProducts]
  );

  const handleView = useCallback(
    (row) => {
      const p = resolveProduct(row);
      if (!p) {
        toast.error("Product not found");
        return;
      }
      setProductModal({ open: true, mode: "view", product: p });
    },
    [resolveProduct]
  );

  const handleEdit = useCallback(
    (row) => {
      const p = resolveProduct(row);
      if (!p) {
        toast.error("Product not found");
        return;
      }
      setProductModal({ open: true, mode: "edit", product: p });
    },
    [resolveProduct]
  );

  const closeProductModal = useCallback(() => {
    setProductModal({ open: false, mode: "create", product: null });
  }, []);

  const renderProductActions = (row) => (
    <td className="px-3 py-2.5">
      <div className="flex items-center justify-center gap-2">
        <button
          type="button"
          title="View"
          className={TABLE_ACTION_ICON_BTN}
          onClick={() => handleView(row)}
        >
          <IoEyeOutline size={16} strokeWidth={2} />
        </button>
        <button
          type="button"
          title="Edit"
          className={TABLE_ACTION_ICON_BTN}
          onClick={() => handleEdit(row)}
        >
          <TbEdit size={16} strokeWidth={2} />
        </button>
        <button
          type="button"
          title="Delete"
          className={`${TABLE_ACTION_ICON_BTN} hover:bg-red-50 hover:text-red-600 hover:border-red-200 dark:hover:bg-red-950/40 dark:hover:text-red-300 dark:hover:border-red-800`}
          onClick={() => setDeleteTarget(row)}
        >
          <Trash2 size={16} strokeWidth={2} />
        </button>
      </div>
    </td>
  );

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { label: "Total products", value: isLoading ? "…" : totalProducts },
            { label: "Stock disabled", value: isLoading ? "…" : inactiveCount },
            {
              label: "At / below reorder",
              value: isLoading ? "…" : lowQty,
            },
          ].map((s) => (
            <div
              key={s.label}
              className="flex items-center justify-between gap-2 rounded-lg jitox-panel jitox-panel--shadow px-3 py-2.5"
            >
              <span className="text-xs font-medium text-gray-500 dark:text-slate-400">{s.label}</span>
              <span className="text-lg font-semibold tabular-nums text-gray-900 dark:text-slate-100">
                {s.value}
              </span>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-gray-200 pb-2 dark:border-slate-700">
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => setActiveTab("productList")}
              className={`pb-2 text-sm transition ${
                activeTab === "productList"
                  ? "text-emerald-600 font-medium border-b-2 border-emerald-600 -mb-px dark:text-emerald-400"
                  : "text-gray-600 hover:text-gray-900 border-b-2 border-transparent dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              Product list
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("priceList")}
              className={`pb-2 text-sm transition ${
                activeTab === "priceList"
                  ? "text-emerald-600 font-medium border-b-2 border-emerald-600 -mb-px dark:text-emerald-400"
                  : "text-gray-600 hover:text-gray-900 border-b-2 border-transparent dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              Price list
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto sm:justify-end">
            {activeTab === "productList" ? (
              <Button
                type="button"
                label="Add product"
                {...mergePageAddButton()}
                onClick={() =>
                  setProductModal({ open: true, mode: "create", product: null })
                }
              />
            ) : (
              <Button
                type="button"
                label="Export as PDF"
                {...mergePageAddButton({ icon: undefined })}
                onClick={exportPriceListDocument}
              />
            )}
          </div>
        </div>

        <div>
          {isLoading ? (
            <div className="py-12 text-center text-sm text-gray-500">
              Loading products…
            </div>
          ) : (
            <DataTable
              columns={
                activeTab === "productList" ? productColumns : priceColumns
              }
              data={
                activeTab === "productList" ? productRows : priceRows
              }
              renderAction={renderProductActions}
              maxHeight="calc(100vh - 18rem)"
              renderFooter={
                activeTab === "productList"
                  ? renderProductTableFooter
                  : undefined
              }
            />
          )}
        </div>

        <AddProductModal
          open={productModal.open}
          mode={productModal.mode}
          product={productModal.product}
          onClose={closeProductModal}
          onSwitchToEdit={() =>
            setProductModal((m) =>
              m.product ? { ...m, mode: "edit" } : m
            )
          }
          onSaved={() =>
            queryClient.invalidateQueries({ queryKey: ["products"] })
          }
        />

        <CommonDeleteModal
          open={Boolean(deleteTarget)}
          onClose={() => setDeleteTarget(null)}
          itemName={deleteTarget?.["Product Name"]}
          onDelete={() => {
            if (deleteTarget?._id) {
              deleteMutation.mutate(deleteTarget._id);
            }
          }}
        />
      </div>
    </DashboardLayout>
  );
};

export default ProductIndex;
