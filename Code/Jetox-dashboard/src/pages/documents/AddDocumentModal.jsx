import React, { useState, useEffect, useCallback } from "react";
import {
  CommonModal,
  CommonDropdown,
  Button,
  InputField,
} from "../../components/ui/CommanUI";
import { UploadCloud, FileText } from "lucide-react";
import { DatePicker } from "antd";
import dayjs from "dayjs";
import toast from "react-hot-toast";
import { dashboardUiService } from "../../services/dashboardUi.service";
import { getApiErrorMessage } from "../../utils/apiError";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

const TYPE_OPTIONS = [
  { value: "pdf", label: "PDF" },
  { value: "word", label: "Word" },
  { value: "doc", label: "Document" },
  { value: "png", label: "Image / PNG" },
  { value: "other", label: "Other" },
];

/**
 * Create or edit a document row (metadata stored in API; optional local file name hint).
 */
const AddDocumentModal = ({
  open,
  onClose,
  categories = [],
  defaultCategoryId = "",
  editingDoc = null,
  onSaved,
}) => {
  const [categoryId, setCategoryId] = useState("");
  const [name, setName] = useState("");
  const [docType, setDocType] = useState("pdf");
  const [docDate, setDocDate] = useState(() => dayjs());
  const [saving, setSaving] = useState(false);
  const [pickedFile, setPickedFile] = useState(null);

  const dropdownOptions = categories.map((cat) => ({
    label: cat.name,
    value: String(cat.id),
  }));

  const resetForm = useCallback(() => {
    setCategoryId(defaultCategoryId ? String(defaultCategoryId) : "");
    setName("");
    setDocType("pdf");
    setDocDate(dayjs());
    setPickedFile(null);
  }, [defaultCategoryId]);

  useEffect(() => {
    if (!open) return;
    if (editingDoc) {
      setCategoryId(String(editingDoc.categoryId || ""));
      setName(editingDoc.name || "");
      setDocType(editingDoc.type || "pdf");
      setDocDate(
        editingDoc.dateIso ? dayjs(editingDoc.dateIso) : dayjs()
      );
      setPickedFile(null);
    } else {
      resetForm();
    }
  }, [open, editingDoc, resetForm]);

  const handlePickFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setPickedFile(f);
    if (!name.trim()) setName(f.name.replace(/\.[^/.]+$/, "") || f.name);
    const ext = (f.name.split(".").pop() || "").toLowerCase();
    if (ext === "pdf") setDocType("pdf");
    else if (ext === "doc" || ext === "docx") setDocType("doc");
    else if (ext === "png" || ext === "jpg" || ext === "jpeg") setDocType("png");
    e.target.value = "";
  };

  const handleSave = async () => {
    if (!categoryId) {
      toast.error("Select a category");
      return;
    }
    if (!name.trim()) {
      toast.error("Enter a document name");
      return;
    }
    const dateIso = docDate?.format?.("YYYY-MM-DD") || dayjs().format("YYYY-MM-DD");
    let fileUrl = String(editingDoc?.fileUrl || "").trim();

    if (pickedFile) {
      try {
        const fd = new FormData();
        fd.append("file", pickedFile);
        const { data } = await dashboardUiService.uploadDocumentFile(fd);
        const next = String(data?.fileUrl ?? "").trim();
        if (!next) {
          toast.error("Upload did not return a file URL");
          return;
        }
        fileUrl = next;
      } catch (upErr) {
        toast.error(getApiErrorMessage(upErr, "Upload failed"));
        return;
      }
    }

    if (!editingDoc?.id && !fileUrl) {
      toast.error("Choose a file (PDF, image, or Word) so it can be opened from the list.");
      return;
    }

    setSaving(true);
    try {
      if (editingDoc?.id) {
        const payload = {
          categoryId,
          name: name.trim(),
          type: docType,
          dateIso,
        };
        if (pickedFile && fileUrl) payload.fileUrl = fileUrl;
        await dashboardUiService.patchDocumentEntry(editingDoc.id, payload);
        toast.success("Document updated");
      } else {
        await dashboardUiService.postDocumentEntry({
          categoryId,
          name: name.trim(),
          type: docType,
          dateIso,
          fileUrl,
        });
        toast.success("Document added");
      }
      onSaved?.();
      onClose();
    } catch (err) {
      toast.error(
        getApiErrorMessage(err, editingDoc ? "Could not update" : "Could not add document")
      );
    } finally {
      setSaving(false);
    }
  };

  const title = editingDoc ? "Edit document" : "Add document";

  return (
    <CommonModal
      open={open}
      onClose={onClose}
      title={title}
      width="650px"
      footer={[
        <Button
          key="cancel"
          label="Cancel"
          variant="outline"
          onClick={onClose}
          className="px-5"
        />,
        <Button
          key="save"
          label={saving ? "Saving…" : "Save"}
          variant="primary"
          onClick={handleSave}
          disabled={saving}
          className="px-8"
        />,
      ]}
    >
      <div className="ds-modal-body-stack">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-500 dark:text-slate-400">
            Category
          </label>
          <CommonDropdown
            placeholder="Select category"
            options={dropdownOptions}
            value={categoryId}
            onChange={(v) => setCategoryId(v)}
            className="w-full min-h-12 rounded-xl"
          />
        </div>

        <InputField
          label="Document name"
          name="docName"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Fertilizer permit Q1"
          className="rounded-xl"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-500 dark:text-slate-400">
              File type
            </label>
            <CommonDropdown
              placeholder="Type"
              options={TYPE_OPTIONS}
              value={docType}
              onChange={(v) => setDocType(v)}
              className="w-full min-h-12 rounded-xl"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-500 dark:text-slate-400">
              Document date
            </label>
            <DatePicker
              className="w-full min-h-12 rounded-xl border border-light-border px-3 dark:border-slate-600"
              value={docDate}
              onChange={(d) => setDocDate(d || dayjs())}
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-500 dark:text-slate-400">
            {editingDoc?.id
              ? "Replace file (optional)"
              : "File — required for new documents"}
          </label>
          <label className="border-2 border-dashed border-blue-100 bg-blue-50/20 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-blue-50/40 transition-all dark:border-slate-600 dark:bg-slate-800/40">
            <input
              type="file"
              className="sr-only"
              accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
              onChange={handlePickFile}
            />
            <div className="w-14 h-14 bg-white rounded-xl shadow-sm flex items-center justify-center text-blue-500 border border-blue-100 dark:bg-slate-900 dark:border-slate-600">
              <div className="relative">
                <FileText size={28} />
                <span className="absolute -bottom-0.5 -right-0.5 bg-blue-500 text-white rounded-full p-0.5 border-2 border-white">
                  <UploadCloud size={11} />
                </span>
              </div>
            </div>
            <span className="text-sm text-center text-gray-600 dark:text-slate-300">
              Click to choose PDF, Word, or image (max 20 MB). The eye button opens this file in a new tab.
            </span>
            {pickedFile && (
              <span className="text-xs font-semibold text-primary break-all">
                Selected: {pickedFile.name}
              </span>
            )}
            {editingDoc?.fileUrl && !pickedFile && (
              <button
                type="button"
                className="text-xs font-bold text-blue-600 hover:underline"
                onClick={() =>
                  window.open(
                    `${API_BASE}${editingDoc.fileUrl}`,
                    "_blank",
                    "noopener,noreferrer"
                  )
                }
              >
                Open current file
              </button>
            )}
          </label>
        </div>
      </div>
    </CommonModal>
  );
};

export default AddDocumentModal;
