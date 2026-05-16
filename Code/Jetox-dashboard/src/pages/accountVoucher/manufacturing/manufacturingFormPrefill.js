import dayjs from "dayjs";

export function productIdFromRef(product) {
  if (product == null || product === "") return "";
  if (typeof product === "object" && product._id != null) {
    return String(product._id);
  }
  return String(product).trim();
}

/**
 * Map GET manufacturing voucher → AddManufacturing form state.
 */
export function mapManufacturingApiToForm(doc, { getProductUnit, getProductRate }) {
  if (!doc) return null;

  const finishedId = productIdFromRef(doc.finishedProduct);
  const finishedPop =
    doc.finishedProduct && typeof doc.finishedProduct === "object"
      ? doc.finishedProduct
      : null;

  const rawMaterials = (Array.isArray(doc.rawMaterials) ? doc.rawMaterials : []).map(
    (line, index) => {
      const pid = productIdFromRef(line.product);
      const pop =
        line.product && typeof line.product === "object" ? line.product : null;
      const name = String(pop?.productName ?? "—");
      return {
        id: `raw-${index}-${pid}`,
        productId: pid,
        name,
        requiredQty:
          line.requiredQty != null ? String(line.requiredQty) : "",
        unit: line.unit || (pop ? getProductUnit(pop) : "Unit"),
        rate: String(
          line.ratePerUnit != null
            ? line.ratePerUnit
            : pop
              ? getProductRate(pop)
              : ""
        ),
      };
    }
  );

  const additionalCosts = (
    Array.isArray(doc.additionalCosts) ? doc.additionalCosts : []
  ).map((line, index) => ({
    id: `cost-${index}`,
    account: line.account || "labor",
    qty: line.qty != null ? String(line.qty) : "",
    unit: line.unit || "",
    rate: line.rate != null ? String(line.rate) : "",
  }));

  return {
    voucherNo: String(doc.voucherNo || ""),
    batchCode: String(doc.batchCode || ""),
    mfgDate: doc.mfgDate
      ? dayjs(doc.mfgDate).format("YYYY-MM-DD")
      : dayjs().format("YYYY-MM-DD"),
    expDate: doc.expDate
      ? dayjs(doc.expDate).format("YYYY-MM-DD")
      : dayjs().add(30, "day").format("YYYY-MM-DD"),
    finishedProductId: finishedId,
    quantityToProduce:
      doc.quantityToProduce != null ? String(doc.quantityToProduce) : "",
    rawMaterials,
    additionalCosts,
    remarks: String(doc.remarks || ""),
    savedBatchId: String(doc._id || doc.id || ""),
    status: String(doc.status || "Planned"),
    produceUnit:
      doc.produceUnit ||
      (finishedPop ? getProductUnit(finishedPop) : undefined),
  };
}
