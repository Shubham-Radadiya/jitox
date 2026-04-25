import React, { useState, useMemo, useEffect, useCallback } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import DataTable from "../../components/ui/table/DataTable";
import { Button } from "../../components/ui/CommanUI";
import { Calendar } from "lucide-react";
import { IoEyeOutline, IoTrashOutline } from "react-icons/io5";
import { TbEdit } from "react-icons/tb";
import AddSchemeModal from "./AddSchemeModal";
import SchemeSuccessModal from "./SchemeSuccessModal";
import CommonDeleteModal from "../../components/ui/modals/CommonDeleteModal";
import CommonDeleteSuccessModal from "../../components/ui/modals/CommonDeleteSuccessModal";
import { dashboardUiService } from "../../services/dashboardUi.service";
import toast from "react-hot-toast";
import { TABLE_ACTION_ICON_BTN } from "../../utils/tableUi";
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
    <td className="px-3 py-2.5 align-middle text-center border-b border-gray-200 dark:border-slate-700">
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
      className="px-4 py-3 text-xs text-gray-600 align-middle dark:text-slate-200"
    >
      {value ?? "-"}
    </td>
  );

  const pageSize = 4;
  const showingFrom = schemes.length ? 1 : 0;
  const showingTo = Math.min(pageSize, schemes.length);

  return (
    <DashboardLayout>
      <div className="ds-stack-major">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-dark">All Scheme</h1>
            <span className="bg-blue/10 text-blue text-xs font-bold px-2 py-0.5 rounded-full">
              {totalCount}
            </span>
          </div>
          <div className="jitox-header-pill">
            <Calendar size={16} className="text-gray-400 dark:text-slate-500" />
            20 Jan, 2:30 PM
          </div>
        </div>

        <div className="rounded-2xl jitox-panel jitox-panel--shadow flex flex-col">
          <div className="p-4 flex flex-wrap justify-between items-center gap-3">
            <h2 className="text-base font-bold text-dark">Scheme List</h2>
            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="button"
                label="Add scheme"
                {...mergePageAddButton()}
                onClick={handleAdd}
              />
            </div>
          </div>

          <DataTable
            columns={columns}
            data={loading ? [] : schemes}
            renderRowCell={renderRowCell}
            renderAction={renderAction}
            className="border-none shadow-none"
            loading={loading}
          />

          <div className="p-4 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2 bg-white rounded-b-2xl dark:border-slate-700 dark:bg-slate-900">
            <div className="text-xs text-gray-400 font-medium dark:text-slate-400">
              Showing {showingFrom} - {showingTo} of {schemes.length} results
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-slate-400">
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
