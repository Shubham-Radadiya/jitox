import mongoose from "mongoose";
import FieldLocationPing, {
  LocationPingKind,
} from "../models/fieldLocationPing.model";
import Employee from "../models/employee.model";
import User from "../models/user.model";
import {
  employeesTrackingSeed,
  EmployeeSeed,
} from "../data/employeeTracking.seed";
import { buildRideStylePaths } from "./roadRouting.service";

type LatLngPath = [number, number][];

async function enrichMapTrack(
  track: MapTrack | undefined,
  current?: { lat: number; lng: number } | null
): Promise<MapTrack | undefined> {
  if (!track?.path?.length || track.path.length < 2) return track;
  const ride = await buildRideStylePaths(track.path, current ?? null);
  return {
    ...track,
    path: ride.path,
    traveledPath: ride.traveledPath,
    totalPathKm: ride.totalPathKm,
    followsRoads: ride.followsRoads,
  };
}

async function snapFleetTrackPaths(
  tracks: {
    path: LatLngPath;
    traveledPath?: LatLngPath;
    totalPathKm: number;
    currentPosition?: { lat: number; lng: number } | null;
    online?: boolean;
  }[]
): Promise<void> {
  await Promise.all(
    tracks.map(async (t) => {
      if (t.path.length < 2) return;
      const ride = await buildRideStylePaths(
        t.path,
        t.online ? t.currentPosition : null
      );
      t.path = ride.path;
      t.traveledPath = ride.traveledPath;
      t.totalPathKm = ride.totalPathKm;
    })
  );
}

const ONLINE_WINDOW_MS = 15 * 60 * 1000;

export function haversineKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const h =
    sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng;
  return R * (2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h)));
}

export function roundKm(km: number): number {
  return Math.round(km * 10) / 10;
}

function pathLengthKm(path: [number, number][]): number {
  if (path.length < 2) return 0;
  let sum = 0;
  for (let i = 1; i < path.length; i++) {
    const [la, ln] = path[i - 1];
    const [lb, le] = path[i];
    sum += haversineKm({ lat: la, lng: ln }, { lat: lb, lng: le });
  }
  return roundKm(sum);
}

