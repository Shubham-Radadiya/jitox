import React, { useState, useEffect, useCallback, useRef } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import {
  Plus,
  Search,
  Calendar,
  Eye,
  Download,
  Trash2,
  Edit3,
  FileText,
  File,
  Share2,
  Copy,
  Mail,
  MessageCircle,
} from "lucide-react";
import useOutsideClick from "../../hooks/useOutsideClick";
import { DatePicker } from "antd";
import AddCategoryModal from "./AddCategoryModal";
import AddDocumentModal from "./AddDocumentModal";
import { dashboardUiService } from "../../services/dashboardUi.service";
import toast from "react-hot-toast";
import { getApiErrorMessage } from "../../utils/apiError";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

const { RangePicker } = DatePicker;

const FALLBACK = {
  gridSections: [
    {
      id: "1",
      name: "Government Licenses & Certificates",
      icon: "📋",
      count: 3,
      documents: [
        { id: "101", categoryId: "1", name: "Pesticide Permit", date: "01-Jan-2025", admin: "Admin Name", type: "pdf", dateIso: "2025-01-01" },
        { id: "102", categoryId: "1", name: "Organic Certifications", date: "01-Jan-2025", admin: "Admin Name", type: "pdf", dateIso: "2025-01-01" },
        { id: "103", categoryId: "1", name: "GST Or Business Licenses", date: "01-Jan-2025", admin: "Admin Name", type: "doc", dateIso: "2025-01-01" },
      ],
    },
    {
      id: "2",
      name: "Training Manuals & Guides",
      icon: "📘",
      count: 3,
      documents: [
        { id: "201", categoryId: "2", name: "Crop Care", date: "10-Jan-2025", admin: "Admin Name", type: "pdf", dateIso: "2025-01-10" },
        { id: "202", categoryId: "2", name: "Fertilizer Usage", date: "10-Jan-2025", admin: "Admin Name", type: "word", dateIso: "2025-01-10" },
        { id: "203", categoryId: "2", name: "Equipment Manual", date: "10-Jan-2025", admin: "Admin Name", type: "pdf", dateIso: "2025-01-10" },
      ],
    },
    {
      id: "5",
      name: "Agreements & Contracts",
      icon: "📝",
      count: 3,
      documents: [
        { id: "501", categoryId: "5", name: "Farmer Agreement", date: "10-Jan-2025", admin: "Admin Name", type: "png", dateIso: "2025-01-10" },
        { id: "502", categoryId: "5", name: "Distributor MOUs", date: "10-Jan-2025", admin: "Admin Name", type: "pdf", dateIso: "2025-01-10" },
        { id: "503", categoryId: "5", name: "Vendor Contracts", date: "10-Jan-2025", admin: "Admin Name", type: "doc", dateIso: "2025-01-10" },
      ],
    },
    {
      id: "3",
      name: "Reports",
      icon: "📊",
      count: 3,
      documents: [
        { id: "301", categoryId: "3", name: "Harvest Reports", date: "15-Jan-2025", admin: "Admin Name", type: "pdf", dateIso: "2025-01-15" },
        { id: "302", categoryId: "3", name: "Market Rate Analysis", date: "16-Jan-2025", admin: "Admin Name", type: "pdf", dateIso: "2025-01-16" },
        { id: "303", categoryId: "3", name: "Seasonal Crop", date: "17-Jan-2025", admin: "Admin Name", type: "word", dateIso: "2025-01-17" },
      ],
    },
    {
      id: "4",
      name: "Product Catalogs",
      icon: "🛍️",
      count: 2,
      documents: [
        { id: "401", categoryId: "4", name: "Seed Varieties", date: "18-Jan-2025", admin: "Admin Name", type: "pdf", dateIso: "2025-01-18" },
        { id: "402", categoryId: "4", name: "Agrochemical Product Catalog", date: "19-Jan-2025", admin: "Admin Name", type: "pdf", dateIso: "2025-01-19" },
      ],
    },
  ],
  sidebarCategories: [
    { id: "1", name: "Government Licenses & Certificates", icon: "📋", count: 3 },
    { id: "2", name: "Training Manuals & Guides", icon: "📘", count: 3 },
    { id: "3", name: "Reports", icon: "📊", count: 3 },
    { id: "4", name: "Product Catalogs", icon: "🛍️", count: 2 },
  ],
};

