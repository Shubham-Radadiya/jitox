import { CommonModal, Button } from "../../components/ui/CommanUI";

const Row = ({ label, value }) => (
  <p className="m-0 text-sm leading-relaxed text-slate-700 dark:text-slate-200">
    <span className="font-semibold text-slate-900 dark:text-slate-100">
      {label}:
    </span>{" "}
    {value}
  </p>
);

const UserUpdatedSuccessModal = ({
  open,
  onClose,
  summary,
  onViewProfile,
  onEditAgain,
}) => {
  if (!summary) return null;
  const changes = Array.isArray(summary.changes) ? summary.changes : [];

  return (
    <CommonModal
      open={open}
      onClose={onClose}
      width="min(500px, 90vw)"
      title="Manager details have been updated successfully."
      titleClassName="text-sm sm:text-base font-semibold tracking-tight"
      bodyClassName="px-3 py-3 sm:px-5 sm:py-4"
      footerClassName="hidden"
    >
      <div className="space-y-3">
        <div className="space-y-0.5 text-center">
          <Row label="Name" value={summary.name} />
          {changes.length ? (
            changes.map((c) => (
              <Row
                key={c.label}
                label={c.label}
                value={`${c.from} -> ${c.to}`}
              />
            ))
          ) : (
            <p className="m-0 text-[15px] leading-relaxed text-slate-500 dark:text-slate-400">
              No visible field changes.
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 overflow-hidden rounded-lg border border-slate-200 sm:grid-cols-2 dark:border-slate-600">
          <Button
            label="View Profile"
            variant="outline"
            className="h-9 rounded-none border-0 border-r border-slate-200 text-primary text-sm font-semibold hover:bg-emerald-50 dark:border-slate-600 dark:hover:bg-emerald-950/30"
            onClick={onViewProfile}
          />
          <Button
            label="Edit Again"
            variant="outline"
            className="h-9 rounded-none border-0 text-sm font-semibold text-slate-800 hover:bg-primary hover:text-white dark:text-slate-100 dark:hover:text-white"
            onClick={onEditAgain}
          />
        </div>
      </div>
    </CommonModal>
  );
};

export default UserUpdatedSuccessModal;
