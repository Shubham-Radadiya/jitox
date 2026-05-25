/**
 * Per-user test data for tracking, user summary, and fleet maps.
 * Idempotent — safe on every dev server start.
 *
 * Logins (password: 123456):
 *   testuser@gmail.com
 *   rajesh.field@gmail.com
 *   priya.field@gmail.com
 */
import bcrypt from "bcrypt";
import mongoose from "mongoose";
import {
  User,
  Employee,
  Task,
  SalesVoucher,
  ExpenseVoucher,
  Product,
  FieldLocationPing,
} from "../models";
import type { LocationPingKind } from "../models/fieldLocationPing.model";
import { ensureDefaultUsers } from "./ensureDefaultUsers";
import { syncEmployeeUserLinks } from "../services/fieldTracking.service";

export const USER_TEST_SEED_TAG = "JITOX-USER-TEST";

type LatLng = [number, number];

type FieldTestProfile = {
  email: string;
  name: string;
  firstName: string;
  lastName: string;
  phone: string;
  department: string;
  city: string;
  district: string;
  mapPath: LatLng[];
  visits: { partyName: string; address: string; lat: number; lng: number }[];
};

const AHMEDABAD_PATH: LatLng[] = [
  [22.9982, 72.6101],
  [22.9925, 72.6035],
  [23.005, 72.588],
  [23.022, 72.572],
  [23.0369, 72.5626],
];

const SURAT_PATH: LatLng[] = [
  [21.1702, 72.8311],
  [21.195, 72.82],
  [21.214, 72.79],
  [21.2274, 72.8778],
  [21.24, 72.9],
];

const FIELD_PROFILES: FieldTestProfile[] = [
  {
    email: "testuser@gmail.com",
    name: "Test User",
    firstName: "Test",
    lastName: "User",
    phone: "9876543210",
    department: "Sales Department",
    city: "Surat",
    district: "Surat",
    mapPath: SURAT_PATH,
    visits: [
      {
        partyName: "Alpha Traders",
        address: "Ring Road, Surat",
        lat: 21.195,
        lng: 72.82,
      },
      {
        partyName: "Krushi Agency",
        address: "Adajan, Surat",
        lat: 21.2274,
        lng: 72.8778,
      },
    ],
  },
  {
    email: "rajesh.field@gmail.com",
    name: "Rajesh Kumar",
    firstName: "Rajesh",
    lastName: "Kumar",
    phone: "9876500001",
    department: "Sales Department",
    city: "Ahmedabad",
    district: "Ahmedabad",
    mapPath: AHMEDABAD_PATH,
    visits: [
      {
        partyName: "Patel Traders",
        address: "Maninagar, Ahmedabad",
        lat: 22.9925,
        lng: 72.6035,
      },
      {
        partyName: "Krushi Kendra",
        address: "Navrangpura, Ahmedabad",
        lat: 23.0369,
        lng: 72.5626,
      },
    ],
  },
  {
    email: "priya.field@gmail.com",
    name: "Priya Shah",
    firstName: "Priya",
    lastName: "Shah",
    phone: "9876500002",
    department: "Sales Department",
    city: "Surat",
    district: "Surat",
    mapPath: SURAT_PATH,
    visits: [
      {
        partyName: "Green Agro Store",
        address: "Varachha, Surat",
        lat: 21.214,
        lng: 72.79,
      },
      {
        partyName: "Bharat Fertilizers",
        address: "Katargam, Surat",
        lat: 21.2274,
        lng: 72.8778,
      },
    ],
  },
];

function dateIso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function atTime(base: Date, hours: number, minutes: number): Date {
  const d = new Date(base);
  d.setUTCHours(hours, minutes, 0, 0);
  return d;
}

function interpolatePath(path: LatLng[], steps: number): LatLng[] {
  if (path.length < 2) return path;
  const out: LatLng[] = [];
  const segments = path.length - 1;
  for (let i = 0; i < steps; i++) {
    const t = i / (steps - 1);
    const seg = Math.min(Math.floor(t * segments), segments - 1);
    const local = (t * segments) % 1;
    const [lat1, lng1] = path[seg];
    const [lat2, lng2] = path[seg + 1];
    out.push([lat1 + (lat2 - lat1) * local, lng1 + (lng2 - lng1) * local]);
  }
  return out;
}

