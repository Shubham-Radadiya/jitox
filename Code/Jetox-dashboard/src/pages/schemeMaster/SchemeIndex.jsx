import React, {
  useState,
  useMemo,
  useEffect,
  useCallback,
  useRef,
} from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import DataTable from "../../components/ui/table/DataTable";
import { Button } from "../../components/ui/CommanUI";
import { Calendar, Search, Plus, X } from "lucide-react";
import { IoEyeOutline, IoTrashOutline } from "react-icons/io5";
import { TbEdit } from "react-icons/tb";
import AddSchemeModal from "./AddSchemeModal";
import SchemeSuccessModal from "./SchemeSuccessModal";
import CommonDeleteModal from "../../components/ui/modals/CommonDeleteModal";
import CommonDeleteSuccessModal from "../../components/ui/modals/CommonDeleteSuccessModal";
import { dashboardUiService } from "../../services/dashboardUi.service";
import toast from "react-hot-toast";
import { TABLE_ACTION_ICON_BTN_DENSE, tableTdClasses, STATUS_CELL_INNER, schemeLifecycleBadgeClasses } from "../../utils/tableUi";
import { mergePageAddButton } from "../../utils/pageAddButton";
import { tableColumnKey } from "../../hooks/TableCustomHook";
import { getSchemeLifecycleStatus } from "../../utils/schemeLifecycleStatus";
import { stripJitoxDemoProductNamePrefix } from "./schemeProductDropdownUtils";

const COLUMN_PICKER_MAX_WIDTH_PX = 224;

/** localStorage: visible column keys in table order (survives reload). */
const SCHEME_TABLE_COLUMNS_STORAGE_KEY =
  "jetox.dashboard.schemeMaster.selectedColumnKeys";

/** Full column set for scheme list (order preserved when toggling visibility). */
const SCHEME_TABLE_BASE_COLUMNS = [
  "Scheme Name",
  "Scheme Description",
  "Applied Products",
  "Type",
  "Target Audience",
  "Offer Name",
  "Start Date",
  "End Date",
  "Status",
  { label: "Actions", key: "Actions" },
];

function readSchemeTableColumnsFromStorage() {
  if (typeof window === "undefined") return SCHEME_TABLE_BASE_COLUMNS;
  try {
    const raw = localStorage.getItem(SCHEME_TABLE_COLUMNS_STORAGE_KEY);
    if (!raw) return SCHEME_TABLE_BASE_COLUMNS;
    const keys = JSON.parse(raw);
    if (!Array.isArray(keys) || keys.length === 0)
      return SCHEME_TABLE_BASE_COLUMNS;
    const baseKeySet = new Set(
      SCHEME_TABLE_BASE_COLUMNS.map((c) => tableColumnKey(c))
    );
    const filteredKeys = keys.filter(
      (k) => typeof k === "string" && baseKeySet.has(k)
    );
    if (!filteredKeys.length) return SCHEME_TABLE_BASE_COLUMNS;
    if (!filteredKeys.includes("Actions")) filteredKeys.push("Actions");
    const visible = new Set(filteredKeys);
    const ordered = SCHEME_TABLE_BASE_COLUMNS.filter((c) =>
      visible.has(tableColumnKey(c))
    );
    if (ordered.length < 2) return SCHEME_TABLE_BASE_COLUMNS;
    return ordered;
  } catch {
    return SCHEME_TABLE_BASE_COLUMNS;
  }
}

function schemeBodyFromPayload(payload) {
  return {
    schemeName: payload["Scheme Name"] || payload.name,
    schemeDescription: String(
      payload.description ?? payload["Scheme Description"] ?? ""
    ).trim(),
    appliedProducts: (() => {
      const raw = String(
        payload.applicable ?? payload["Applied Products"] ?? ""
      ).trim();
      const s = stripJitoxDemoProductNamePrefix(raw);
      return s || "-";
    })(),
    schemeType: payload.type || payload["Type"],
    targetAudience: payload.targetAudience || payload["Target Audience"],
    offerDetails: payload.offerDetails || payload["Offer Name"],
    startDate:
      payload.startDate?.format?.("DD MMM, YYYY") ||
      payload["Start Date"] ||
      "",
    endDate:
      payload.endDate?.format?.("DD MMM, YYYY") ||
      payload["End Date"] ||
      "",
  };
}

