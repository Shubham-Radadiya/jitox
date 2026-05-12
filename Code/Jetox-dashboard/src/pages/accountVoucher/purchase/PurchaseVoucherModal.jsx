import React, { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CommonModal } from "../../../components/ui/CommanUI";
import PurchaseVoucherForm from "./PurchaseVoucherForm";
import {
  mapPurchaseApiDocToPrefill,
  nextRevoucherNumber,
} from "./voucherFormConstants";
import { purchaseVouchersApi } from "../../../services/api";
import { getApiErrorMessage } from "../../../utils/apiError";
import { purchasePayloadToCreateBody } from "./purchasePayloadToApi";

function savedVoucherNoFromResponse(res, fallbackNo) {
  const d = res?.data;
  if (d && typeof d === "object") {
    if (d.voucherNo != null && String(d.voucherNo).trim() !== "") {
      return String(d.voucherNo);
    }
    if (d.data?.voucherNo != null && String(d.data.voucherNo).trim() !== "") {
      return String(d.data.voucherNo);
    }
  }
  return String(fallbackNo ?? "");
}

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
  /**
   * After “Save & New”, we must create the next voucher (not update the one we were editing)
   * and show a blank form with the next voucher no. from meta.
   */
  const [continuingAsNew, setContinuingAsNew] = useState(false);

  const voucherId =
    sourceRow && typeof sourceRow === "object" ? sourceRow._id : null;
  const needsDetail =
    Boolean(open && voucherId && (mode === "edit" || mode === "revoucher")) &&
    !continuingAsNew;

  const {
    data: voucherDoc,
    isLoading: detailLoading,
    isError: detailError,
    error: detailErrObj,
  } = useQuery({
    queryKey: ["purchase-voucher-detail", voucherId],
    queryFn: async () => {
      const res = await purchaseVouchersApi.getById(voucherId);
      return res?.data;
    },
    enabled: needsDetail,
    staleTime: 0,
  });

  useEffect(() => {
    if (!open) {
      setContinuingAsNew(false);
      return undefined;
    }
    setMountId((k) => k + 1);
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, [open]);

  /** Switching list row / mode starts a fresh edit session (not “continue as new”). */
  useEffect(() => {
    setContinuingAsNew(false);
  }, [voucherId, mode]);

  useEffect(() => {
    if (!detailError || !open) return;
    toast.error(
      getApiErrorMessage(detailErrObj, "Could not load purchase voucher")
    );
  }, [detailError, detailErrObj, open]);

  const prefill = useMemo(() => {
    if (!open || mode === "create" || continuingAsNew) return null;
    if (!voucherDoc) return null;
    const base = mapPurchaseApiDocToPrefill(voucherDoc);
    if (!base) return null;
    if (mode === "revoucher") {
      return {
        ...base,
        voucherNo: nextRevoucherNumber(voucherDoc.voucherNo || "V000"),
      };
    }
    return base;
  }, [open, mode, voucherDoc, continuingAsNew]);

  const showForm =
    open &&
    (!needsDetail || (!detailLoading && !detailError && voucherDoc));

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
    const isEdit =
      mode === "edit" && Boolean(voucherId) && !continuingAsNew;
    try {
      const res = isEdit
        ? await purchaseVouchersApi.update(voucherId, body)
        : await purchaseVouchersApi.create(body);
      const savedNo = savedVoucherNoFromResponse(res, body.voucherNo);
      await queryClient.invalidateQueries({ queryKey: ["voucher-list", "purchase"] });
      await queryClient.invalidateQueries({ queryKey: ["purchase-form-meta"] });
      await queryClient.invalidateQueries({
        queryKey: ["purchase-voucher-detail", voucherId],
      });
      toast.success(
        kind === "new"
          ? `Saved ${savedNo}. Form cleared for a new entry.`
          : `Saved ${savedNo}.`
      );
      if (kind === "close") {
        onClose();
      } else {
        setContinuingAsNew(true);
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
      width="1320px"
      size="4xl"
      shellClassName="max-sm:!px-3 max-sm:!py-4 sm:!p-5"
      className="w-full max-h-[min(92dvh,56rem)] overflow-hidden border-slate-200/90 shadow-2xl shadow-slate-900/10 ring-1 ring-slate-900/[0.05] dark:border-slate-700 dark:shadow-black/40 dark:ring-white/5 max-sm:max-h-[min(100dvh-5.5rem,56rem)]"
      bodyClassName="!p-0 !pt-0 flex min-h-0 flex-1 flex-col overflow-hidden"
      footer={null}
    >
      {needsDetail && detailLoading && (
        <div className="flex min-h-[240px] flex-1 items-center justify-center px-6 text-sm text-slate-500 dark:text-slate-400">
          Loading purchase invoice…
        </div>
      )}
      {needsDetail && !detailLoading && detailError && (
        <div className="flex min-h-[200px] flex-1 flex-col items-center justify-center gap-2 px-6 text-center text-sm text-red-600 dark:text-red-400">
          Could not load this voucher. Close and try again.
        </div>
      )}
      {showForm && (
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
      )}
    </CommonModal>
  );
}
