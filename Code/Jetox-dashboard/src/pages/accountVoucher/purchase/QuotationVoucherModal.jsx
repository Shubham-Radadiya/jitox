import React, { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CommonModal } from "../../../components/ui/CommanUI";
import PurchaseVoucherForm from "./PurchaseVoucherForm";
import {
  mapPurchaseApiDocToPrefill,
  quotationInvoiceFieldsFromNo,
} from "./voucherFormConstants";
import { quotationsApi } from "../../../services/api";
import { getApiErrorMessage } from "../../../utils/apiError";
import {
  quotationPayloadToCreateBody,
  quotationPayloadToUpdateBody,
} from "./quotationPayloadToApi";
import { usePurchaseFormMeta } from "../../../hooks/usePurchaseFormMeta";

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
 * Wide quotation modal — same invoice UI as sales (`layout="invoice"`).
 */
export default function QuotationVoucherModal({
  open,
  onClose,
  sourceRow = null,
  mode = "create",
}) {
  const formRef = useRef(null);
  const queryClient = useQueryClient();
  const [now, setNow] = useState(() => new Date());
  const [mountId, setMountId] = useState(0);
  const [continuingAsNew, setContinuingAsNew] = useState(false);

  const voucherId =
    sourceRow && typeof sourceRow === "object" ? sourceRow._id : null;
  const needsDetail =
    Boolean(open && voucherId && mode === "edit" && !continuingAsNew);

  const {
    data: voucherDoc,
    isLoading: detailLoading,
    isError: detailError,
    error: detailErrObj,
  } = useQuery({
    queryKey: ["quotation-voucher-detail", voucherId],
    queryFn: async () => {
      const res = await quotationsApi.getById(voucherId);
      return res?.data;
    },
    enabled: needsDetail,
    staleTime: 0,
  });

  const { data: purchaseMeta } = usePurchaseFormMeta(open);
  const nextQuotationVoucherNo = purchaseMeta?.nextQuotationVoucherNo || "";

  useEffect(() => {
    if (!open) {
      setContinuingAsNew(false);
      return undefined;
    }
    setMountId((k) => k + 1);
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, [open]);

  useEffect(() => {
    setContinuingAsNew(false);
  }, [voucherId, mode]);

  useEffect(() => {
    if (!detailError || !open) return;
    toast.error(getApiErrorMessage(detailErrObj, "Could not load quotation"));
  }, [detailError, detailErrObj, open]);

  const prefill = useMemo(() => {
    if (!open) return null;
    if (mode === "create" || continuingAsNew) {
      if (nextQuotationVoucherNo) {
        return {
          stockToggle: false,
          voucherNo: nextQuotationVoucherNo,
          ...quotationInvoiceFieldsFromNo(nextQuotationVoucherNo),
        };
      }
      return { stockToggle: false };
    }
    if (!voucherDoc) return null;
    return mapPurchaseApiDocToPrefill(voucherDoc);
  }, [open, mode, voucherDoc, continuingAsNew, nextQuotationVoucherNo]);

  const showForm =
    open && (!needsDetail || (!detailLoading && !detailError && voucherDoc));

  const handleInvoiceAction = async (payload, kind) => {
    const body = quotationPayloadToCreateBody(payload);
    if (!body.items?.length) {
      toast.error("Add at least one line with a product, quantity, and rate.");
      return;
    }
    if (!body.partyName) {
      toast.error("Select a party (customer account).");
      return;
    }
    const isEdit = mode === "edit" && Boolean(voucherId) && !continuingAsNew;
    const saveBody = isEdit
      ? quotationPayloadToUpdateBody(payload, voucherDoc)
      : body;
    try {
      const res = isEdit
        ? await quotationsApi.update(voucherId, saveBody)
        : await quotationsApi.create(body);
      const savedNo = savedVoucherNoFromResponse(res, body.voucherNo);
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["voucher-list", "quotation"],
        }),
        queryClient.invalidateQueries({ queryKey: ["dashboard", "orders"] }),
        queryClient.invalidateQueries({ queryKey: ["purchase-form-meta"] }),
      ]);
      if (voucherId) {
        await queryClient.invalidateQueries({
          queryKey: ["quotation-voucher-detail", voucherId],
        });
      }
      toast.success(
        kind === "new"
          ? `Quotation ${savedNo} saved. Form cleared for a new quote.`
          : isEdit
            ? `Quotation ${savedNo} updated.`
            : `Quotation ${savedNo} saved.`
      );
      if (kind === "close") {
        onClose();
      } else {
        setContinuingAsNew(true);
        setMountId((k) => k + 1);
      }
    } catch (e) {
      toast.error(
        getApiErrorMessage(
          e,
          isEdit ? "Could not update quotation" : "Could not save quotation"
        )
      );
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
          Loading quotation…
        </div>
      )}
      {needsDetail && !detailLoading && detailError && (
        <div className="flex min-h-[200px] flex-1 flex-col items-center justify-center gap-2 px-6 text-center text-sm text-red-600 dark:text-red-400">
          Could not load this quotation. Close and try again.
        </div>
      )}
      {showForm && (
        <PurchaseVoucherForm
          key={mountId}
          ref={formRef}
          formType="quotation"
          prefill={prefill}
          editMode={mode === "edit" && !continuingAsNew}
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