const DocumentsIndex = () => {
  const [activeCategory, setActiveCategory] = useState("All");
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isDocumentModalOpen, setIsDocumentModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [dateRange, setDateRange] = useState(null);
  const [gridSections, setGridSections] = useState(FALLBACK.gridSections);
  const [sidebarCategories, setSidebarCategories] = useState(FALLBACK.sidebarCategories);
  const [categoriesForModal, setCategoriesForModal] = useState(
    [...FALLBACK.sidebarCategories, { id: "5", name: "Agreements & Contracts", icon: "📝", count: 3 }]
  );
  const [documentModalCategoryId, setDocumentModalCategoryId] = useState("");
  const [editingDocument, setEditingDocument] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  const loadDocuments = useCallback(async () => {
    const params = {};
    if (debouncedSearch) params.q = debouncedSearch;
    if (dateRange?.[0]) params.from = dateRange[0].format("YYYY-MM-DD");
    if (dateRange?.[1]) params.to = dateRange[1].format("YYYY-MM-DD");

    try {
      const { data } = await dashboardUiService.getDocuments(params);
      if (data?.gridSections?.length) {
        setGridSections(data.gridSections);
      }
      if (data?.sidebarCategories?.length) {
        setSidebarCategories(data.sidebarCategories);
      }
      if (data?.gridSections?.length) {
        setCategoriesForModal(
          data.gridSections.map((s) => ({
            id: s.id,
            name: s.name,
            icon: s.icon,
            count: s.count,
          }))
        );
      }
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not load documents"));
      let sections = FALLBACK.gridSections;
      let side = FALLBACK.sidebarCategories;
      const q = (debouncedSearch || "").toLowerCase();
      const from = dateRange?.[0]?.format("YYYY-MM-DD");
      const to = dateRange?.[1]?.format("YYYY-MM-DD");
      if (q || from || to) {
        sections = sections.map((sec) => ({
          ...sec,
          documents: sec.documents.filter((d) => {
            if (q && !d.name.toLowerCase().includes(q)) return false;
            if (from && d.dateIso < from) return false;
            if (to && d.dateIso > to) return false;
            return true;
          }),
          count: sec.documents.filter((d) => {
            if (q && !d.name.toLowerCase().includes(q)) return false;
            if (from && d.dateIso < from) return false;
            if (to && d.dateIso > to) return false;
            return true;
          }).length,
        }));
      }
      setGridSections(sections);
      setSidebarCategories(side);
      const agr = FALLBACK.gridSections.find((s) => s.id === "5");
      setCategoriesForModal([
        ...side.map((c) => ({ ...c })),
        ...(agr ? [{ id: agr.id, name: agr.name, icon: agr.icon, count: agr.count }] : []),
      ]);
    }
  }, [debouncedSearch, dateRange]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const handleAddCategory = async (newCat) => {
    await dashboardUiService.postDocumentCategory({ name: newCat.name });
    toast.success("Category created");
    await loadDocuments();
  };

  const openAddDocument = (categoryId) => {
    setEditingDocument(null);
    setDocumentModalCategoryId(categoryId || "");
    setIsDocumentModalOpen(true);
  };

  const openEditDocument = (doc) => {
    if (!/^[a-f\d]{24}$/i.test(String(doc.id))) {
      toast.error("Edit is only available for documents loaded from the server.");
      return;
    }
    setEditingDocument({
      id: doc.id,
      categoryId: doc.categoryId,
      name: doc.name,
      type: doc.type,
      dateIso: doc.dateIso,
      fileUrl: doc.fileUrl,
    });
    setDocumentModalCategoryId(doc.categoryId || "");
    setIsDocumentModalOpen(true);
  };

  const handleViewDocument = (doc) => {
    const path = String(doc.fileUrl || "").trim();
    if (path.startsWith("/uploads/")) {
      window.open(
        `${API_BASE}${path}`,
        "_blank",
        "noopener,noreferrer"
      );
      return;
    }
    toast.error(
      "No file is attached to this document. Use Edit and upload a PDF, Word, or image file."
    );
  };

  const handleDownloadDocument = async (doc) => {
    const path = String(doc.fileUrl || "").trim();
    if (!path.startsWith("/uploads/")) {
      toast.error(
        "No file attached — upload a file when adding or editing this document."
      );
      return;
    }
    const url = `${API_BASE}${path}`;
    const token =
      typeof localStorage !== "undefined"
        ? localStorage.getItem("token") || localStorage.getItem("access_token")
        : null;
    try {
      const res = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error(String(res.status));
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      const base = path.split("/").pop() || "document";
      a.download = base.split("?")[0] || "document";
      a.rel = "noopener";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(objectUrl);
      toast.success("Download started");
    } catch {
      window.open(url, "_blank", "noopener,noreferrer");
      toast.success("Opened file in a new tab — use your browser Save option if needed.");
    }
  };

  const handleDeleteDocument = async (doc) => {
    if (!doc?.id) return;
    if (!/^[a-f\d]{24}$/i.test(String(doc.id))) {
      toast.error("This item is offline demo data. Load documents from the server to delete.");
      return;
    }
    const ok = window.confirm(`Delete “${doc.name}”? This cannot be undone.`);
    if (!ok) return;
    try {
      await dashboardUiService.deleteDocumentEntry(doc.id);
      toast.success("Document removed");
      await loadDocuments();
    } catch (e) {
      toast.error(getApiErrorMessage(e, "Could not delete document"));
    }
  };

  const closeDocumentModal = () => {
    setIsDocumentModalOpen(false);
    setEditingDocument(null);
    setDocumentModalCategoryId("");
  };

  const visibleSections =
    activeCategory === "All"
      ? gridSections
      : gridSections.filter((s) => s.name === activeCategory);

  return (
    <DashboardLayout>
      <div className="flex min-h-[calc(100dvh-4rem)] w-full max-w-full bg-[#F8F9FE] dark:bg-slate-950">
        <div className="w-64 shrink-0 bg-white border-r border-gray-100 flex flex-col pt-6 dark:bg-slate-900 dark:border-slate-700">
          <div className="px-5 mb-6 flex items-center justify-between">
            <h2 className="text-base font-bold text-dark">Category</h2>
            <button
              type="button"
              onClick={() => setIsCategoryModalOpen(true)}
              className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
            >
              <Plus size={12} strokeWidth={3} /> Add
            </button>
          </div>

          <div className="flex flex-col">
            <button
              type="button"
              onClick={() => setActiveCategory("All")}
              className={`px-5 py-3.5 text-sm font-bold text-left transition-all relative
                  ${activeCategory === "All" ? "text-primary bg-blue-50/50 dark:bg-primary/15" : "text-gray-500 hover:text-dark dark:text-slate-400 dark:hover:text-slate-100"}`}
            >
              {activeCategory === "All" && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r" />
              )}
              All
            </button>
            {sidebarCategories.map((cat) => (
              <button
                type="button"
                key={cat.id}
                onClick={() => setActiveCategory(cat.name)}
                className={`px-5 py-4 text-sm font-bold text-left transition-all relative border-b border-gray-50 last:border-0 dark:border-slate-700
                    ${activeCategory === cat.name ? "text-primary bg-blue-50/50 dark:bg-primary/15" : "text-gray-500 hover:text-dark dark:text-slate-400 dark:hover:text-slate-100"}`}
              >
                {activeCategory === cat.name && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r" />
                )}
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h1 className="text-xl font-bold text-dark">All Documents</h1>
            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-xl jitox-panel jitox-panel--shadow px-3 py-2 flex items-center gap-2 w-72 max-w-full">
                <Search size={18} className="text-gray-400 shrink-0 dark:text-slate-500" />
                <input
                  type="text"
                  placeholder="Search Document"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="bg-transparent border-none outline-none text-sm w-full font-medium text-dark placeholder:text-gray-400 dark:text-slate-100 dark:placeholder:text-slate-500"
                />
              </div>
              <div className="rounded-xl jitox-panel jitox-panel--shadow px-3 py-2 flex items-center gap-2">
                <Calendar size={18} className="text-gray-400 shrink-0 dark:text-slate-500" />
                <RangePicker
                  className="border-none shadow-none p-0 text-sm font-medium [&_.ant-picker-input]:placeholder:text-gray-400 dark:[&_.ant-picker-input]:placeholder:text-slate-500"
                  placeholder={["Date: From", "To"]}
                  suffixIcon={null}
                  value={dateRange}
                  onChange={(v) => setDateRange(v)}
                />
              </div>
            </div>
          </div>

          <div className="ds-stack-major">
            {visibleSections.map((cat) => (
              <div
                key={cat.id}
                className="rounded-2xl jitox-panel jitox-panel--shadow p-4 flex flex-col gap-4"
              >
                <div className="flex items-center gap-3">
                  <div className="text-xl">{cat.icon}</div>
                  <h3 className="text-base font-bold text-dark">{cat.name}</h3>
                  <span className="bg-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded leading-none">
                    {cat.count}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {cat.documents?.map((doc) => (
                    <DocumentCard
                      key={doc.id}
                      doc={doc}
                      apiBase={API_BASE}
                      onView={() => handleViewDocument(doc)}
                      onDownload={() => handleDownloadDocument(doc)}
                      onEdit={() => openEditDocument(doc)}
                      onDelete={() => handleDeleteDocument(doc)}
                    />
                  ))}
                  <button
                    type="button"
                    onClick={() => openAddDocument(cat.id)}
                    className="border-2 border-dashed border-gray-200 rounded-2xl p-4 flex flex-col items-center justify-center gap-3 group hover:bg-gray-50 transition-all min-h-[160px] dark:border-slate-600 dark:hover:bg-slate-800/50"
                  >
                    <div className="text-gray-300 group-hover:text-primary transition-colors dark:text-slate-600">
                      <Plus size={24} />
                    </div>
                    <span className="text-xs font-bold text-gray-400 group-hover:text-dark transition-colors dark:text-slate-500 dark:group-hover:text-slate-200">
                      Add Documents
                    </span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <AddCategoryModal
          open={isCategoryModalOpen}
          onClose={() => setIsCategoryModalOpen(false)}
          onSave={handleAddCategory}
        />
        <AddDocumentModal
          open={isDocumentModalOpen}
          onClose={closeDocumentModal}
          categories={categoriesForModal}
          defaultCategoryId={documentModalCategoryId}
          editingDoc={editingDocument}
          onSaved={loadDocuments}
        />
      </div>
    </DashboardLayout>
  );
};

function buildDocumentSharePayload(doc, apiBase) {
  const path = String(doc.fileUrl || "").trim();
  const fileUrl =
    path.startsWith("/uploads/") && apiBase
      ? `${String(apiBase).replace(/\/$/, "")}${path}`
      : "";
  const pageUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}${window.location.pathname}`
      : "";
  const primaryUrl = fileUrl || pageUrl;
  const shareText = fileUrl
    ? `${doc.name}\n${fileUrl}`
    : `${doc.name}\nOpen this document in JETOX (Documents) to view or attach a file.\n${pageUrl}`;
  return { fileUrl, primaryUrl, shareText, hasFile: Boolean(fileUrl) };
}

function DocumentShareMenu({ doc, apiBase }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  useOutsideClick(wrapRef, () => setOpen(false));

  const { primaryUrl, shareText, hasFile } = buildDocumentSharePayload(doc, apiBase);
  const canUseNativeShare =
    typeof navigator !== "undefined" && typeof navigator.share === "function";

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(primaryUrl);
      toast.success("Link copied to clipboard");
      setOpen(false);
    } catch {
      toast.error("Could not copy — try selecting the link manually");
    }
  };

  const shareEmail = () => {
    const subject = `Document: ${doc.name}`;
    const body = shareText;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setOpen(false);
  };

  const shareWhatsApp = () => {
    window.open(
      `https://wa.me/?text=${encodeURIComponent(shareText)}`,
      "_blank",
      "noopener,noreferrer"
    );
    setOpen(false);
  };

  const shareNative = async () => {
    try {
      await navigator.share({
        title: doc.name,
        text: shareText,
        url: primaryUrl,
      });
      setOpen(false);
    } catch (e) {
      if (e?.name !== "AbortError") {
        toast.error("Could not open system share");
      }
    }
  };

  const itemClass =
    "flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800";

  return (
    <div className="relative" ref={wrapRef}>
      <DocAction
        icon={<Share2 size={14} />}
        label="Share document"
        className={open ? "!border-primary !text-primary" : ""}
        onClick={() => setOpen((v) => !v)}
      />
      {open && (
        <div
          role="menu"
          className="absolute bottom-full left-1/2 z-30 mb-1 min-w-[12.5rem] -translate-x-1/2 rounded-xl border border-slate-200 bg-white py-1 shadow-lg ring-1 ring-black/5 dark:border-slate-600 dark:bg-slate-900 dark:ring-white/10"
        >
          <button type="button" role="menuitem" className={itemClass} onClick={copyLink}>
            <Copy size={14} className="shrink-0 text-slate-500" />
            Copy link
          </button>
          <button type="button" role="menuitem" className={itemClass} onClick={shareEmail}>
            <Mail size={14} className="shrink-0 text-slate-500" />
            Email…
          </button>
          <button type="button" role="menuitem" className={itemClass} onClick={shareWhatsApp}>
            <MessageCircle size={14} className="shrink-0 text-slate-500" />
            WhatsApp
          </button>
          {canUseNativeShare && (
            <button type="button" role="menuitem" className={itemClass} onClick={shareNative}>
              <Share2 size={14} className="shrink-0 text-slate-500" />
              Share via device
            </button>
          )}
          {!hasFile && (
            <p className="px-3 pb-2 pt-0.5 text-[10px] leading-snug text-amber-700 dark:text-amber-300">
              No file attached — link opens the Documents page. Upload a file to share the
              download URL.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

const DocumentCard = ({ doc, apiBase, onView, onDownload, onEdit, onDelete }) => {
  const getIcon = () => {
    switch (doc.type) {
      case "pdf":
        return <FileText className="text-red-500" size={24} />;
      case "word":
        return <File className="text-blue-500" size={24} />;
      case "doc":
        return <File className="text-blue-600" size={24} />;
      case "png":
        return <File className="text-orange-500" size={24} />;
      default:
        return <FileText className="text-gray-400" size={24} />;
    }
  };

  return (
    <div className="rounded-2xl jitox-panel jitox-panel--shadow flex flex-col hover:shadow-md transition-shadow duration-300 overflow-visible dark:hover:shadow-[0_4px_16px_rgba(0,0,0,0.35)]">
      <div className="p-4 flex items-center gap-3 border-b border-gray-50 dark:border-slate-700">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            doc.type === "pdf"
              ? "bg-red-50 dark:bg-red-950/40"
              : doc.type === "word" || doc.type === "doc"
                ? "bg-blue-50 dark:bg-blue-950/40"
                : "bg-orange-50 dark:bg-orange-950/40"
          }`}
        >
          {getIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold text-dark truncate">{doc.name}</div>
        </div>
      </div>
      <div className="px-4 py-3 flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter dark:text-slate-400">{doc.date}</span>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter truncate dark:text-slate-400">{doc.admin}</span>
        </div>
      </div>
      <div className="mt-auto relative z-10 flex flex-wrap items-center justify-center gap-2 px-3 py-2.5 bg-gray-100 border-t border-gray-100 dark:bg-slate-800/80 dark:border-slate-700">
        <DocumentShareMenu doc={doc} apiBase={apiBase} />
        <DocAction
          icon={<Eye size={14} />}
          label="View details"
          onClick={onView}
        />
        <DocAction
          icon={<Download size={14} />}
          label="Download"
          onClick={onDownload}
        />
        <DocAction
          icon={<Trash2 size={14} />}
          label="Delete"
          className="!text-red-400 hover:!text-red-500"
          onClick={onDelete}
        />
        <DocAction
          icon={<Edit3 size={14} />}
          label="Edit"
          onClick={onEdit}
        />
      </div>
    </div>
  );
};

const DocAction = ({ icon, className = "", onClick, label }) => (
  <button
    type="button"
    aria-label={label}
    title={label}
    onClick={(e) => {
      e.stopPropagation();
      onClick?.();
    }}
    className={`w-8 h-8 rounded-lg border border-blue-200 bg-white flex items-center justify-center text-blue-500 hover:text-blue-700 hover:bg-blue-50/80 transition-all dark:border-slate-600 dark:bg-slate-800 dark:text-sky-400 dark:hover:bg-slate-700 dark:hover:text-sky-300 ${className}`}
  >
    {icon}
  </button>
);

export default DocumentsIndex;
