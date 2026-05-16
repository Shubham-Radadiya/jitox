import React from "react";
import { useNavigate } from "react-router-dom";
import { CommonModal, Button } from "../../../components/ui/CommanUI";

export function ManufacturingBlockedModal({
  open,
  onClose,
  issues = [],
  onRecheck,
  onEdit,
  rechecking = false,
}) {
  const navigate = useNavigate();

  return (
    <CommonModal open={open} onClose={onClose} title="Manufacturing Blocked">
      <div className="space-y-4 text-sm text-slate-700 dark:text-slate-200">
        <p className="font-semibold text-slate-900 dark:text-slate-100">
          The following raw materials are low/out of stock
        </p>
        <ul className="space-y-2">
          {issues.map((item) => (
            <li
              key={item.productId || item.productName}
              className="text-slate-800 dark:text-slate-200"
            >
              <span className="font-medium">{item.productName}:</span>{" "}
              <span className="text-emerald-600 dark:text-emerald-400">
                (Required: {item.required}
                {item.unit ? ` ${item.unit}` : ""})
              </span>
              ,{" "}
              <span className="text-red-600 dark:text-red-400">
                (Available: {item.available}
                {item.unit ? ` ${item.unit}` : ""})
              </span>
            </li>
          ))}
        </ul>
        <p className="text-slate-600 dark:text-slate-400">
          Please update raw material stock or reduce production quantity.
        </p>
        <div className="flex flex-wrap justify-end gap-2 pt-2">
          <Button
            label={rechecking ? "Rechecking…" : "Recheck Stock"}
            variant="outline"
            size="sm"
            onClick={onRecheck}
            disabled={rechecking}
          />
          <Button
            label="+ Add Raw Materials"
            variant="outline"
            size="sm"
            onClick={() => {
              onClose?.();
              navigate("/dashboard/product");
            }}
          />
          <Button label="Edit" variant="outline" size="sm" onClick={onEdit} />
          <Button label="Cancel" variant="primary" size="sm" onClick={onClose} />
        </div>
      </div>
    </CommonModal>
  );
}

export function ManufacturingReadyModal({
  open,
  onClose,
  onStart,
  onSaveOnly,
  starting,
}) {
  return (
    <CommonModal
      open={open}
      onClose={onClose}
      title="Product Ready for Manufacturing"
    >
      <div className="space-y-4 text-sm text-slate-700 dark:text-slate-200">
        <p>
          Raw materials are sufficient. Do you want to start manufacturing?
        </p>
        <div className="flex flex-wrap justify-end gap-2">
          <Button label="Cancel" variant="outline" size="sm" onClick={onClose} />
          <Button
            label="Save Record"
            variant="outline"
            size="sm"
            onClick={onSaveOnly}
          />
          <Button
            label={starting ? "Starting…" : "Start Manufacturing"}
            variant="primary"
            size="sm"
            onClick={onStart}
            disabled={starting}
          />
        </div>
      </div>
    </CommonModal>
  );
}
