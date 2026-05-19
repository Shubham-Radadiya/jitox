import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import dayjs from "dayjs";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import DashboardLayout from "../../../layouts/DashboardLayout";
import { Button } from "../../../components/ui/CommanUI";
import PurchaseVoucherForm from "./PurchaseVoucherForm";
import { purchaseVouchersApi, quotationsApi } from "../../../services/api";
import { getApiErrorMessage } from "../../../utils/apiError";
import { invalidateProductAndStockQueries } from "../../../utils/invalidateStockQueries";
import { purchasePayloadToCreateBody } from "./purchasePayloadToApi";
import { quotationPayloadToCreateBody } from "./quotationPayloadToApi";
import { mapPurchaseApiDocToPrefill } from "./voucherFormConstants";

const AddPurchase = ({ formType = "purchase" }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const formRef = useRef(null);
  const [now, setNow] = useState(() => new Date());
  const isQuotation = formType === "quotation";
  const editId = isQuotation ? String(searchParams.get("editId") || "").trim() : "";
  const isEdit = Boolean(editId);
  const primaryCtaLabel = isQuotation
    ? isEdit
      ? "Update Quotation"
      : "Save Quotation"
    : "Continue";
  const listPath = isQuotation
    ? "/dashboard/accounting-voucher/quotation"
    : "/dashboard/accounting-voucher/purchase";

  const {
    data: quotationDoc,
    isLoading: quotationLoading,
    isError: quotationError,
    error: quotationErrObj,
  } = useQuery({
    queryKey: ["quotation-voucher-detail", editId],
    queryFn: async () => {
      const res = await quotationsApi.getById(editId);
      return res?.data;
    },
    enabled: isEdit,
    staleTime: 0,
  });

  const prefill = useMemo(() => {
    if (!isEdit || !quotationDoc) return null;
    return mapPurchaseApiDocToPrefill(quotationDoc);
  }, [isEdit, quotationDoc]);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!quotationError || !isEdit) return;
    toast.error(getApiErrorMessage(quotationErrObj, "Could not load quotation"));
  }, [quotationError, quotationErrObj, isEdit]);

  const handleCancel = () => {
    if (isQuotation) navigate(listPath);
    else navigate(-1);
  };

  return (
    <DashboardLayout>
      <div className="mx-auto w-full max-w-5xl pb-8">
        <div className="mb-4 flex flex-col gap-1 border-b border-slate-200 pb-3 sm:flex-row sm:items-center sm:justify-between dark:border-slate-600">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Live date &amp; time — Continue records the exact moment; purchase date is the field
            below.
          </p>
          <time
            dateTime={now.toISOString()}
            className="tabular-nums text-sm font-semibold text-slate-800 dark:text-slate-100"
          >
            {dayjs(now).format("DD MMM YYYY, hh:mm:ss A")}
          </time>
        </div>
        {isEdit && quotationLoading && (
          <div className="flex min-h-[240px] items-center justify-center text-sm text-slate-500 dark:text-slate-400">
            Loading quotation…
          </div>
        )}
        {isEdit && !quotationLoading && quotationError && (
          <div className="flex min-h-[200px] flex-col items-center justify-center gap-3 text-center text-sm text-red-600 dark:text-red-400">
            Could not load this quotation.
            <Button label="Back to list" variant="outline" onClick={handleCancel} />
          </div>
        )}
        {(!isEdit || (!quotationLoading && !quotationError && prefill)) && (
          <>
            <PurchaseVoucherForm
              ref={formRef}
              formType={formType}
              prefill={prefill}
              editMode={isEdit}
              showPageHeader
            />
            <div className="mt-6 flex flex-col gap-3 border-t border-slate-200 pt-4 dark:border-slate-700 sm:flex-row sm:justify-end">
              <Button
                label="Cancel"
                variant="outline"
                className="w-full sm:w-40"
                onClick={handleCancel}
              />
              <Button
                label={primaryCtaLabel}
                variant="primary"
                className="w-full sm:w-40 text-white dark:text-white"
                onClick={async () => {
                  const payload = formRef.current?.gatherPayload?.();
                  if (!payload) {
                    toast.error("Form is not ready.");
                    return;
                  }
                  const body = isQuotation
                    ? quotationPayloadToCreateBody(payload)
                    : purchasePayloadToCreateBody(payload);
                  if (!body.items?.length) {
                    toast.error(
                      "Add at least one line with a product, quantity, and rate."
                    );
                    return;
                  }
                  if (!body.partyName) {
                    toast.error(
                      "Please select Party Name (supplier) before saving."
                    );
                    return;
                  }
                  try {
                    if (isQuotation) {
                      const res = isEdit
                        ? await quotationsApi.update(editId, body)
                        : await quotationsApi.create(body);
                      const saved = res?.data;
                      const savedNo = String(
                        (saved && typeof saved === "object"
                          ? saved.voucherNo
                          : null) ??
                          body.voucherNo ??
                          "quotation"
                      );
                      await queryClient.invalidateQueries({
                        queryKey: ["voucher-list", "quotation"],
                      });
                      await queryClient.invalidateQueries({
                        queryKey: ["dashboard", "orders"],
                      });
                      await queryClient.invalidateQueries({
                        queryKey: ["purchase-form-meta"],
                      });
                      if (isEdit) {
                        await queryClient.invalidateQueries({
                          queryKey: ["quotation-voucher-detail", editId],
                        });
                      }
                      toast.success(
                        isEdit
                          ? `Quotation ${savedNo} updated.`
                          : `Quotation ${savedNo} saved.`
                      );
                      navigate(listPath);
                      return;
                    }
                    const res = await purchaseVouchersApi.create(body);
                    const d = res?.data;
                    const savedNo =
                      d && typeof d === "object"
                        ? String(d.voucherNo ?? d.data?.voucherNo ?? body.voucherNo)
                        : String(body.voucherNo);
                    await queryClient.invalidateQueries({
                      queryKey: ["voucher-list", "purchase"],
                    });
                    await queryClient.invalidateQueries({
                      queryKey: ["purchase-form-meta"],
                    });
                    invalidateProductAndStockQueries(queryClient);
                    toast.success(`Saved ${savedNo}.`);
                    navigate(listPath);
                  } catch (e) {
                    toast.error(
                      getApiErrorMessage(
                        e,
                        isQuotation
                          ? isEdit
                            ? "Could not update quotation"
                            : "Could not save quotation"
                          : "Could not save purchase voucher"
                      )
                    );
                  }
                }}
              />
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AddPurchase;
