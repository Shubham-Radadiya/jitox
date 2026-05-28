import { useState } from "react";
import { X, MoreVertical, CircleCheck , Circle, Clock8 } from "lucide-react";
import taskImg from "../../assets/task.png";
import {
  Button,
  DateInput,
  InputField,
  TimeInput,
  CommonDropdown,
} from "../../components/ui/CommanUI";
import dayjs from "dayjs";
import toast from "react-hot-toast";
import { mergePageAddButton } from "../../utils/pageAddButton";

export const EmptyTaskModal = ({ open, onClose, onAddTask }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[99] pointer-events-none">
      <div className="absolute inset-0 bg-black/20"></div>

      <div className="absolute top-20 right-20 bg-white rounded-2xl w-[500px] p-3 shadow-xl pointer-events-auto transition-all dark:border dark:border-slate-700 dark:bg-slate-900">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-gray-800 text-lg dark:text-slate-100">My Tasks</h3>
          <button type="button" onClick={onClose} className="rounded-md p-0.5 hover:bg-slate-100 dark:hover:bg-slate-800">
            <X className="text-gray-600 hover:text-black dark:text-slate-400 dark:hover:text-slate-100" size={20} />
          </button>
        </div>
        <hr className="border-light-border" />

        <div className="text-center py-4">
          <img
            src={taskImg}
            alt="Empty tasks — add a task to get started"
            className="w-32 mx-auto mb-3"
            loading="lazy"
            decoding="async"
          />

          <div className="font-medium text-gray-700 dark:text-slate-200">No tasks yet!</div>
          <div className="text-sm text-gray-500 mb-5 dark:text-slate-400">
            Start by adding your first To-Do item.
          </div>

          <Button
            type="button"
            label="Add task"
            {...mergePageAddButton({ className: "w-full" })}
            onClick={() => {
              onClose();
              onAddTask();
            }}
          />
        </div>
      </div>
    </div>
  );
};

