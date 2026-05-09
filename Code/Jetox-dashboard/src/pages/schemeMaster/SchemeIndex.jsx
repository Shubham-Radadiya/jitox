import React, { useState, useMemo, useEffect, useCallback } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import DataTable from "../../components/ui/table/DataTable";
import { Button } from "../../components/ui/CommanUI";
import { Calendar, Search } from "lucide-react";
import { IoEyeOutline, IoTrashOutline } from "react-icons/io5";
import { TbEdit } from "react-icons/tb";
import AddSchemeModal from "./AddSchemeModal";
import SchemeSuccessModal from "./SchemeSuccessModal";
import CommonDeleteModal from "../../components/ui/modals/CommonDeleteModal";
import CommonDeleteSuccessModal from "../../components/ui/modals/CommonDeleteSuccessModal";
import { dashboardUiService } from "../../services/dashboardUi.service";
import toast from "react-hot-toast";
import { TABLE_ACTION_ICON_BTN, tableTdClasses } from "../../utils/tableUi";
import { mergePageAddButton } from "../../utils/pageAddButton";

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

  const columns = useMemo(
    () => [
      "Scheme Name",
      "Applied Products",
      "Type",
      "Target Audience",
      "Offer Name",
      "Start Date",
      "End Date",
      { label: "Actions", key: "Actions" },
    ],
    []
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
      list = list.filter((r) =>
        String(r["Scheme Name"] ?? "")
          .toLowerCase()
          .includes(q)
      );
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
    <td className={tableTdClasses("Actions")}>
      <div className="inline-flex flex-nowrap items-center justify-center gap-2">
        <button
          type="button"
          title="View scheme"
          className={TABLE_ACTION_ICON_BTN}
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
          className={TABLE_ACTION_ICON_BTN}
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
          className={`${TABLE_ACTION_ICON_BTN} hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-300`}
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

  const renderRowCell = (colKey, value) => (
    <td
      key={colKey}
      className={`${tableTdClasses(colKey)} py-2.5! text-sm text-gray-600 dark:text-slate-200`}
    >
      {value ?? "-"}
    </td>
  );

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
              columns={columns}
              data={loading ? [] : filteredSchemes}
              renderRowCell={renderRowCell}
              renderAction={renderAction}
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

        <AddSchemeModal
          open={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          scheme={selectedScheme}
          mode={modalMode}
          onSuccess={async (payload) => {
            try {
              if (modalMode === "add") {
                await dashboardUiService.createScheme({
                  schemeName: payload["Scheme Name"] || payload.name,
                  appliedProducts: payload.applicable || payload["Applied Products"],
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
                });
                toast.success("Scheme added");
              }
              setSelectedScheme(payload);
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
