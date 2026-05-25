import React, { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CommonModal } from "../../../components/ui/CommanUI";
import PurchaseVoucherForm from "./PurchaseVoucherForm";
import { mapPurchaseApiDocToPrefill } from "./voucherFormConstants";
import { salesReturnVouchersApi } from "../../../services/api";
import { getApiErrorMessage } from "../../../utils/apiError";
import { invalidateProductAndStockQueries } from "../../../utils/invalidateStockQueries";
import { salesReturnPayloadToCreateBody } from "./salesReturnPayloadToApi";
import { useSalesReturnFormMeta } from "../../../hooks/useSalesReturnFormMeta";

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

export default function SalesReturnModal({
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

  const isApprove = mode === "approve";
  const voucherId =
    sourceRow && typeof sourceRow === "object" ? sourceRow._id : null;
  const needsDetail = Boolean(
    open &&
      voucherId &&
      (isApprove || mode === "edit" || mode === "revoucher") &&
      !continuingAsNew
  );

  const {
    data: voucherDoc,
    isLoading: detailLoading,
    isError: detailError,
    error: detailErrObj,
  } = useQuery({
    queryKey: ["sales-return-voucher-detail", voucherId],
    queryFn: async () => {
      const res = await salesReturnVouchersApi.getById(voucherId);
      return res?.data;
    },
    enabled: needsDetail,
    staleTime: 0,
  });

  const { data: returnMeta } = useSalesReturnFormMeta(open && !isApprove);
  const nextReturnVoucherNo = returnMeta?.nextSalesReturnVoucherNo || "";

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
    toast.error(
      getApiErrorMessage(detailErrObj, "Could not load sales return")
    );
  }, [detailError, detailErrObj, open]);

  const prefill = useMemo(() => {
    if (!open) return null;
    if ((mode === "create" || continuingAsNew) && !isApprove) {
      return nextReturnVoucherNo
        ? { voucherNo: nextReturnVoucherNo, stockToggle: true }
        : { stockToggle: true };
    }
    if (!voucherDoc) return null;
    const base = mapPurchaseApiDocToPrefill(voucherDoc);
    if (!base) return null;
    if (mode === "revoucher" && nextReturnVoucherNo) {
      return { ...base, voucherNo: nextReturnVoucherNo };
    }
    return {
      ...base,
      sourceSalesId: voucherDoc.sourceSalesId,
      sourceQuotationId: voucherDoc.sourceQuotationId,
    };
  }, [open, mode, voucherDoc, continuingAsNew, nextReturnVoucherNo, isApprove]);

  const showForm =
    open &&
    (!needsDetail || (!detailLoading && !detailError && voucherDoc));

  const invalidateAfterSave = async (sourceQuotationId) => {
    await queryClient.invalidateQueries({
      queryKey: ["voucher-list", "sales-return"],
    });
    await queryClient.invalidateQueries({
      queryKey: ["sales-return-form-meta"],
    });
    await queryClient.invalidateQueries({ queryKey: ["account-ledger"] });
    await queryClient.invalidateQueries({ queryKey: ["accounts"] });
    if (sourceQuotationId) {
      await queryClient.invalidateQueries({
        queryKey: ["dashboard", "orders"],
      });
    }
    invalidateProductAndStockQueries(queryClient);
  };

  const handleInvoiceAction = async (payload, kind) => {
    const body = salesReturnPayloadToCreateBody(payload);
    if (!body.sourceSalesId && voucherDoc?.sourceSalesId) {
      body.sourceSalesId = String(
        voucherDoc.sourceSalesId?._id ?? voucherDoc.sourceSalesId
      ).trim();
    }
    if (!body.sourceQuotationId && voucherDoc?.sourceQuotationId) {
      body.sourceQuotationId = String(
        voucherDoc.sourceQuotationId?._id ?? voucherDoc.sourceQuotationId
      ).trim();
    }
    if (!body.items?.length) {
      toast.error("Enter return quantity for at least one product line.");
      return;
    }
    if (!body.partyName) {
      toast.error("Select a party (customer).");
      return;
    }
    if (!body.sourceSalesId) {
      toast.error("This return must be linked to a sales voucher.");
      return;
    }

    try {
      if (isApprove && voucherId) {
        const res = await salesReturnVouchersApi.finalize(voucherId, body);
        const savedNo = savedVoucherNoFromResponse(res, body.voucherNo);
        await invalidateAfterSave(body.sourceQuotationId);
        toast.success(
          `${savedNo} approved — stock, ledger, and order updated.`
        );
        onClose();
        return;
      }

      const isEdit =
        mode === "edit" && Boolean(voucherId) && !continuingAsNew;
      const res = isEdit
        ? await salesReturnVouchersApi.update(voucherId, body)
        : await salesReturnVouchersApi.create(body);
      const savedNo = savedVoucherNoFromResponse(res, body.voucherNo);
      await invalidateAfterSave(body.sourceQuotationId);
      toast.success(
        kind === "new"
          ? `Saved ${savedNo} as Pending. Approve from Sales Return list.`
          : `Saved ${savedNo} as Pending.`
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
          isApprove ? "Could not approve sales return" : "Could not save sales return"
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
          {isApprove
            ? "Loading return for approval…"
            : "Loading sales return…"}
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
          formType="sales-return"
          prefill={prefill}
          editMode={isApprove || mode === "edit"}
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
