import React, { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CommonModal } from "../../../components/ui/CommanUI";
import PurchaseVoucherForm from "./PurchaseVoucherForm";
import { mapPurchaseApiDocToPrefill } from "./voucherFormConstants";
import { purchaseReturnVouchersApi } from "../../../services/api";
import { getApiErrorMessage } from "../../../utils/apiError";
import { invalidateProductAndStockQueries } from "../../../utils/invalidateStockQueries";
import { purchaseReturnPayloadToCreateBody } from "./purchaseReturnPayloadToApi";
import { usePurchaseReturnFormMeta } from "../../../hooks/usePurchaseReturnFormMeta";

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
 * Wide purchase-return modal — reuses PurchaseVoucherForm with `formType="purchase-return"`
 * so the UI stays identical to purchase invoicing. Save calls `purchaseReturnVouchersApi`,
 * and stock decrement is handled server-side based on the stock toggle.
 */
export default function PurchaseReturnModal({
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
   * After “Save & New”, we must create the next return (not update the one we were editing)
   * and show a blank form with the next return voucher no. from meta.
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
    queryKey: ["purchase-return-voucher-detail", voucherId],
    queryFn: async () => {
      const res = await purchaseReturnVouchersApi.getById(voucherId);
      return res?.data;
    },
    enabled: needsDetail,
    staleTime: 0,
  });

  const { data: returnMeta } = usePurchaseReturnFormMeta(open);
  const nextReturnVoucherNo = returnMeta?.nextPurchaseReturnVoucherNo || "";

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
      getApiErrorMessage(detailErrObj, "Could not load purchase return voucher")
    );
  }, [detailError, detailErrObj, open]);

  /**
   * Prefill rules:
   *  - create / continuing-as-new: just push the next return voucher no. into the form
   *  - edit: full prefill from the loaded doc (voucherNo preserved)
   *  - revoucher: full prefill but voucherNo replaced with the next available no.
   */
  const prefill = useMemo(() => {
    if (!open) return null;
    if (mode === "create" || continuingAsNew) {
      return nextReturnVoucherNo ? { voucherNo: nextReturnVoucherNo } : null;
    }
    if (!voucherDoc) return null;
    const base = mapPurchaseApiDocToPrefill(voucherDoc);
    if (!base) return null;
    if (mode === "revoucher" && nextReturnVoucherNo) {
      return { ...base, voucherNo: nextReturnVoucherNo };
    }
    return base;
  }, [open, mode, voucherDoc, continuingAsNew, nextReturnVoucherNo]);

  const showForm =
    open &&
    (!needsDetail || (!detailLoading && !detailError && voucherDoc));

  const handleInvoiceAction = async (payload, kind) => {
    const body = purchaseReturnPayloadToCreateBody(payload);
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
        ? await purchaseReturnVouchersApi.update(voucherId, body)
        : await purchaseReturnVouchersApi.create(body);
      const savedNo = savedVoucherNoFromResponse(res, body.voucherNo);
      await queryClient.invalidateQueries({
        queryKey: ["voucher-list", "purchase-return"],
      });
      await queryClient.invalidateQueries({
        queryKey: ["purchase-return-form-meta"],
      });
      if (voucherId) {
        await queryClient.invalidateQueries({
          queryKey: ["purchase-return-voucher-detail", voucherId],
        });
      }
      invalidateProductAndStockQueries(queryClient);
      toast.success(
        kind === "new"
          ? `Saved ${savedNo}. Form cleared for a new return.`
          : `Saved ${savedNo}.`
      );
      if (kind === "close") {
        onClose();
      } else {
        setContinuingAsNew(true);
        setMountId((k) => k + 1);
      }
    } catch (e) {
      toast.error(getApiErrorMessage(e, "Could not save purchase return"));
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
          Loading purchase return…
        </div>
      )}
      {needsDetail && !detailLoading && detailError && (
        <div className="flex min-h-[200px] flex-1 flex-col items-center justify-center gap-2 px-6 text-center text-sm text-red-600 dark:text-red-400">
          Could not load this return. Close and try again.
        </div>
      )}
      {showForm && (
        <PurchaseVoucherForm
          key={mountId}
          ref={formRef}
          formType="purchase-return"
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
