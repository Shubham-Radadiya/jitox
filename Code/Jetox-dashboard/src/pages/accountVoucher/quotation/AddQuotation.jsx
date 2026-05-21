import React, { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

/**
 * Legacy route — redirects to the quotation list and opens the same
 * wide invoice modal used for sales vouchers.
 */
const AddQuotation = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = String(searchParams.get("editId") || "").trim();

  useEffect(() => {
    navigate("/dashboard/accounting-voucher/quotation", {
      replace: true,
      state: editId
        ? { openQuotationEditId: editId }
        : { openQuotationCreate: true },
    });
  }, [editId, navigate]);

  return null;
};

export default AddQuotation;
