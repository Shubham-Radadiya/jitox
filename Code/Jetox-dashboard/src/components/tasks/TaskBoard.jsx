import { useMemo, useState, useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { Plus } from "lucide-react";
import { tasksApi, usersApi } from "../../services/api";
import { getApiErrorMessage } from "../../utils/apiError";
import { getStoredUser, isAdminUser } from "../../utils/authSession";
import CreateTaskModal from "./CreateTaskModal";
import TaskSummaryCards from "./TaskSummaryCards";
import TaskToolbar from "./TaskToolbar";
import TaskList from "./TaskList";
import { taskTitle, taskEffectiveStatus } from "../../utils/taskUtils";

const PAGE_SIZE = 8;

export default function TaskBoard({ restrictToSelf = false, showMonitoring = false }) {
  const qc = useQueryClient();
  const user = getStoredUser();
  const admin = isAdminUser(user);
  const uid = String(user?.id || "");
  const [searchParams, setSearchParams] = useSearchParams();
  const highlightTaskId = (searchParams.get("taskId") || "").trim();
  const highlightHandledRef = useRef(false);

  const [search, setSearch] = useState("");
  const [statusF, setStatusF] = useState("all");
  const [priorityF, setPriorityF] = useState("all");
  const [sort, setSort] = useState("due");
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    setPage(1);
  }, [search, statusF, priorityF, sort]);

  useEffect(() => {
    highlightHandledRef.current = false;
  }, [highlightTaskId]);

  const { data: rawTasks = [], isLoading } = useQuery({
    queryKey: ["tasks"],
    queryFn: async () => {
      const { data } = await tasksApi.getAll();
      return Array.isArray(data) ? data : [];
    },
    staleTime: 10_000,
    refetchInterval: 15_000,
  });

  const { data: analytics } = useQuery({
    queryKey: ["tasks", "analytics"],
    queryFn: async () => {
      const { data } = await tasksApi.getAnalytics();
      return data;
    },
    enabled: showMonitoring && admin,
    staleTime: 20_000,
    refetchInterval: 20_000,
  });

  const { data: usersRaw = [] } = useQuery({
    queryKey: ["users", "task-board"],
    queryFn: async () => {
      const { data } = await usersApi.getAll();
      if (Array.isArray(data?.users)) return data.users;
      return Array.isArray(data) ? data : [];
    },
    enabled: admin,
    staleTime: 120_000,
  });

  const userOptions = useMemo(
    () =>
      usersRaw.map((u) => ({
        value: String(u._id || u.id),
        label: u.name || u.email || String(u._id || u.id),
      })),
    [usersRaw]
  );

  const userMap = useMemo(() => {
    const m = {};
    usersRaw.forEach((u) => {
      m[String(u._id || u.id)] = u.name || u.email || String(u._id || u.id);
    });
    return m;
  }, [usersRaw]);

  const filtered = useMemo(() => {
    let list = rawTasks.map((t) => ({
      ...t,
      _ids: t.assignedUserIds?.length
        ? t.assignedUserIds.map(String)
        : t.assigneeUserId
          ? [String(t.assigneeUserId)]
          : [],
    }));

    if (restrictToSelf && uid) {
      list = list.filter((t) => t._ids.includes(uid));
    }

    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (t) =>
          taskTitle(t).toLowerCase().includes(q) ||
          String(t.description || "").toLowerCase().includes(q)
      );
    }

    if (statusF !== "all") {
      list = list.filter((t) => taskEffectiveStatus(t) === statusF);
    }
    if (priorityF !== "all") {
      list = list.filter((t) => String(t.priority || "medium") === priorityF);
    }

    list.sort((a, b) => {
      if (sort === "priority") {
        const order = { high: 0, medium: 1, low: 2 };
        return (
          (order[String(a.priority)] ?? 1) - (order[String(b.priority)] ?? 1)
        );
      }
      const da = new Date(a.dueDate || a.setDate || 0).getTime();
      const db = new Date(b.dueDate || b.setDate || 0).getTime();
      return da - db;
    });

    return list;
  }, [rawTasks, restrictToSelf, uid, search, statusF, priorityF, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageSafe = Math.min(page, totalPages);
  const slice = filtered.slice((pageSafe - 1) * PAGE_SIZE, pageSafe * PAGE_SIZE);

  useEffect(() => {
    if (!highlightTaskId || isLoading) return;
    const idx = filtered.findIndex(
      (t) => String(t._id || t.id) === highlightTaskId
    );
    if (idx < 0) {
      if (rawTasks.length > 0) {
        const next = new URLSearchParams(searchParams);
        next.delete("taskId");
        setSearchParams(next, { replace: true });
        highlightHandledRef.current = true;
      }
      return;
    }
    const pageNeeded = Math.floor(idx / PAGE_SIZE) + 1;
    setPage(pageNeeded);
  }, [highlightTaskId, isLoading, filtered, rawTasks.length, searchParams, setSearchParams]);

  useEffect(() => {
    if (!highlightTaskId || isLoading || highlightHandledRef.current) return;
    const onPage = slice.some((t) => String(t._id || t.id) === highlightTaskId);
    if (!onPage) return;
    const raf = requestAnimationFrame(() => {
      const el = document.getElementById(`task-card-${highlightTaskId}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        highlightHandledRef.current = true;
      }
    });
    return () => cancelAnimationFrame(raf);
  }, [highlightTaskId, isLoading, slice]);

  const createMut = useMutation({
    mutationFn: (body) => tasksApi.create(body),
    onSuccess: () => {
      toast.success("Task created");
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["tasks", "analytics"] });
      setCreateOpen(false);
    },
    onError: (e) => toast.error(getApiErrorMessage(e, "Could not create task")),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, body }) => tasksApi.update(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["tasks", "analytics"] });
    },
    onError: (e) => toast.error(getApiErrorMessage(e, "Could not update")),
  });

  const deleteMut = useMutation({
    mutationFn: (id) => tasksApi.delete(id),
    onSuccess: () => {
      toast.success("Task deleted");
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["tasks", "analytics"] });
    },
    onError: (e) => toast.error(getApiErrorMessage(e, "Could not delete")),
  });

  const summary = analytics?.summary;
  const canCreate = admin && !restrictToSelf;

  useEffect(() => {
    if (!canCreate) return;
    if (searchParams.get("newTask") === "1") setCreateOpen(true);
  }, [canCreate, searchParams]);

  const handleUpdateStatus = (taskId, status) => {
    updateMut.mutate({ id: taskId, body: { status } });
  };

  const handleCloseCreate = () => {
    setCreateOpen(false);
    const next = new URLSearchParams(searchParams);
    next.delete("newTask");
    setSearchParams(next, { replace: true });
  };

  return (
    <div className="space-y-4">
      {showMonitoring && admin && summary ? (
        <TaskSummaryCards summary={summary} />
      ) : null}

      <TaskToolbar
        search={search}
        onSearchChange={setSearch}
        statusF={statusF}
        onStatusF={setStatusF}
        priorityF={priorityF}
        onPriorityF={setPriorityF}
        sort={sort}
        onSort={setSort}
      />

      <TaskList
        tasks={slice}
        isLoading={isLoading}
        userMap={userMap}
        admin={admin}
        restrictToSelf={restrictToSelf}
        updatePending={updateMut.isPending}
        onUpdateStatus={handleUpdateStatus}
        onDelete={(taskId) => deleteMut.mutate(taskId)}
        onCreateClick={() => setCreateOpen(true)}
        canCreate={canCreate}
        highlightTaskId={highlightTaskId}
      />

      {totalPages > 1 ? (
        <div className="flex justify-center gap-2 pt-2">
          <button
            type="button"
            className="rounded-[10px] border border-slate-200/90 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-40 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            disabled={pageSafe <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </button>
          <span className="self-center text-sm tabular-nums text-slate-600 dark:text-slate-400">
            Page {pageSafe} of {totalPages}
          </span>
          <button
            type="button"
            className="rounded-[10px] border border-slate-200/90 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-40 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            disabled={pageSafe >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Next
          </button>
        </div>
      ) : null}

      <CreateTaskModal
        open={createOpen}
        onClose={handleCloseCreate}
        saving={createMut.isPending}
        userOptions={userOptions}
        onSubmit={(body) => createMut.mutateAsync(body)}
      />
    </div>
  );
}