function dateIso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function formatDisplayDate(iso: string): string {
  const d = new Date(`${iso}T12:00:00`);
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function workingHoursLabel(start: Date, end: Date): string {
  const ms = Math.max(0, end.getTime() - start.getTime());
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")} Hrs`;
}

/** Resolve dashboard tracking user id for an HRM employee row. */
async function resolveUserIdForEmployee(emp: {
  _id: mongoose.Types.ObjectId | unknown;
  linkedUserId?: unknown;
  email?: string;
}): Promise<string | null> {
  if (emp.linkedUserId) return String(emp.linkedUserId);

  const empId =
    emp._id instanceof mongoose.Types.ObjectId
      ? emp._id
      : new mongoose.Types.ObjectId(String(emp._id));

  const ping = await FieldLocationPing.findOne({ employeeId: empId })
    .sort({ recordedAt: -1 })
    .select("userId")
    .lean();
  if (ping?.userId) return String(ping.userId);

  const email = String(emp.email || "")
    .trim()
    .toLowerCase();
  if (!email) return null;

  const user = await User.findOne({ email }).select("_id").lean();
  if (!user?._id) return null;

  await Employee.updateOne({ _id: empId }, { $set: { linkedUserId: user._id } });
  return String(user._id);
}

/** Link HRM employees to User Master accounts by matching email (and GPS history). */
export async function syncEmployeeUserLinks(): Promise<number> {
  let linked = 0;
  const employees = await Employee.find({ status: "Active" }).lean();
  for (const emp of employees) {
    const uid = await resolveUserIdForEmployee(emp);
    if (uid) linked += 1;
  }
  return linked;
}

export async function recordLocationPing(input: {
  userId: string;
  lat: number;
  lng: number;
  accuracy?: number;
  speed?: number;
  heading?: number;
  address?: string;
  kind?: LocationPingKind;
  recordedAt?: Date;
}) {
  const userId = new mongoose.Types.ObjectId(input.userId);
  let employeeId: mongoose.Types.ObjectId | undefined;
  let emp = await Employee.findOne({ linkedUserId: userId }).select("_id email").lean();
  if (emp?._id) {
    employeeId = emp._id as mongoose.Types.ObjectId;
  } else {
    const user = await User.findById(userId).select("email").lean();
    const email = String(user?.email || "")
      .trim()
      .toLowerCase();
    if (email) {
      emp = await Employee.findOne({ email }).select("_id linkedUserId").lean();
      if (emp?._id) {
        employeeId = emp._id as mongoose.Types.ObjectId;
        if (!emp.linkedUserId) {
          await Employee.updateOne(
            { _id: emp._id },
            { $set: { linkedUserId: userId } }
          );
        }
      }
    }
  }

  const doc = await FieldLocationPing.create({
    userId,
    employeeId,
    lat: input.lat,
    lng: input.lng,
    accuracy: input.accuracy,
    speed: input.speed,
    heading: input.heading,
    address: input.address?.trim() || undefined,
    kind: input.kind || "ping",
    recordedAt: input.recordedAt || new Date(),
  });

  return {
    id: String(doc._id),
    recordedAt: doc.recordedAt,
  };
}

async function latestPingByUserIds(userIds: mongoose.Types.ObjectId[]) {
  if (!userIds.length) return new Map<string, Date>();
  const since = new Date(Date.now() - ONLINE_WINDOW_MS);
  const rows = await FieldLocationPing.aggregate([
    { $match: { userId: { $in: userIds }, recordedAt: { $gte: since } } },
    { $sort: { recordedAt: -1 } },
    {
      $group: {
        _id: "$userId",
        lastAt: { $first: "$recordedAt" },
      },
    },
  ]);
  const map = new Map<string, Date>();
  for (const r of rows) {
    map.set(String(r._id), r.lastAt);
  }
  return map;
}

export async function listEmployeesForTracking() {
  await syncEmployeeUserLinks();

  const fromDb = await Employee.find({ status: "Active" })
    .sort({ name: 1 })
    .lean();

  const fieldUsers = await User.find({
    role: "User",
  })
    .select("name email role district region updatedAt")
    .sort({ name: 1 })
    .lean();

  const linkedUserIds = new Set(
    fromDb
      .map((e) => (e.linkedUserId ? String(e.linkedUserId) : ""))
      .filter(Boolean)
  );

  const userIds: mongoose.Types.ObjectId[] = [];
  const employees: {
    id: string;
    userId?: string;
    name: string;
    department: string;
    time: string;
    online: boolean;
    isDemo?: boolean;
  }[] = [];

  for (const e of fromDb) {
    const resolvedId = await resolveUserIdForEmployee(e);
    const uid = resolvedId
      ? new mongoose.Types.ObjectId(resolvedId)
      : null;
    if (uid) userIds.push(uid);
    employees.push({
      id: String(e._id),
      userId: resolvedId || undefined,
      name: e.name,
      department: e.department,
      time: e.updatedAt
        ? new Date(e.updatedAt).toLocaleTimeString("en-IN", {
            hour: "numeric",
            minute: "2-digit",
          })
        : "—",
      online: false,
    });
  }

  for (const u of fieldUsers) {
    const uid = String(u._id);
    if (linkedUserIds.has(uid)) continue;
    userIds.push(u._id as mongoose.Types.ObjectId);
    employees.push({
      id: uid,
      userId: uid,
      name: u.name || u.email || "Field user",
      department: u.district || u.region || u.role || "Field",
      time: u.updatedAt
        ? new Date(u.updatedAt).toLocaleTimeString("en-IN", {
            hour: "numeric",
            minute: "2-digit",
          })
        : "—",
      online: false,
    });
  }

  const onlineMap = await latestPingByUserIds(userIds);
  for (const emp of employees) {
    if (emp.userId && onlineMap.has(emp.userId)) {
      emp.online = true;
      emp.time = new Date(onlineMap.get(emp.userId)!).toLocaleTimeString(
        "en-IN",
        { hour: "numeric", minute: "2-digit" }
      );
    }
  }

  if (shouldIncludeDemoTracking()) {
    const ids = new Set(employees.map((m) => m.id));
    for (const s of employeesTrackingSeed) {
      if (!ids.has(s.id)) {
        employees.push({
          id: s.id,
          userId: undefined,
          name: s.name,
          department: s.department,
          time: s.time,
          online: s.online,
          isDemo: true,
        });
      }
    }
  }

  const trackable = employees.filter((e) => Boolean(e.userId) || e.isDemo);
  return { employees: trackable };
}

type MapTrack = {
  path: [number, number][];
  traveledPath?: [number, number][];
  followsRoads?: boolean;
  totalPathKm: number;
  stops: {
    lat: number;
    lng: number;
    time: string;
    partyName: string;
    address: string;
    distanceFromPrevKm: number | null;
  }[];
};

function buildMapTrackFromPings(
  pings: { lat: number; lng: number; recordedAt: Date; address?: string; kind: string }[]
): MapTrack | undefined {
  if (!pings.length) return undefined;
  const path: [number, number][] = pings.map((p) => [p.lat, p.lng]);
  const stops = pings.map((p, i) => ({
    lat: p.lat,
    lng: p.lng,
    time: new Date(p.recordedAt).toLocaleTimeString("en-IN", {
      hour: "numeric",
      minute: "2-digit",
    }),
    partyName:
      p.kind === "day_start"
        ? "Day start"
        : p.kind === "day_end"
          ? "Day end"
          : p.kind === "visit"
            ? "Visit"
            : "Track point",
    address: p.address || "",
    distanceFromPrevKm:
      i === 0
        ? null
        : roundKm(
            haversineKm(
              { lat: pings[i - 1].lat, lng: pings[i - 1].lng },
              { lat: p.lat, lng: p.lng }
            )
          ),
  }));
  return {
    path,
    totalPathKm: pathLengthKm(path),
    stops,
  };
}

async function mapTrackingDayFromPings(
  dayIso: string,
  pings: { lat: number; lng: number; recordedAt: Date; address?: string; kind: string }[]
) {
  const sorted = [...pings].sort(
    (a, b) => a.recordedAt.getTime() - b.recordedAt.getTime()
  );
  const rawKm = pathLengthKm(sorted.map((p) => [p.lat, p.lng]));
  const visitCount = sorted.filter((p) => p.kind === "visit").length;
  const start = sorted[0]?.recordedAt;
  const end = sorted[sorted.length - 1]?.recordedAt;
  const workingHours =
    start && end ? workingHoursLabel(start, end) : "—";

  const lastPing = sorted[sorted.length - 1];
  const mapTrack = await enrichMapTrack(
    buildMapTrackFromPings(sorted),
    lastPing ? { lat: lastPing.lat, lng: lastPing.lng } : null
  );
  const travelledKm = mapTrack?.totalPathKm ?? rawKm;

  return {
    Date: formatDisplayDate(dayIso),
    dateIso: dayIso,
    "Opening KM": "—",
    "Closing KM": "—",
    "Travelled KM": `${travelledKm} Km`,
    Visit: String(
      visitCount > 0 ? visitCount : sorted.length > 1 ? sorted.length : 0
    ),
    "Working Hours": workingHours,
    _visits: sorted.map((p, i) => ({
      time: new Date(p.recordedAt).toLocaleTimeString("en-IN", {
        hour: "numeric",
        minute: "2-digit",
      }),
      partyName:
        p.kind === "day_start"
          ? "Day start"
          : p.kind === "day_end"
            ? "Day end"
            : "Location",
      duration: "—",
      address: p.address || `${p.lat.toFixed(5)}, ${p.lng.toFixed(5)}`,
      lat: p.lat,
      lng: p.lng,
      distanceFromPrevKm:
        i === 0
          ? null
          : roundKm(
              haversineKm(
                { lat: sorted[i - 1].lat, lng: sorted[i - 1].lng },
                { lat: p.lat, lng: p.lng }
              )
            ),
    })),
    _mapTrack: mapTrack,
  };
}

async function resolveSubject(id: string) {
  if (mongoose.Types.ObjectId.isValid(id)) {
    const emp = await Employee.findById(id).lean();
    if (emp) {
      const userId = await resolveUserIdForEmployee(emp);
      return {
        kind: "employee" as const,
        employee: emp,
        userId,
      };
    }
    const user = await User.findById(id).lean();
    if (user) {
      return { kind: "user" as const, user, userId: String(user._id) };
    }
  }

  if (shouldIncludeDemoTracking()) {
    const seed = employeesTrackingSeed.find((e) => e.id === id);
    if (seed) return { kind: "seed" as const, seed };
  }

  return null;
}

export async function buildEmployeeTrackingRows(
  id: string,
  query: Record<string, unknown>
) {
  const from = query.from ? String(query.from) : "";
  const to = query.to ? String(query.to) : "";
  const subject = await resolveSubject(id);

  if (!subject) return null;

  if (subject.kind === "seed") {
    const seed = subject.seed;
    let days = [...seed.tracking];
    if (from) days = days.filter((d) => d.dateIso >= from);
    if (to) days = days.filter((d) => d.dateIso <= to);
    const rows = await Promise.all(
      days.map(async (d) => {
        const row = mapSeedTrackingDay(d);
        const seedTrack = row._mapTrack;
        if (seedTrack?.path && seedTrack.path.length >= 2) {
          const last = seedTrack.path[seedTrack.path.length - 1];
          row._mapTrack = await enrichMapTrack(seedTrack, {
            lat: last[0],
            lng: last[1],
          });
          if (row._mapTrack) {
            row["Travelled KM"] = `${row._mapTrack.totalPathKm} Km`;
          }
        }
        return row;
      })
    );
    return {
      employee: {
        id: seed.id,
        name: seed.name,
        department: seed.department,
      },
      rows,
    };
  }

  let userId = subject.userId;
  const name =
    subject.kind === "employee"
      ? subject.employee.name
      : subject.user?.name || subject.user?.email || "Employee";
  const department =
    subject.kind === "employee"
      ? subject.employee.department
      : subject.user?.district || subject.user?.role || "Field";

  if (!userId && subject.kind === "employee") {
    userId = await resolveUserIdForEmployee(subject.employee);
  }

  let match: Record<string, unknown>;
  if (userId) {
    match = { userId: new mongoose.Types.ObjectId(userId) };
  } else if (subject.kind === "employee") {
    const empId =
      subject.employee._id instanceof mongoose.Types.ObjectId
        ? subject.employee._id
        : new mongoose.Types.ObjectId(String(subject.employee._id));
    const hasPings = await FieldLocationPing.exists({ employeeId: empId });
    if (!hasPings) {
      return {
        employee: { id, name, department },
        rows: [] as ReturnType<typeof mapTrackingDayFromPings>[],
      };
    }
    match = { employeeId: empId };
  } else {
    return {
      employee: { id, name, department },
      rows: [] as ReturnType<typeof mapTrackingDayFromPings>[],
    };
  }
  if (from || to) {
    const recordedAt: Record<string, Date> = {};
    if (from) recordedAt.$gte = new Date(`${from}T00:00:00.000Z`);
    if (to) recordedAt.$lte = new Date(`${to}T23:59:59.999Z`);
    match.recordedAt = recordedAt;
  }

  const pings = await FieldLocationPing.find(match)
    .sort({ recordedAt: 1 })
    .lean();

  const byDay = new Map<string, typeof pings>();
  for (const p of pings) {
    const iso = dateIso(new Date(p.recordedAt));
    if (!byDay.has(iso)) byDay.set(iso, []);
    byDay.get(iso)!.push(p);
  }

  const dayIsos = [...byDay.keys()].sort((a, b) => b.localeCompare(a));
  const rows = await Promise.all(
    dayIsos.map((iso) =>
      mapTrackingDayFromPings(
        iso,
        byDay.get(iso)!.map((p) => ({
          lat: p.lat,
          lng: p.lng,
          recordedAt: new Date(p.recordedAt),
          address: p.address,
          kind: p.kind,
        }))
      )
    )
  );

  return {
    employee: { id, name, department, userId: userId || undefined },
    rows,
  };
}

function mapSeedTrackingDay(d: EmployeeSeed["tracking"][0]) {
  const visits = d.visits;
  const pathFromVisits: [number, number][] = visits.map((v) => [v.lat, v.lng]);
  const path: [number, number][] =
    d.mapPath && d.mapPath.length >= 2 ? d.mapPath : pathFromVisits;

  const visitsWithLegs = visits.map((v, i) => {
    const distanceFromPrevKm =
      i === 0 ? null : roundKm(haversineKm(visits[i - 1], v));
    return { ...v, distanceFromPrevKm };
  });

  const mapTrack =
    visits.length > 0 || path.length >= 2
      ? {
          path,
          totalPathKm: pathLengthKm(path),
          stops: visitsWithLegs.map((v) => ({
            lat: v.lat,
            lng: v.lng,
            time: v.time,
            partyName: v.partyName,
            address: v.address,
            distanceFromPrevKm: v.distanceFromPrevKm,
          })),
        }
      : undefined;

  return {
    Date: d.dateDisplay,
    dateIso: d.dateIso,
    "Opening KM": `${d.openingKm} Km`,
    "Closing KM": `${d.closingKm} Km`,
    "Travelled KM": `${d.travelledKm} Km`,
    Visit: String(d.visit),
    "Working Hours": d.workingHours,
    _visits: visitsWithLegs,
    _mapTrack: mapTrack,
  };
}

const FLEET_COLORS = [
  "#0A9242",
  "#2563EB",
  "#C2410C",
  "#7C3AED",
  "#0891B2",
  "#BE123C",
  "#CA8A04",
  "#4B5563",
];

/** Demo/sample routes only when explicitly enabled (default: fully dynamic per user). */
export function shouldIncludeDemoTracking(): boolean {
  return process.env.INCLUDE_DEMO_TRACKING === "true";
}

/** Sample routes for admin fleet map when no live pings exist yet. */
function buildDemoFleetTracks(requestedDate: string) {
  let colorIdx = 0;
  const tracks: {
    id: string;
    userId: string;
    name: string;
    department: string;
    color: string;
    online: boolean;
    lastAt: string | null;
    path: [number, number][];
    totalPathKm: number;
    currentPosition: { lat: number; lng: number } | null;
    stops: MapTrack["stops"];
    isDemo?: boolean;
  }[] = [];

  for (const seed of employeesTrackingSeed) {
    const day =
      seed.tracking.find((d) => d.dateIso === requestedDate) ||
      seed.tracking.find((d) => (d.mapPath?.length ?? 0) >= 2) ||
      seed.tracking.find((d) => d.visits.length > 0);
    if (!day) continue;

    const path: [number, number][] =
      day.mapPath && day.mapPath.length >= 2
        ? [...day.mapPath]
        : day.visits.map((v) => [v.lat, v.lng] as [number, number]);
    if (!path.length) continue;

    const last = path[path.length - 1];
    const stops = day.visits.map((v, i) => ({
      lat: v.lat,
      lng: v.lng,
      time: v.time,
      partyName: v.partyName,
      address: v.address,
      distanceFromPrevKm:
        i === 0
          ? null
          : roundKm(
              haversineKm(
                { lat: day.visits[i - 1].lat, lng: day.visits[i - 1].lng },
                { lat: v.lat, lng: v.lng }
              )
            ),
    }));

    tracks.push({
      id: seed.id,
      userId: seed.id,
      name: seed.name,
      department: seed.department,
      color: FLEET_COLORS[colorIdx % FLEET_COLORS.length],
      online: seed.online,
      lastAt: null,
      path,
      totalPathKm: pathLengthKm(path),
      currentPosition: { lat: last[0], lng: last[1] },
      stops,
      isDemo: true,
    });
    colorIdx++;
  }

  return tracks;
}

export async function getFleetTracking(query: Record<string, unknown>) {
  const date =
    query.date && String(query.date).length >= 10
      ? String(query.date).slice(0, 10)
      : dateIso(new Date());

  const start = new Date(`${date}T00:00:00.000Z`);
  const end = new Date(`${date}T23:59:59.999Z`);

  const pings = await FieldLocationPing.find({
    recordedAt: { $gte: start, $lte: end },
  })
    .sort({ recordedAt: 1 })
    .lean();

  const pingUserIds = [
    ...new Set(pings.map((p) => String(p.userId))),
  ].filter((id) => mongoose.Types.ObjectId.isValid(id));

  const users = await User.find({
    _id: {
      $in: pingUserIds.map((id) => new mongoose.Types.ObjectId(id)),
    },
  })
    .select("name email role district")
    .lean();

  const userMap = new Map(users.map((u) => [String(u._id), u]));

  const byUser = new Map<string, typeof pings>();
  for (const p of pings) {
    const uid = String(p.userId);
    if (!byUser.has(uid)) byUser.set(uid, []);
    byUser.get(uid)!.push(p);
  }

  const onlineSince = new Date(Date.now() - ONLINE_WINDOW_MS);
  const recentOnline = await FieldLocationPing.aggregate([
    { $match: { recordedAt: { $gte: onlineSince } } },
    { $sort: { recordedAt: -1 } },
    {
      $group: {
        _id: "$userId",
        lastPing: { $first: "$$ROOT" },
      },
    },
  ]);

  for (const row of recentOnline) {
    const uid = String(row._id);
    if (byUser.has(uid)) continue;
    byUser.set(uid, [row.lastPing]);
  }

  const allUserIds = [...byUser.keys()].filter((id) =>
    mongoose.Types.ObjectId.isValid(id)
  );
  const missingIds = allUserIds.filter((id) => !userMap.has(id));
  if (missingIds.length) {
    const extra = await User.find({
      _id: { $in: missingIds.map((id) => new mongoose.Types.ObjectId(id)) },
    })
      .select("name email role district")
      .lean();
    for (const u of extra) userMap.set(String(u._id), u);
  }

  let colorIdx = 0;
  const tracks: {
    id: string;
    userId: string;
    name: string;
    department: string;
    color: string;
    online: boolean;
    lastAt: string | null;
    path: [number, number][];
    traveledPath?: [number, number][];
    totalPathKm: number;
    currentPosition: { lat: number; lng: number } | null;
    stops: MapTrack["stops"];
  }[] = [];

  for (const [userId, userPings] of byUser) {
    const u = userMap.get(userId);
    if (u && u.role && u.role !== "User") continue;

    const allSorted = [...userPings].sort(
      (a, b) =>
        new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime()
    );
    const dayPings = allSorted.filter((p) => {
      const t = new Date(p.recordedAt).getTime();
      return t >= start.getTime() && t <= end.getTime();
    });
    const path: [number, number][] = dayPings.map((p) => [p.lat, p.lng]);
    const lastOverall = allSorted[allSorted.length - 1];
    const lastAt = lastOverall ? new Date(lastOverall.recordedAt) : null;
    const mapTrack = buildMapTrackFromPings(
      dayPings.map((p) => ({
        lat: p.lat,
        lng: p.lng,
        recordedAt: new Date(p.recordedAt),
        address: p.address,
        kind: p.kind,
      }))
    );

    tracks.push({
      id: userId,
      userId,
      name: u?.name || u?.email || "Field user",
      department: u?.district || u?.role || "Field",
      color: FLEET_COLORS[colorIdx % FLEET_COLORS.length],
      online: lastAt ? lastAt >= onlineSince : false,
      lastAt: lastAt ? lastAt.toISOString() : null,
      path,
      totalPathKm: pathLengthKm(path),
      currentPosition: lastOverall
        ? { lat: lastOverall.lat, lng: lastOverall.lng }
        : null,
      stops: mapTrack?.stops || [],
    });
    colorIdx++;
  }

  tracks.sort((a, b) => {
    if (a.online !== b.online) return a.online ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  let demoMode = false;
  if (shouldIncludeDemoTracking() && tracks.length === 0) {
    const demo = buildDemoFleetTracks(date);
    if (demo.length) {
      tracks.push(...demo);
      demoMode = true;
    }
  }

  await snapFleetTrackPaths(tracks);

  return { date, tracks, demoMode, followsRoads: true };
}

export async function getMyTrackingToday(userId: string) {
  const today = dateIso(new Date());
  const start = new Date(`${today}T00:00:00.000Z`);
  const end = new Date(`${today}T23:59:59.999Z`);

  const pings = await FieldLocationPing.find({
    userId: new mongoose.Types.ObjectId(userId),
    recordedAt: { $gte: start, $lte: end },
  })
    .sort({ recordedAt: 1 })
    .lean();

  const rawPath: [number, number][] = pings.map((p) => [p.lat, p.lng]);
  const last = pings[pings.length - 1];
  const current = last ? { lat: last.lat, lng: last.lng } : null;
  const ride =
    rawPath.length >= 2
      ? await buildRideStylePaths(rawPath, current)
      : {
          path: rawPath,
          traveledPath: rawPath,
          totalPathKm: 0,
          followsRoads: false,
        };

  return {
    date: today,
    path: ride.path,
    traveledPath: ride.traveledPath,
    totalPathKm: ride.totalPathKm,
    currentPosition: current,
    pingCount: pings.length,
    followsRoads: ride.followsRoads,
  };
}
