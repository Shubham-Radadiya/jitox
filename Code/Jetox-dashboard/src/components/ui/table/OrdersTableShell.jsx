import {
  ORDERS_TABLE_WRAPPER_CLASS,
  ORDERS_TABLE_ELEMENT_CLASS,
} from "../../../utils/tableUi";

/**
 * Semantic scroll container + fixed-layout table for dense order grids
 * (sticky header is applied via `orderTableThClasses` / `reportOrderThClasses`).
 */
export default function OrdersTableShell({ children, className = "" }) {
  return (
    <div className={`${ORDERS_TABLE_WRAPPER_CLASS} ${className}`.trim()}>
      <table className={ORDERS_TABLE_ELEMENT_CLASS}>{children}</table>
    </div>
  );
}
