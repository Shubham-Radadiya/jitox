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
      width="min(92vw, 560px)"
      headerClassName="!px-3 !py-2.5 sm:!px-4 sm:!py-3"
      titleClassName="!text-sm sm:!text-base"
      bodyClassName="!px-3 !pt-2 !pb-4 sm:!px-4 sm:!pt-3 sm:!pb-5"
      footerClassName="!px-3 !py-2 sm:!px-4 sm:!py-2.5"
      footer={[
        <Button
          key="cancel"
          label="Cancel"
          variant="outline"
          onClick={onClose}
          size="sm"
          className="min-h-8! px-3! py-1.5! text-xs!"
        />,
        <Button
          key="save"
          label={saving ? "Saving…" : "Save"}
          variant="primary"
          onClick={handleSave}
          disabled={saving}
          size="sm"
          className="min-h-8! px-4! py-1.5! text-xs!"
        />,
      ]}
    >
      <div className="flex flex-col gap-2.5 sm:gap-3">
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-500 dark:text-slate-400">
              Category
            </label>
            <CommonDropdown
              placeholder="Select category"
              options={dropdownOptions}
              value={categoryId}
              onChange={(v) => setCategoryId(v)}
              formCompact
              compactValue
              className="w-full"
            />
          </div>

          <InputField
            label="Document name"
            name="docName"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Fertilizer permit Q1"
            dense
            className="gap-0!"
            labelClassName="!mb-0.5 text-xs!"
            inputClassName="h-9! rounded-md text-[12px]! placeholder:text-[12px]!"
          />
        </div>

        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-500 dark:text-slate-400">
              File type
            </label>
            <CommonDropdown
              placeholder="Type"
              options={TYPE_OPTIONS}
              value={docType}
              onChange={(v) => setDocType(v)}
              formCompact
              compactValue
              className="w-full"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-500 dark:text-slate-400">
              Document date
            </label>
            <DatePicker
              className="h-9! w-full rounded-md border border-light-border px-2.5 py-0 text-[12px] dark:border-slate-600 [&_.ant-picker-input>input]:h-full [&_.ant-picker-input>input]:text-[12px]"
              value={docDate}
              onChange={(d) => setDocDate(d || dayjs())}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-gray-500 dark:text-slate-400">
            {editingDoc?.id
              ? "Replace file (optional)"
              : "File — required for new documents"}
          </label>
          <label className="flex min-h-40 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-blue-100 bg-blue-50/20 p-5 transition-all hover:bg-blue-50/40 dark:border-slate-600 dark:bg-slate-800/40 dark:hover:border-slate-500 dark:hover:bg-slate-800/65">
            <input
              type="file"
              className="sr-only"
              accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
              onChange={handlePickFile}
            />
            <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-blue-100 bg-white text-blue-500 shadow-sm dark:border-slate-600 dark:bg-slate-900">
              <div className="relative">
                <FileText size={22} />
                <span className="absolute -bottom-0.5 -right-0.5 rounded-full border-2 border-white bg-blue-500 p-0.5 text-white">
                  <UploadCloud size={9} />
                </span>
              </div>
            </div>
            <span className="text-center text-xs text-gray-600 dark:text-slate-300">
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
