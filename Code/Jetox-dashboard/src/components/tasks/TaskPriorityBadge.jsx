import { priorityBadgeClass } from "../../utils/taskUtils";

const LABEL = { high: "High", medium: "Medium", low: "Low" };

export default function TaskPriorityBadge({ priority }) {
  const p = String(priority || "medium").toLowerCase();
  return (
    <span className={priorityBadgeClass(p)} title={`Priority: ${LABEL[p] || p}`}>
      {LABEL[p] || p}
    </span>
  );
}