export const NewTaskModal = ({
  open,
  onClose,
  onSave,
  saving = false,
  assigneeOptions = [],
  canAssign = false,
}) => {
  const [task, setTask] = useState({
    name: "",
    description: "",
    startDate: "",
    startTime: "",
    duration: "",
    reminder: "",
    status: "todo",
    assigneeUserId: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setTask((prev) => ({ ...prev, [name]: value }));
  };

  if (!open) return null;

  // const isDisabled =
  //   !task.name ||
  //   !task.description ||
  //   !task.startDate ||
  //   !task.startTime ||
  //   !task.duration;

  return (
    <div className="fixed inset-0 z-[99] pointer-events-none">
      <div className="absolute inset-0 bg-black/20"></div>

      <div className="absolute top-20 right-20 bg-white rounded-2xl flex flex-col gap-2 max-w-[500px] p-3 shadow-xl pointer-events-auto dark:border dark:border-slate-700 dark:bg-slate-900">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="text-md font-bold text-gray-800 dark:text-slate-100">Add New Task</div>
          <button type="button" onClick={onClose} className="rounded-md p-0.5 hover:bg-slate-100 dark:hover:bg-slate-800">
            <X size={20} className="text-gray-600 hover:text-black dark:text-slate-400 dark:hover:text-slate-100" />
          </button>
        </div>
        <hr className="border-light-border" />

        {/* Form */}
        <div className="grid gap-4">
          <InputField
            label="Task Name"
            name="name"
            value={task.name}
            onChange={handleChange}
            required
          />

          <InputField
            label="Description"
            name="description"
            value={task.description}
            onChange={handleChange}
            placeholder="About your task..."
          />

          <CommonDropdown
            hideAdd
            label="Status"
            placeholder="To Do / In progress / Completed"
            value={task.status}
            onChange={(v) => setTask((p) => ({ ...p, status: v }))}
            options={[
              { value: "todo", label: "To Do" },
              { value: "in_progress", label: "In Progress" },
              { value: "completed", label: "Completed" },
            ]}
          />

          {canAssign && assigneeOptions.length > 0 ? (
            <CommonDropdown
              label="Assign to user"
              addNavigateTo="/dashboard/user-master"
              placeholder="Select user (optional)"
              value={task.assigneeUserId || "__none__"}
              onChange={(v) =>
                setTask((p) => ({
                  ...p,
                  assigneeUserId: v === "__none__" ? "" : v,
                }))
              }
              options={[
                { value: "__none__", label: "— Unassigned —" },
                ...assigneeOptions,
              ]}
            />
          ) : null}

          <div className="grid grid-cols-2 z-[999] gap-4">
            <DateInput
              label="Start Date"
              name="startDate"
              value={task.startDate}
              onChange={handleChange}
              required
            />

            <TimeInput
              label="Start Time"
              name="startTime"
              value={task.startTime}
              onChange={handleChange}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <InputField
              label="Duration (ex: 2 hrs)"
              name="duration"
              value={task.duration}
              onChange={handleChange}
              required
            />
            <TimeInput
              label="Set Reminder"
              name="reminder"
              value={task.reminder}
              onChange={handleChange}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Button
              type="button"
              label="Cancel"
              variant="outline"
              className="w-full"
              onClick={onClose}
            />

            <Button
              label={saving ? "Saving…" : "Save Task"}
              variant="primary"
              className="w-full mt-6"
              disabled={saving}
              onClick={async () => {
                if (!String(task.name || "").trim()) {
                  toast.error("Task name is required");
                  return;
                }
                const d = task.startDate;
                const setDate =
                  d && dayjs.isDayjs(d)
                    ? d.toISOString()
                    : d
                      ? dayjs(d).toISOString()
                      : undefined;
                try {
                  await onSave?.({
                    taskName: String(task.name).trim(),
                    description: task.description || undefined,
                    setDate,
                    setTime: task.startTime || undefined,
                    setDuration: task.duration || undefined,
                    setReminder: task.reminder || undefined,
                    status: task.status || "todo",
                    assigneeUserId: task.assigneeUserId || undefined,
                  });
                  setTask({
                    name: "",
                    description: "",
                    startDate: "",
                    startTime: "",
                    duration: "",
                    reminder: "",
                    status: "todo",
                    assigneeUserId: "",
                  });
                } catch {
                  /* toast handled by caller */
                }
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export const TaskListModal = ({
  open,
  onClose,
  tasks,
  onUpdateTask,
  onDeleteTask,
  onEditTask,
}) => {
  const [menuOpenId, setMenuOpenId] = useState(null);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[99] pointer-events-none">
      <div className="absolute inset-0 bg-black/20"></div>

      <div className="absolute flex flex-col gap-3 top-20 right-20 bg-white rounded-2xl max-w-[700px] p-5 shadow-xl pointer-events-auto transition-all dark:border dark:border-slate-700 dark:bg-slate-900">
          <div className="flex justify-between items-center">
          <div className="text-md font-bold text-gray-800 dark:text-slate-100">My Tasks</div>
          <button type="button" onClick={onClose} className="rounded-md p-0.5 hover:bg-slate-100 dark:hover:bg-slate-800">
            <X size={20} className="text-gray-600 hover:text-black dark:text-slate-400 dark:hover:text-slate-100" />
          </button>
        </div>
        <hr className="border-light-border" />
        {/* Add Task */}
        <div className="flex justify-between">
          <button
            className="text-blue text-sm font-medium hover:underline dark:text-blue-400"
            onClick={onEditTask}
          >
            + Add New Task
          </button>
          <div className="relative">     
               <DateInput
              name="startDate"
              required
            />
          </div>
        </div>

        {/* Task List */}
        <div className="space-y-3 max-h-[50vh] overflow-auto scrollbar-hide">
          {tasks.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-6 dark:text-slate-400">
              No tasks yet. Use + Add New Task.
            </p>
          ) : null}
          {tasks.map((task) => (
            <div
              key={task.id}
              className="relative p-3 border border-light-border rounded-xl flex gap-3 items-start dark:border-slate-600 dark:bg-slate-800/40"
            >
              {/* Checkbox */}
              <button
                onClick={() =>
                  onUpdateTask(task.id, { completed: !task.completed })
                }
                className="w-5 h-5 rounded-full border-2 flex items-center justify-center transition"
                style={{
                  borderColor: task.completed ? "#0A9242" : "#9ca3af",
                  backgroundColor: task.completed ? "#0A9242" : "transparent",
                }}
              >
                {task.completed && (
                  <CircleCheck size={14} className="text-white" />
                )}
              </button>

              {/* Task Info */}
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-gray-800 dark:text-slate-100">{task.name}</span>
                  {task.status && task.status !== "todo" ? (
                    <span className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-rowBg text-light border border-light-border dark:border-slate-600 dark:bg-slate-800 dark:text-slate-400">
                      {String(task.status).replace("_", " ")}
                    </span>
                  ) : null}
                </div>
                <div className="text-sm text-gray-500 dark:text-slate-400">{task.description}</div>
<div className="flex justify-between items-center">
                <div className="text-xs text-gray-500 mt-1 flex items-center dark:text-slate-400">
                  <Clock8 className="inline-block w-3 h-3 mr-1 text-current" />{task.startTime} | <span className="ml-1">({task.duration})</span>
                </div>

                {task.startDate && (
                  <div className="text-xs text-gray-400 dark:text-slate-500">{task.startDate}</div>
                )}
                </div>
              </div>

              {/* Menu Button */}
              <div className="relative">
                <button
                  onClick={() =>
                    setMenuOpenId(menuOpenId === task.id ? null : task.id)
                  }
                >
                  <MoreVertical size={18} className="text-gray-600 dark:text-slate-400" />
                </button>

                {menuOpenId === task.id && (
                  <div className="absolute right-0 mt-1 bg-white border border-light-border rounded-md shadow-md py-1 text-sm z-10 dark:bg-slate-900 dark:border-slate-600">
                    <button
                      className="block px-4 py-1 hover:bg-gray-50 w-full text-left dark:hover:bg-slate-800 dark:text-slate-200"
                      onClick={() => onEditTask(task)}
                    >
                      Edit
                    </button>
                    <button
                      className="block px-4 py-1 hover:bg-gray-50 text-red-500 w-full text-left dark:hover:bg-slate-800 dark:text-red-400"
                      onClick={() => onDeleteTask(task.id)}
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