async function ensureFieldUser(
  profile: FieldTestProfile,
  managerId?: mongoose.Types.ObjectId,
  adminId?: mongoose.Types.ObjectId
) {
  const email = profile.email.toLowerCase();
  let user = await User.findOne({ email });
  if (!user) {
    const password = await bcrypt.hash("123456", 10);
    user = new User({
      name: profile.name,
      email,
      password,
      role: "User",
      permissions: [],
      firstName: profile.firstName,
      lastName: profile.lastName,
      phone: profile.phone,
      city: profile.city,
      district: profile.district,
      state: "Gujarat",
      country: "India",
      parentUserId: managerId,
      createdBy: adminId ?? managerId,
    });
    await user.save();
    console.log(`[seed-user-test] Created field user: ${email}`);
  }

  let employee = await Employee.findOne({ email });
  if (!employee) {
    employee = await Employee.create({
      name: profile.name,
      email,
      phone: profile.phone,
      roleDesignation: "Field Executive",
      department: profile.department,
      joiningDate: new Date(),
      salaryStructure: { basic: 25000, allowances: [], deductions: [] },
      status: "Active",
      linkedUserId: user._id,
    });
    console.log(`[seed-user-test] Created employee: ${email}`);
  } else {
    employee.linkedUserId = user._id as mongoose.Types.ObjectId;
    await employee.save();
  }

  return { user, employee };
}

async function seedGpsForDay(
  userId: mongoose.Types.ObjectId,
  employeeId: mongoose.Types.ObjectId | undefined,
  day: Date,
  path: LatLng[],
  visits: FieldTestProfile["visits"],
  makeLastPingRecent: boolean
) {
  const dayStr = dateIso(day);
  const dayStartBound = new Date(`${dayStr}T00:00:00.000Z`);
  const dayEndBound = new Date(`${dayStr}T23:59:59.999Z`);

  const already = await FieldLocationPing.exists({
    userId,
    recordedAt: { $gte: dayStartBound, $lte: dayEndBound },
    address: { $regex: USER_TEST_SEED_TAG },
  });
  if (already) return 0;

  const points = interpolatePath(path, 12);
  const docs: {
    userId: mongoose.Types.ObjectId;
    employeeId?: mongoose.Types.ObjectId;
    lat: number;
    lng: number;
    address?: string;
    kind: LocationPingKind;
    recordedAt: Date;
  }[] = [];

  const startAt = makeLastPingRecent
    ? new Date(Date.now() - 4 * 60 * 60 * 1000)
    : atTime(day, 4, 0);

  docs.push({
    userId,
    employeeId,
    lat: points[0][0],
    lng: points[0][1],
    address: `${USER_TEST_SEED_TAG} Day start`,
    kind: "day_start",
    recordedAt: new Date(startAt),
  });

  for (let i = 1; i < points.length - 1; i++) {
    const pingAt = new Date(startAt.getTime() + i * 20 * 60 * 1000);
    docs.push({
      userId,
      employeeId,
      lat: points[i][0],
      lng: points[i][1],
      address: `${USER_TEST_SEED_TAG} En route`,
      kind: "ping",
      recordedAt: pingAt,
    });
  }

  visits.forEach((v, idx) => {
    const visitAt = new Date(startAt.getTime() + (3 + idx * 2) * 60 * 60 * 1000);
    docs.push({
      userId,
      employeeId,
      lat: v.lat,
      lng: v.lng,
      address: `${USER_TEST_SEED_TAG} ${v.address}`,
      kind: "visit",
      recordedAt: visitAt,
    });
  });

  const last = points[points.length - 1];
  let endAt = new Date(startAt.getTime() + (points.length - 1) * 20 * 60 * 1000);
  if (makeLastPingRecent) {
    endAt = new Date(Date.now() - 3 * 60 * 1000);
    docs.push({
      userId,
      employeeId,
      lat: last[0],
      lng: last[1],
      address: `${USER_TEST_SEED_TAG} Current location`,
      kind: "ping",
      recordedAt: endAt,
    });
  } else {
    docs.push({
      userId,
      employeeId,
      lat: last[0],
      lng: last[1],
      address: `${USER_TEST_SEED_TAG} Day end`,
      kind: "day_end",
      recordedAt: endAt,
    });
  }

  await FieldLocationPing.insertMany(docs);
  return docs.length;
}

async function seedTasksForUser(
  userId: string,
  userName: string,
  assignedByUserId: string
) {
  const key = `${USER_TEST_SEED_TAG} visit`;
  const exists = await Task.exists({
    assigneeUserId: userId,
    description: { $regex: USER_TEST_SEED_TAG },
  });
  if (exists) return;

  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  await Task.insertMany([
    {
      taskName: `Client visit — ${userName}`,
      description: `${USER_TEST_SEED_TAG} Field visit to dealer`,
      setDate: today,
      dueDate: today,
      status: "completed",
      assigneeUserId: userId,
      assignedUserIds: [userId],
      assignedByUserId,
      priority: "medium",
    },
    {
      taskName: `Follow-up visit — ${userName}`,
      description: `${USER_TEST_SEED_TAG} Dealer follow-up`,
      setDate: yesterday,
      dueDate: yesterday,
      status: "in_progress",
      assigneeUserId: userId,
      assignedUserIds: [userId],
      assignedByUserId,
      priority: "high",
    },
  ]);
}

