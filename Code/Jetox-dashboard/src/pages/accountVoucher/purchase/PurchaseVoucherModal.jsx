import React, { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useQueryClient } from "@tanstack/react-query";
import { CommonModal } from "../../../components/ui/CommanUI";
import PurchaseVoucherForm from "./PurchaseVoucherForm";
import { buildPurchasePrefill } from "./voucherFormConstants";
import { purchaseVouchersApi } from "../../../services/api";
import { getApiErrorMessage } from "../../../utils/apiError";
import { purchasePayloadToCreateBody } from "./purchasePayloadToApi";

/**
 * Wide purchase invoice modal — Vyapar-style UI inside the dialog body.
 */
export default function PurchaseVoucherModal({
  open,
  onClose,
  sourceRow = null,
  mode = "create",
}) {
  const formRef = useRef(null);
  const queryClient = useQueryClient();
  const [now, setNow] = useState(() => new Date());
  const [mountId, setMountId] = useState(0);

  useEffect(() => {
    if (!open) return undefined;
    setMountId((k) => k + 1);
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, [open]);

  const prefill =
    open && sourceRow && (mode === "edit" || mode === "revoucher")
      ? buildPurchasePrefill(sourceRow, mode)
      : null;

  const handleInvoiceAction = async (payload, kind) => {
    const body = purchasePayloadToCreateBody(payload);
    if (!body.items?.length) {
      toast.error("Add at least one line with a product, quantity, and rate.");
      return;
    }
    if (!body.partyName) {
      toast.error("Select a party (supplier account).");
      return;
    }
    try {
      await purchaseVouchersApi.create(body);
      await queryClient.invalidateQueries({ queryKey: ["voucher-list", "purchase"] });
      await queryClient.invalidateQueries({ queryKey: ["purchase-form-meta"] });
      toast.success(
        kind === "new"
          ? `Saved ${body.voucherNo}. Form cleared for a new entry.`
          : `Saved ${body.voucherNo}.`
      );
      if (kind === "close") {
        onClose();
      } else {
        setMountId((k) => k + 1);
      }
    } catch (e) {
      toast.error(getApiErrorMessage(e, "Could not save purchase voucher"));
    }
  };

  return (
    <CommonModal
      open={open}
      onClose={onClose}
      title=""
      hideClose
      width="min(1320px, 98vw)"
      size="4xl"
      className="!max-w-[min(1320px,98vw)] w-full max-h-[min(94vh,56rem)] overflow-hidden border-slate-200/90 shadow-2xl shadow-slate-900/10 ring-1 ring-slate-900/[0.05] dark:border-slate-700 dark:shadow-black/40 dark:ring-white/5"
      bodyClassName="!p-0 !pt-0 flex min-h-0 flex-1 flex-col overflow-hidden"
      footer={null}
    >
      <PurchaseVoucherForm
        key={mountId}
        ref={formRef}
        formType="purchase"
        prefill={prefill}
        showPageHeader={false}
        layout="invoice"
        liveNow={now}
        onClose={onClose}
        onInvoiceAction={handleInvoiceAction}
      />
    </CommonModal>
  );
}
