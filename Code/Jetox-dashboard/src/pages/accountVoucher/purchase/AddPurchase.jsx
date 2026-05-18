import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import dayjs from "dayjs";
import { useQueryClient } from "@tanstack/react-query";
import DashboardLayout from "../../../layouts/DashboardLayout";
import { Button } from "../../../components/ui/CommanUI";
import PurchaseVoucherForm from "./PurchaseVoucherForm";
import { purchaseVouchersApi, quotationsApi } from "../../../services/api";
import { getApiErrorMessage } from "../../../utils/apiError";
import { invalidateProductAndStockQueries } from "../../../utils/invalidateStockQueries";
import { purchasePayloadToCreateBody } from "./purchasePayloadToApi";
import { quotationPayloadToCreateBody } from "./quotationPayloadToApi";

const AddPurchase = ({ formType = "purchase" }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const formRef = useRef(null);
  const [now, setNow] = useState(() => new Date());
  const isQuotation = formType === "quotation";
  const primaryCtaLabel = isQuotation ? "Save Quotation" : "Continue";

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

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
        <PurchaseVoucherForm
          ref={formRef}
          formType={formType}
          prefill={null}
          showPageHeader
        />
        <div className="mt-6 flex flex-col gap-3 border-t border-slate-200 pt-4 dark:border-slate-700 sm:flex-row sm:justify-end">
          <Button
            label="Cancel"
            variant="outline"
            className="w-full sm:w-40"
            onClick={() => navigate(-1)}
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
                toast.error("Add at least one line with a product, quantity, and rate.");
                return;
              }
              if (!body.partyName) {
                toast.error("Select a party.");
                return;
              }
              try {
                if (isQuotation) {
                  const res = await quotationsApi.create(body);
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
                  toast.success(`Quotation ${savedNo} saved.`);
                  navigate("/dashboard/accounting-voucher/quotation");
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
                navigate("/dashboard/accounting-voucher/purchase");
              } catch (e) {
                toast.error(
                  getApiErrorMessage(
                    e,
                    isQuotation
                      ? "Could not save quotation"
                      : "Could not save purchase voucher"
                  )
                );
              }
            }}
          />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AddPurchase;
