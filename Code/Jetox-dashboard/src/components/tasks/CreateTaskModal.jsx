import { useState, useMemo } from "react";
import { Modal, Select, DatePicker, Input, Button } from "antd";
import dayjs from "dayjs";
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
      width={560}
      destroyOnClose
    >
      <div className="flex flex-col gap-3 pt-2">
        <div>
          <div className="text-xs font-medium text-gray-600 mb-1">Title</div>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Task title"
          />
        </div>
        <div>
          <div className="text-xs font-medium text-gray-600 mb-1">Description</div>
          <TextArea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Details…"
          />
        </div>
        <div>
          <div className="text-xs font-medium text-gray-600 mb-1">Assign to</div>
          <Select
            mode="multiple"
            allowClear
            className="w-full"
            placeholder="Select users"
            options={opts}
            value={assigneeIds}
            onChange={setAssigneeIds}
            optionFilterProp="label"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="text-xs font-medium text-gray-600 mb-1">Priority</div>
            <Select
              className="w-full"
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
            <div className="text-xs font-medium text-gray-600 mb-1">Due date</div>
            <DatePicker className="w-full" value={due} onChange={setDue} />
          </div>
        </div>
        <div>
          <div className="text-xs font-medium text-gray-600 mb-1">Attachments (optional)</div>
          <div className="space-y-2">
            {attachments.map((row, i) => (
              <div key={i} className="flex gap-2 items-center">
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
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
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
