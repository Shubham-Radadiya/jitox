import { TASK_STATUS_LABEL, statusBadgeClass, taskEffectiveStatus } from "../../utils/taskUtils";

export default function TaskStatusBadge({ task }) {
  const s = taskEffectiveStatus(task);
  return (
    <span className={statusBadgeClass(s)} title={TASK_STATUS_LABEL[s] || s}>
      {TASK_STATUS_LABEL[s] || s}
    </span>
  );
}