async function seedSalesForUser(
  userId: mongoose.Types.ObjectId,
  userName: string,
  suffix: string
) {
  const voucherNo = `USR-TEST-${suffix}-001`;
  if (await SalesVoucher.exists({ voucherNo })) return;

  const product = await Product.findOne().lean();
  if (!product) return;

  const total = 12500;
  await SalesVoucher.create({
    partyName: "Alpha Traders",
    voucherNo,
    voucherDate: new Date(),
    orderby: userName,
    createdByUserId: userId,
    items: [
      {
        product: product._id,
        quantity: 10,
        rateParUnit: 1250,
        subtotal: total,
        unit: "Bag",
      },
    ],
    gstAmount: 0,
    totalAmount: total,
    paidAmount: 5000,
    paymentMode: "Credit",
    paymentStatus: "Partial",
    orderStatus: "Processing",
    narration: USER_TEST_SEED_TAG,
  });
}

async function seedExpensesForUser(userName: string, suffix: string) {
  const desc = `${USER_TEST_SEED_TAG} Fuel — ${suffix}`;
  if (await ExpenseVoucher.exists({ description: desc })) return;

  const today = new Date();
  await ExpenseVoucher.insertMany([
    {
      startDate: today,
      expenseType: "Fuel",
      description: desc,
      paidTo: userName,
      paymentMode: "UPI",
      amount: 850,
    },
    {
      startDate: today,
      expenseType: "Travel",
      description: `${USER_TEST_SEED_TAG} Client travel — ${suffix}`,
      paidTo: "BP Petrol Pump",
      paymentMode: "Cash",
      amount: 1200,
    },
  ]);
}

export async function seedUserTestData(): Promise<void> {
  if (process.env.SEED_USER_TEST_DATA === "false") {
    return;
  }

  await ensureDefaultUsers();

  if (process.env.SEED_USER_TEST_DATA_FORCE === "true") {
    await FieldLocationPing.deleteMany({
      address: { $regex: USER_TEST_SEED_TAG },
    });
    await Task.deleteMany({ description: { $regex: USER_TEST_SEED_TAG } });
    await ExpenseVoucher.deleteMany({
      description: { $regex: USER_TEST_SEED_TAG },
    });
    await SalesVoucher.deleteMany({ narration: USER_TEST_SEED_TAG });
    console.log("[seed-user-test] Cleared previous test GPS/tasks/orders/expenses");
  }

  const admin = await User.findOne({ email: "admin@gmail.com" });
  const manager = await User.findOne({ email: "manager@gmail.com" });
  const managerId = manager?._id as mongoose.Types.ObjectId | undefined;
  const adminId = admin?._id as mongoose.Types.ObjectId | undefined;
  const assignedBy = String(managerId ?? adminId ?? "");

  const today = new Date();
  const days = [0, 1, 2].map((offset) => {
    const d = new Date(today);
    d.setDate(d.getDate() - offset);
    return d;
  });

  let totalPings = 0;

  for (let i = 0; i < FIELD_PROFILES.length; i++) {
    const profile = FIELD_PROFILES[i];
    const { user, employee } = await ensureFieldUser(profile, managerId, adminId);
    const uid = user._id as mongoose.Types.ObjectId;
    const eid = employee._id as mongoose.Types.ObjectId;
    const suffix = profile.email.split("@")[0].replace(/\./g, "-");

    for (let d = 0; d < days.length; d++) {
      const day = days[d];
      const n = await seedGpsForDay(
        uid,
        eid,
        day,
        profile.mapPath,
        profile.visits,
        d === 0 && i === 0
      );
      totalPings += n;
    }

    if (assignedBy) {
      await seedTasksForUser(String(uid), profile.name, assignedBy);
    }
    await seedSalesForUser(uid, profile.name, suffix);
    await seedExpensesForUser(profile.name, suffix);
  }

  const linked = await syncEmployeeUserLinks();
  console.log(
    `[seed-user-test] Done. Field users ready (password 123456): ${FIELD_PROFILES.map((p) => p.email).join(", ")} — ${totalPings} new GPS pings — ${linked} employee link(s)`
  );
}