const SchemeIndex = () => {
  const [schemes, setSchemes] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleteSuccessOpen, setIsDeleteSuccessOpen] = useState(false);
  const [selectedScheme, setSelectedScheme] = useState(null);
  const [modalMode, setModalMode] = useState("add");
  const [schemeSearch, setSchemeSearch] = useState("");
  const [audienceFilter, setAudienceFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  const [isColumnPickerOpen, setIsColumnPickerOpen] = useState(false);
  const [columnPickerPosition, setColumnPickerPosition] = useState({
    top: 0,
    left: 0,
  });
  const columnPickerButtonRef = useRef(null);
  const columnPickerPopupRef = useRef(null);

  const [selectedColumns, setSelectedColumns] = useState(
    readSchemeTableColumnsFromStorage
  );

  useEffect(() => {
    try {
      const keys = selectedColumns.map((c) => tableColumnKey(c));
      localStorage.setItem(
        SCHEME_TABLE_COLUMNS_STORAGE_KEY,
        JSON.stringify(keys)
      );
    } catch {
      /* ignore quota / private mode */
    }
  }, [selectedColumns]);

  useEffect(() => {
    if (!isColumnPickerOpen) return undefined;

    const handleClickOutside = (event) => {
      const clickedInsidePopup = columnPickerPopupRef.current?.contains(
        event.target
      );
      const clickedTrigger = columnPickerButtonRef.current?.contains(
        event.target
      );
      if (!clickedInsidePopup && !clickedTrigger) {
        setIsColumnPickerOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isColumnPickerOpen]);

  const computeColumnPickerPosition = useCallback(() => {
    const btn = columnPickerButtonRef.current;
    if (!btn) return null;
    const rect = btn.getBoundingClientRect();
    const vw = window.innerWidth;
    const margin = 12;
    const popoverW = Math.min(COLUMN_PICKER_MAX_WIDTH_PX, vw - 2 * margin);
    const half = popoverW / 2;
    const centerX = rect.left + rect.width / 2;
    const clampedLeft = Math.min(
      Math.max(centerX, half + margin),
      vw - half - margin
    );
    return { top: rect.bottom + 8, left: clampedLeft };
  }, []);

  useEffect(() => {
    if (!isColumnPickerOpen) return undefined;
    const update = () => {
      const next = computeColumnPickerPosition();
      if (next) setColumnPickerPosition(next);
    };
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [isColumnPickerOpen, computeColumnPickerPosition]);

  const handleToggleSchemeColumn = useCallback((column) => {
    const colKey = tableColumnKey(column);
    if (colKey === "Actions" || colKey === "Action") return;
    setSelectedColumns((prev) => {
      const nextKeys = new Set(prev.map((c) => tableColumnKey(c)));
      if (nextKeys.has(colKey)) nextKeys.delete(colKey);
      else nextKeys.add(colKey);
      nextKeys.add("Actions");
      return SCHEME_TABLE_BASE_COLUMNS.filter((c) =>
        nextKeys.has(tableColumnKey(c))
      );
    });
  }, []);

  const toggleColumnPicker = useCallback(() => {
    if (!isColumnPickerOpen && columnPickerButtonRef.current) {
      const next = computeColumnPickerPosition();
      if (next) setColumnPickerPosition(next);
    }
    setIsColumnPickerOpen((prev) => !prev);
  }, [isColumnPickerOpen, computeColumnPickerPosition]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await dashboardUiService.getSchemes({});
      setSchemes(data.schemes || []);
      setTotalCount(data.total ?? (data.schemes || []).length);
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to load schemes");
      setSchemes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const renderSchemeActionsHeader = useCallback(
    () => (
      <div className="inline-flex">
        <button
          type="button"
          ref={columnPickerButtonRef}
          onClick={toggleColumnPicker}
          className="flex h-7 w-7 items-center justify-center rounded-full border border-light-border bg-white shadow-sm hover:bg-gray-50 hover:shadow-md dark:border-slate-600 dark:bg-slate-800 dark:hover:bg-slate-700"
          aria-expanded={isColumnPickerOpen}
          aria-haspopup="dialog"
          aria-label="Choose visible columns"
        >
          <Plus
            size={16}
            className="text-slate-800 dark:text-emerald-400"
            strokeWidth={2.25}
          />
        </button>
      </div>
    ),
    [isColumnPickerOpen, toggleColumnPicker]
  );

  const audienceOptions = useMemo(() => {
    const seen = new Set();
    schemes.forEach((r) => {
      const v = String(r["Target Audience"] ?? "").trim();
      if (v && v !== "-" && v !== "—") seen.add(v);
    });
    return [...seen].sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: "base" })
    );
  }, [schemes]);

  const typeOptions = useMemo(() => {
    const seen = new Set();
    schemes.forEach((r) => {
      const v = String(r["Type"] ?? "").trim();
      if (v && v !== "-" && v !== "—") seen.add(v);
    });
    return [...seen].sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: "base" })
    );
  }, [schemes]);

  const filteredSchemes = useMemo(() => {
    let list = schemes;
    const q = schemeSearch.trim().toLowerCase();
    if (q) {
      list = list.filter((r) => {
        const name = String(r["Scheme Name"] ?? "").toLowerCase();
        const desc = String(r["Scheme Description"] ?? "").toLowerCase();
        return name.includes(q) || desc.includes(q);
      });
    }
    if (audienceFilter) {
      list = list.filter(
        (r) => String(r["Target Audience"] ?? "") === audienceFilter
      );
    }
    if (typeFilter) {
      list = list.filter((r) => String(r["Type"] ?? "") === typeFilter);
    }
    return list;
  }, [schemes, schemeSearch, audienceFilter, typeFilter]);

  const schemeRowsForTable = useMemo(
    () =>
      filteredSchemes.map((r) => ({
        ...r,
        Status: getSchemeLifecycleStatus(r),
      })),
    [filteredSchemes]
  );

  const handleAdd = () => {
    setSelectedScheme(null);
    setModalMode("add");
    setIsAddModalOpen(true);
  };

  const handleEdit = (scheme) => {
    setSelectedScheme(scheme);
    setModalMode("edit");
    setIsAddModalOpen(true);
  };

  const handleDelete = (scheme) => {
    setSelectedScheme(scheme);
    setIsDeleteModalOpen(true);
  };

  const handleView = (scheme) => {
    setSelectedScheme(scheme);
    setModalMode("view");
    setIsAddModalOpen(true);
  };

  const renderAction = (row) => (
    <td className={tableTdClasses("Actions", { dense: true })}>
      <div className="inline-flex flex-nowrap items-center justify-center gap-1.5">
        <button
          type="button"
          title="View scheme"
          className={TABLE_ACTION_ICON_BTN_DENSE}
          onClick={(e) => {
            e.stopPropagation();
            handleView(row);
          }}
        >
          <IoEyeOutline size={18} />
        </button>
        <button
          type="button"
          title="Edit scheme"
          className={TABLE_ACTION_ICON_BTN_DENSE}
          onClick={(e) => {
            e.stopPropagation();
            handleEdit(row);
          }}
        >
          <TbEdit size={18} />
        </button>
        <button
          type="button"
          title="Delete scheme"
          className={`${TABLE_ACTION_ICON_BTN_DENSE} hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-300`}
          onClick={(e) => {
            e.stopPropagation();
            handleDelete(row);
          }}
        >
          <IoTrashOutline size={18} />
        </button>
      </div>
    </td>
  );

  const renderRowCell = (colKey, value) => {
    if (colKey === "Status") {
      const label = value ?? "—";
      return (
        <td
          key={colKey}
          className={`${tableTdClasses(colKey, { dense: true })} text-sm text-gray-600 dark:text-slate-200`}
        >
          <div className={STATUS_CELL_INNER}>
            <span className={schemeLifecycleBadgeClasses(label)}>{label}</span>
          </div>
        </td>
      );
    }
    return (
      <td
        key={colKey}
        className={`${tableTdClasses(colKey, { dense: true })} text-sm text-gray-600 dark:text-slate-200`}
      >
        {value ?? "-"}
      </td>
    );
  };

  const pageSize = 4;
  const showingFrom = filteredSchemes.length ? 1 : 0;
  const showingTo = Math.min(pageSize, filteredSchemes.length);

  return (
    <DashboardLayout>
      <div className="ds-stack-major">
        <div className="flex min-w-0 flex-nowrap items-center justify-between gap-2 sm:gap-3">
          <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
            <h1 className="min-w-0 truncate whitespace-nowrap text-base font-bold text-dark sm:text-xl !mb-0">
              All Scheme
            </h1>
            <span className="mt-0.5 rounded-full bg-blue/10 px-1.5 py-0.5 text-[10px] font-bold text-blue sm:mt-0 sm:px-2 sm:text-xs">
              {totalCount}
            </span>
          </div>
          <div className="jitox-header-pill shrink-0 gap-1.5 whitespace-nowrap px-2 py-1 text-[11px] leading-none sm:gap-2 sm:px-3 sm:py-1.5 sm:text-sm sm:leading-normal">
            <Calendar className="h-3.5 w-3.5 text-gray-400 dark:text-slate-500 sm:h-4 sm:w-4" />
            20 Jan, 2:30 PM
          </div>
        </div>

        <div className="rounded-2xl jitox-panel jitox-panel--shadow flex flex-col overflow-hidden">
          <div className="flex flex-col gap-2 border-b border-gray-100 p-3 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:p-4 dark:border-slate-700">
            <h2 className="min-w-0 shrink-0 truncate text-sm font-bold text-dark sm:text-base dark:text-slate-100">
              Scheme List
            </h2>
            <div className="flex w-full min-w-0 flex-row flex-wrap items-center justify-end gap-2 sm:ml-auto sm:w-full md:w-auto md:flex-nowrap">
              <div className="relative w-full min-w-0 sm:w-full md:w-auto md:flex-none md:min-w-[16rem] md:max-w-[22rem]">
                <Search
                  className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500"
                  strokeWidth={2}
                  aria-hidden
                />
                <input
                  type="search"
                  enterKeyHint="search"
                  placeholder="Search by scheme name…"
                  aria-label="Search by scheme name"
                  className="h-9 w-full rounded-lg border border-slate-200 bg-white py-0 pl-9 pr-2.5 text-sm text-dark placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                  value={schemeSearch}
                  onChange={(e) => setSchemeSearch(e.target.value)}
                />
              </div>
              <div className="flex w-full min-w-0 flex-wrap items-center gap-2 sm:w-full sm:justify-end md:w-auto md:flex-none md:flex-nowrap">
                <select
                  aria-label="Filter by target audience"
                  className="h-9 min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-2.5 py-0 text-sm text-dark sm:min-w-[9.5rem] sm:flex-1 md:flex-none dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                  value={audienceFilter}
                  onChange={(e) => setAudienceFilter(e.target.value)}
                >
                  <option value="">All audiences</option>
                  {audienceOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
                <select
                  aria-label="Filter by type"
                  className="h-9 min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-2.5 py-0 text-sm text-dark sm:min-w-[8.5rem] sm:flex-1 md:flex-none dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                >
                  <option value="">All types</option>
                  {typeOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
                <Button
                  type="button"
                  label="Add scheme"
                  {...mergePageAddButton({
                    size: "sm",
                    className:
                      "w-full sm:w-auto !h-9 !min-h-9 !max-h-9 shrink-0 gap-1.5 !py-0 !px-3.5 !text-sm font-semibold [&_svg]:!h-4 [&_svg]:!w-4 sm:!px-4",
                  })}
                  onClick={handleAdd}
                />
              </div>
            </div>
          </div>

          <div className="px-3 py-2.5 sm:px-5 sm:py-4">
            <DataTable
              columns={selectedColumns}
              data={loading ? [] : schemeRowsForTable}
              renderRowCell={renderRowCell}
              renderAction={renderAction}
              renderActionsHeader={renderSchemeActionsHeader}
              loading={loading}
              tableClassName="whitespace-nowrap text-sm"
            />
          </div>

          <div className="px-4 py-3 sm:px-5 sm:py-4 border-t border-gray-100 flex flex-col items-center justify-center gap-2 text-center sm:flex-row sm:justify-between sm:text-left bg-white dark:border-slate-700 dark:bg-slate-900">
            <div className="text-xs text-gray-400 font-medium dark:text-slate-400">
              Showing {showingFrom} - {showingTo} of {filteredSchemes.length}{" "}
              results
            </div>
            <div className="flex items-center justify-center gap-3 text-xs text-gray-500 dark:text-slate-400">
              <span>Results per page:</span>
              <select className="border-none outline-none font-bold text-dark cursor-pointer bg-transparent dark:text-slate-200">
                <option>{pageSize}</option>
              </select>
            </div>
          </div>
        </div>

        {isColumnPickerOpen && (
          <div className="fixed inset-0 z-[999]">
            <div
              ref={columnPickerPopupRef}
              className="absolute w-[min(14rem,calc(100vw-1.5rem))] max-w-[calc(100vw-1.5rem)] -translate-x-1/2 overflow-hidden rounded-lg border border-light-border bg-white shadow-lg dark:border-slate-600 dark:bg-slate-900 dark:shadow-xl dark:shadow-black/40"
              style={{
                top: columnPickerPosition.top,
                left: columnPickerPosition.left,
              }}
              role="dialog"
              aria-label="Add column"
            >
              <div className="flex justify-between border-b border-light-border bg-slate-50 px-4 py-3 dark:border-slate-600 dark:bg-slate-800">
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Add Column
                </div>
                <button
                  type="button"
                  onClick={() => setIsColumnPickerOpen(false)}
                  className="rounded-md p-0.5 text-slate-600 transition hover:bg-slate-200/90 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white"
                  aria-label="Close"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="flex max-h-60 flex-col gap-2 overflow-y-auto p-3 dark:bg-slate-900">
                {SCHEME_TABLE_BASE_COLUMNS.map((column, colIdx) => {
                  const colKey = tableColumnKey(column);
                  const colLabel =
                    typeof column === "string"
                      ? column
                      : column?.label ?? column?.key ?? colKey;
                  const isActions =
                    colKey === "Actions" || colKey === "Action";
                  const isChecked =
                    isActions ||
                    selectedColumns.some(
                      (c) => tableColumnKey(c) === colKey
                    );
                  return (
                    <label
                      key={colKey ? `col-${colKey}` : `col-idx-${colIdx}`}
                      className="flex cursor-pointer items-center gap-3 rounded-md px-1 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        disabled={isActions}
                        onChange={() => handleToggleSchemeColumn(column)}
                        className="h-4 w-4 rounded border-slate-300 text-primary accent-primary focus:ring-primary/30 dark:border-slate-500 dark:bg-slate-900"
                      />
                      <span className="text-sm text-slate-800 dark:text-slate-100">
                        {colLabel}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        <AddSchemeModal
          open={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          scheme={selectedScheme}
          mode={modalMode}
          onSuccess={async (payload) => {
            try {
              const body = schemeBodyFromPayload(payload);
              let nextSelected = payload;

              if (modalMode === "add") {
                const { data } = await dashboardUiService.createScheme(body);
                toast.success("Scheme added");
                if (data?.scheme) nextSelected = { ...payload, ...data.scheme };
              } else if (modalMode === "edit") {
                const id = String(payload?.id ?? selectedScheme?.id ?? "");
                if (!id) {
                  toast.error("Missing scheme id");
                  return;
                }
                const { data } = await dashboardUiService.updateScheme(
                  id,
                  body
                );
                toast.success("Scheme updated");
                if (data?.scheme) nextSelected = { ...payload, ...data.scheme };
              }

              setSelectedScheme(nextSelected);
              setIsAddModalOpen(false);
              setIsSuccessModalOpen(true);
              await load();
            } catch (e) {
              toast.error(e?.response?.data?.message || "Save failed");
            }
          }}
        />

        <SchemeSuccessModal
          open={isSuccessModalOpen}
          onClose={() => setIsSuccessModalOpen(false)}
          onEditAgain={() => {
            setIsSuccessModalOpen(false);
            setModalMode(selectedScheme?.id ? "edit" : "add");
            setIsAddModalOpen(true);
          }}
          scheme={selectedScheme}
          mode={modalMode}
        />

        <CommonDeleteModal
          open={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          itemName={selectedScheme?.["Scheme Name"]}
          onDelete={async () => {
            try {
              if (selectedScheme?.id) {
                await dashboardUiService.deleteScheme(selectedScheme.id);
              }
              setSchemes((s) => s.filter((x) => x.id !== selectedScheme?.id));
              setIsDeleteModalOpen(false);
              setIsDeleteSuccessOpen(true);
              await load();
            } catch (e) {
              toast.error(e?.response?.data?.message || "Delete failed");
            }
          }}
        />

        <CommonDeleteSuccessModal
          open={isDeleteSuccessOpen}
          onClose={() => setIsDeleteSuccessOpen(false)}
        />
      </div>
    </DashboardLayout>
  );
};

export default SchemeIndex;
