import TaskBoard from "../../components/tasks/TaskBoard";

export default function MyTasksPage() {
  return (
    <>
      <div className="space-y-2 mb-6">
        <h1 className="text-xl font-bold text-gray-900 dark:text-slate-100">My tasks</h1>
        <p className="text-sm text-gray-500 dark:text-slate-400">
          Tasks assigned to you — update status, start, or mark complete.
        </p>
      </div>
      <TaskBoard restrictToSelf showMonitoring={false} />
    </>
  );
}
