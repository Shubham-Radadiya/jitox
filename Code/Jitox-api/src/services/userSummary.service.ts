import {
  User,
  Task,
  SalesVoucher,
  ExpenseVoucher,
  Employee,
} from "../models/index";
import type { IUser } from "../types/user.type";

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function displayName(u: IUser) {
  const n = (u.name || "").trim();
  if (n) return n;
  const parts = [u.firstName, u.lastName].filter(Boolean).join(" ").trim();
  return parts || u.email;
}

function fmtDate(d: Date | string | undefined) {
  if (!d) return "—";
  const dt = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(dt.getTime())) return "—";
  return dt.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function fmtDateTime(d: Date | string | undefined) {
  if (!d) return "—";
  const dt = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(dt.getTime())) return "—";
  return dt.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function fmtRupee(n: number) {
  return `₹${Number(n || 0).toLocaleString("en-IN")}`;
}

export async function buildUserSummary(userId: string) {
  const user = await User.findById(userId).select("-password").lean();
  if (!user) return null;

  const uid = String(user._id);
  const name = displayName(user as IUser);
  const nameRx = new RegExp(escapeRegex(name), "i");

  const tasks = await Task.find({
    $or: [
      { assigneeUserId: uid },
      { assignedUserIds: uid },
      { assignedByUserId: uid },
    ],
  })
    .sort({ updatedAt: -1 })
    .limit(200)
    .lean();

  const visitSource =
    tasks.filter((t) => /visit|field|client|dealer/i.test(`${t.taskName} ${t.description || ""}`))
      .length > 0
      ? tasks.filter((t) =>
          /visit|field|client|dealer/i.test(`${t.taskName} ${t.description || ""}`)
        )
      : tasks;

  const visitLog = visitSource.slice(0, 50).map((t, i) => ({
    "Visit ID": `VS${String(t._id).slice(-6).toUpperCase() || i + 1}`,
    "Client Name": (t.taskName || "Visit").replace(/^.*visit[:\s-]*/i, "").trim() || t.taskName,
    Date: fmtDate(t.setDate || t.dueDate || t.createdAt),
    Location: (user as IUser).city || (user as IUser).region || "—",
    Purpose: t.taskName || "Field task",
    Outcomes:
      t.status === "completed"
        ? "Completed"
        : t.status === "in_progress"
          ? "In progress"
          : "Pending",
    Notes: (t.description || "—").slice(0, 80),
  }));

  const sales = await SalesVoucher.find({ orderby: nameRx })
    .sort({ voucherDate: -1 })
    .limit(100)
    .lean();

  const orders = sales.map((s, idx) => {
    const paid = Number(s.paidAmount || 0);
    const total = Number(s.totalAmount || 0);
    const payStatus =
      paid >= total && total > 0
        ? "Paid"
        : paid > 0
          ? "Partial"
          : "Unpaid";
    return {
      id: idx,
      _id: String(s._id),
      "Order Number": s.voucherNo || s.invoiceNo || `ORD-${String(s._id).slice(-4)}`,
      "Date & Time": fmtDateTime(s.voucherDate),
      "Placed By": s.orderby || name,
      "Client Name": s.partyName || "—",
      "Order Status": "Confirmed",
      "Payment Status": payStatus,
      totalAmount: total,
      partyName: s.partyName,
      items: s.items || [],
    };
  });

  const expenses = await ExpenseVoucher.find({
    $or: [{ paidTo: nameRx }, { description: nameRx }],
  })
    .sort({ startDate: -1, createdAt: -1 })
    .limit(100)
    .lean();

  const expenseRows = expenses.map((e) => ({
    _id: String(e._id),
    Date: fmtDate(e.startDate || e.createdAt),
    "Expense Type": e.expenseType || "Other",
    Description: e.description || "—",
    "Paid To": e.paidTo || "—",
    Amount: fmtRupee(Number(e.amount || 0)),
    Mode: e.paymentMode || "—",
    Proof: e.uploadProof ? "View" : "—",
    uploadProof: e.uploadProof || "",
    Action: true,
  }));

  const completedTasks = tasks.filter((t) => t.status === "completed");
  const pendingTasks = tasks.filter(
    (t) => t.status !== "completed" && t.status !== "todo"
  );

  const attendanceRows: Record<string, string>[] = [];
  const dayMap = new Map<string, { completed: number; total: number }>();
  for (const t of tasks) {
    const key = fmtDate(t.setDate || t.dueDate || t.createdAt);
    if (key === "—") continue;
    const cur = dayMap.get(key) || { completed: 0, total: 0 };
    cur.total += 1;
    if (t.status === "completed") cur.completed += 1;
    dayMap.set(key, cur);
  }
  for (const [date, { completed, total }] of dayMap) {
    const status = completed >= total && total > 0 ? "P" : completed > 0 ? "HD" : "A";
    attendanceRows.push({
      Date: date,
      "Attendance Status": status,
      "Clock In": "—",
      "Clock Out": "—",
      "Total Time": `${total} task(s)`,
      "Break Time": "—",
      "Productive Hour": `${completed} done`,
      statusDetail: status,
    });
  }

  const totalSales = sales.reduce((s, v) => s + Number(v.totalAmount || 0), 0);
  const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount || 0), 0);
  const presentDays = attendanceRows.filter((r) => r["Attendance Status"] === "P").length;
  const absentDays = attendanceRows.filter((r) => r["Attendance Status"] === "A").length;

  const performance = {
    stats: [
      { label: "Total Visits", value: String(visitLog.length) },
      { label: "Total Orders", value: String(orders.length) },
      { label: "Total Sales Amount", value: fmtRupee(totalSales) },
      { label: "Total Expenses", value: fmtRupee(totalExpenses) },
      {
        label: "Attendance Summary",
        value: `${presentDays} Present / ${absentDays} Absent`,
      },
      { label: "Pending Follow-ups", value: String(pendingTasks.length) },
    ],
    taskCompletionPct:
      tasks.length > 0
        ? Math.round((completedTasks.length / tasks.length) * 100)
        : 0,
  };

  const employee = await Employee.findOne({
    email: String(user.email || "").toLowerCase(),
  }).lean();

  return {
    profile: {
      id: uid,
      name,
      empId: employee
        ? `EMP${String(employee._id).slice(-4).toUpperCase()}`
        : `USR${uid.slice(-4).toUpperCase()}`,
      phone: user.phone || employee?.phone || "—",
      email: user.email,
      role: user.role,
      region: (user as IUser).region || (user as IUser).state || (user as IUser).city || "—",
      image: (user as IUser).profilePhoto || null,
    },
    counts: {
      visits: visitLog.length,
      orders: orders.length,
      expenses: expenseRows.length,
      attendance: attendanceRows.length,
    },
    visitLog,
    orders,
    expenses: expenseRows,
    attendance: {
      stats: [
        {
          label: "Total Hours Worked",
          value: `${completedTasks.length * 8} H (est.)`,
          color: "blue",
        },
        { label: "Total Present Days", value: String(presentDays), color: "green" },
        { label: "Total Absent Days", value: String(absentDays), color: "red" },
        {
          label: "Total Half Days",
          value: String(
            attendanceRows.filter((r) => r["Attendance Status"] === "HD").length
          ),
          color: "orange",
        },
        { label: "On Leave", value: "0", color: "gray" },
        { label: "Early Out", value: "0", color: "black" },
      ],
      rows: attendanceRows,
    },
    performance,
  };
}
