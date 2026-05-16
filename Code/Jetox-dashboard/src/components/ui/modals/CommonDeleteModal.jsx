import React from "react";
import { CommonModal } from "../CommanUI";
import { AlertTriangle } from "lucide-react";

/**
 * CommonDeleteModal Component
 * Generic confirmation modal for deletion.
 * Default layout is compact; pass `compact` for an extra-small dialog (mobile/tight UIs).
 */
const CommonDeleteModal = ({
  open,
  onClose,
  onDelete,
  title = "Delete Item?",
  itemName = "",
  message = "Are you sure you want to delete this from your records?",
  compact = false,
}) => {
  /** Wide enough for the default English warning on one line at `text-sm` (still scrolls on very narrow viewports). */
  const modalWidth = compact
    ? "min(260px, 90vw)"
    : "min(34rem, calc(100vw - 2rem))";
  const innerPad = compact ? "px-3 py-2" : "px-4 py-3 sm:px-5";
  const nameClass = compact
    ? "text-base font-bold text-dark mb-1.5 leading-snug"
    : "text-lg font-bold text-dark mb-2 leading-snug";
  const warnMb = compact ? "mb-3" : "mb-4";
  const iconSize = compact ? 15 : 16;
  const msgClass = compact
    ? "text-[12px] leading-snug"
    : "text-sm leading-snug whitespace-nowrap";
  const btnClass = "py-1.5 text-xs font-medium leading-tight";

  return (
    <CommonModal
      open={open}
      onClose={onClose}
      title={title}
      width={modalWidth}
      headerClassName="py-2 px-3 sm:py-2 sm:px-4 border-light-border"
      titleClassName="!text-sm font-semibold"
      bodyClassName="!px-0 !pt-0 !pb-0 sm:!px-0 sm:!pb-0 sm:!pt-0 scroll-pb-0"
    >
      <div className={`flex flex-col items-center text-center ${innerPad}`}>
        {itemName ? <h2 className={nameClass}>{itemName}</h2> : null}

        <div
          className={`flex w-full min-w-0 max-w-full flex-nowrap items-start justify-center gap-1.5 overflow-x-auto text-left text-red font-medium [scrollbar-width:thin] ${warnMb}`}
        >
          <AlertTriangle
            size={iconSize}
            className="mt-0.5 shrink-0"
            strokeWidth={2.25}
            aria-hidden
          />
          <p className={`shrink-0 ${msgClass}`}>{message}</p>
        </div>

        <div className="flex w-full max-w-full overflow-hidden rounded-md border border-light-border dark:border-slate-600">
          <button
            type="button"
            onClick={onDelete}
            className={`flex-1 ${btnClass} text-red transition-colors hover:bg-red/5 dark:hover:bg-red-950/25 border-r border-light-border dark:border-slate-600`}
          >
            Yes, Delete
          </button>
          <button
            type="button"
            onClick={onClose}
            className={`flex-1 ${btnClass} text-dark transition-colors hover:bg-gray-50 dark:hover:bg-slate-800/80`}
          >
            Cancel
          </button>
        </div>
      </div>
    </CommonModal>
  );
};

export default CommonDeleteModal;
