import React, { useMemo } from "react";
import dayjs from "dayjs";
import { CommonModal } from "../../../components/ui/CommanUI";

function buildViewModel(row) {
  const raw = row?._raw || {};
  const finished =
    raw.finishedProduct && typeof raw.finishedProduct === "object"
      ? raw.finishedProduct
      : null;
  const qty = Number(raw.quantityToProduce);
  const unit = String(raw.produceUnit || "").trim();
  const failedAt = raw.failedAt || raw.updatedAt;

  return {
    reason: raw.failureReason || "—",
    batchId: row?.["Batch ID"] || raw.batchCode || raw.voucherNo || "—",
    product:
      row?.["Product Name"] || finished?.productName || "—",
    attemptedQty:
      row?.["Qty Made"] ||
      (Number.isFinite(qty) && qty > 0
        ? unit
          ? `${qty} ${unit}`
          : String(qty)
        : "—"),
    dateTime: failedAt
      ? dayjs(failedAt).format("DD MMM YYYY, h:mm A")
      : "—",
    supervisor: raw.supervisorName || "—",
    remarks: raw.failureRemarks || "",
  };
}

export default function ManufacturingFailedViewModal({ open, onClose, row }) {
  const vm = useMemo(() => (row ? buildViewModel(row) : null), [row]);

  if (!vm) return null;

  return (
    <CommonModal
      open={open}
      onClose={onClose}
      title="Manufacturing Failed"
      size="md"
      bodyClassName="text-center"
    >
      <div className="flex flex-col items-center gap-4 py-2">
        <p className="text-lg font-semibold text-red">{vm.reason}</p>
        <div className="w-full space-y-2 text-sm text-slate-700 dark:text-slate-200">
          <p>
            <span className="font-medium">Batch ID:</span> {vm.batchId}
          </p>
          <p>
            <span className="font-medium">Product :</span> {vm.product}
          </p>
          <p>
            <span className="font-medium">Attempted Qty:</span> {vm.attemptedQty}
          </p>
          <p>
            <span className="font-medium">Date & Time:</span> {vm.dateTime}
          </p>
          {vm.supervisor && vm.supervisor !== "—" ? (
            <p>
              <span className="font-medium">Supervisor:</span> {vm.supervisor}
            </p>
          ) : null}
          {vm.remarks ? (
            <p className="text-left text-slate-600 dark:text-slate-400 pt-2 border-t border-light-border dark:border-slate-700">
              {vm.remarks}
            </p>
          ) : null}
        </div>
      </div>
    </CommonModal>
  );
}
