import { useState, useMemo } from "react";
import { Modal, Select, DatePicker, Input, Button } from "antd";
import { Plus, Trash2 } from "lucide-react";

const { TextArea } = Input;

export default function CreateTaskModal({
  open,
  onClose,
  onSubmit,
  saving,
  userOptions = [],
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assigneeIds, setAssigneeIds] = useState([]);
  const [priority, setPriority] = useState("medium");
  const [due, setDue] = useState(null);
  const [attachments, setAttachments] = useState([{ name: "", url: "" }]);

  const opts = useMemo(
    () =>
      userOptions.map((u) => ({
        value: u.value,
        label: u.label,
      })),
    [userOptions]
  );

  const reset = () => {
    setTitle("");
    setDescription("");
    setAssigneeIds([]);
    setPriority("medium");
    setDue(null);
    setAttachments([{ name: "", url: "" }]);
  };

  const handleOk = async () => {
    const cleanAttachments = attachments
      .filter((a) => a.name?.trim() && a.url?.trim())
      .map((a) => ({ name: a.name.trim(), url: a.url.trim() }));
    try {
      await onSubmit({
        taskName: title.trim(),
        description: description.trim(),
        assignedUserIds: assigneeIds,
        priority,
        dueDate: due ? due.toISOString() : undefined,
        attachments: cleanAttachments,
      });
      reset();
    } catch {
      /* parent toast */
    }
  };

  return (
    <Modal
      title="Create task"
      open={open}
      onCancel={() => {
        reset();
        onClose();
      }}
      onOk={handleOk}
      okText="Create"
      confirmLoading={saving}
      okButtonProps={{ disabled: !title.trim() || assigneeIds.length === 0 }}
      cancelButtonProps={{ disabled: saving }}
      rootClassName="jitox-ant-modal jitox-task-create-modal"
      width={560}
      destroyOnClose
    >
      <div className="flex flex-col gap-2.5 -mt-1">
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          <div>
            <div className="mb-1 text-[13px] font-semibold text-slate-800 dark:text-slate-200">
              Title
            </div>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Task title"
            />
          </div>
          <div>
            <div className="mb-1 text-[13px] font-semibold text-slate-800 dark:text-slate-200">
              Assign to
            </div>
            <Select
              mode="multiple"
              allowClear
              className="w-full jitox-ant-select"
              placeholder="Select users"
              options={opts}
              value={assigneeIds}
              onChange={setAssigneeIds}
              optionFilterProp="label"
            />
          </div>
        </div>
        <div>
          <div className="mb-1 text-[13px] font-semibold text-slate-800 dark:text-slate-200">
            Description
          </div>
          <TextArea
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Details…"
          />
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <div className="mb-1 text-[13px] font-semibold text-slate-800 dark:text-slate-200">
              Priority
            </div>
            <Select
              className="w-full jitox-ant-select"
              value={priority}
              onChange={setPriority}
              options={[
                { value: "low", label: "Low" },
                { value: "medium", label: "Medium" },
                { value: "high", label: "High" },
              ]}
            />
          </div>
          <div>
            <div className="mb-1 text-[13px] font-semibold text-slate-800 dark:text-slate-200">
              Due date
            </div>
            <DatePicker className="w-full jitox-picker-form" value={due} onChange={setDue} />
          </div>
        </div>
        <div>
          <div className="mb-1 text-[13px] font-semibold text-slate-800 dark:text-slate-200">
            Attachments (optional)
          </div>
          <div className="space-y-2">
            {attachments.map((row, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input
                  placeholder="File name"
                  value={row.name}
                  onChange={(e) => {
                    const next = [...attachments];
                    next[i] = { ...next[i], name: e.target.value };
                    setAttachments(next);
                  }}
                />
                <Input
                  placeholder="URL"
                  value={row.url}
                  onChange={(e) => {
                    const next = [...attachments];
                    next[i] = { ...next[i], url: e.target.value };
                    setAttachments(next);
                  }}
                />
                <button
                  type="button"
                  className="rounded-md p-2 text-red-500 transition hover:bg-red-50 dark:hover:bg-red-950/30"
                  onClick={() => setAttachments(attachments.filter((_, j) => j !== i))}
                  aria-label="Remove row"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            <Button
              type="dashed"
              block
              className="jitox-task-attach-btn"
              icon={<Plus size={14} />}
              onClick={() => setAttachments([...attachments, { name: "", url: "" }])}
            >
              Add attachment
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
