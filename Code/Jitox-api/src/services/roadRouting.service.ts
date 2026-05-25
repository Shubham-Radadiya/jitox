/**
 * Snap GPS traces to drivable roads (OSRM / OpenStreetMap) — Uber/Rapido-style routing.
 */

const DEFAULT_OSRM_BASE = "https://router.project-osrm.org";
const MAX_WAYPOINTS = 80;
const REQUEST_TIMEOUT_MS = 15_000;

export type LatLng = [number, number];

const memoryCache = new Map<string, LatLng[]>();
const CACHE_MAX = 200;

function haversineKm(
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

function roundKm(km: number): number {
  return Math.round(km * 10) / 10;
}

function isRoadSnappingEnabled(): boolean {
  if (process.env.ROAD_SNAPPING === "false") return false;
  return process.env.ROAD_SNAPPING !== "disabled";
}

function osrmBaseUrl(): string {
  return String(process.env.OSRM_BASE_URL || DEFAULT_OSRM_BASE).replace(
    /\/$/,
    ""
  );
}

function cacheKey(path: LatLng[]): string {
  return path
    .map(([lat, lng]) => `${lat.toFixed(5)},${lng.toFixed(5)}`)
    .join("|");
}

export function samplePathForRouting(
  path: LatLng[],
  maxPoints = MAX_WAYPOINTS
): LatLng[] {
  if (path.length <= maxPoints) return path;
  const out: LatLng[] = [];
  const last = path.length - 1;
  for (let i = 0; i < maxPoints; i++) {
    const idx = Math.round((i / (maxPoints - 1)) * last);
    out.push(path[idx]);
  }
  return out;
}

function decodeOsrmGeometry(
  geometry: { coordinates?: [number, number][] } | undefined
): LatLng[] | null {
  if (!geometry?.coordinates?.length) return null;
  return geometry.coordinates.map(([lng, lat]) => [lat, lng] as LatLng);
}

function coordsToOsrmString(path: LatLng[]): string {
  return path.map(([lat, lng]) => `${lng},${lat}`).join(";");
}

async function fetchOsrmJson(url: string): Promise<Record<string, unknown> | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;
    const body = (await res.json()) as Record<string, unknown>;
    if (body.code !== "Ok") return null;
    return body;
  } catch (err) {
    console.warn("[roadRouting] OSRM request failed:", err);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** Map-match GPS trace to road network (best for live tracking). */
async function matchPathToRoads(sampled: LatLng[]): Promise<{
  path: LatLng[] | null;
  distanceM?: number;
}> {
  const coordStr = coordsToOsrmString(sampled);
  const radiuses = sampled.map(() => "50").join(";");
  const url =
    `${osrmBaseUrl()}/match/v1/driving/${coordStr}` +
    `?overview=full&geometries=geojson&tidy=true&gaps=ignore&radiuses=${radiuses}`;

  const body = await fetchOsrmJson(url);
  const matchings = body?.matchings as
    | { geometry?: { coordinates?: [number, number][] }; distance?: number }[]
    | undefined;
  const m = matchings?.[0];
  const path = decodeOsrmGeometry(m?.geometry);
  return { path, distanceM: m?.distance };
}

async function routePathToRoads(sampled: LatLng[]): Promise<{
  path: LatLng[] | null;
  distanceM?: number;
}> {
  const coordStr = coordsToOsrmString(sampled);
  const url =
    `${osrmBaseUrl()}/route/v1/driving/${coordStr}` +
    "?overview=full&geometries=geojson&continue_straight=false";

  const body = await fetchOsrmJson(url);
  const routes = body?.routes as
    | { geometry?: { coordinates?: [number, number][] }; distance?: number }[]
    | undefined;
  const r = routes?.[0];
  return { path: decodeOsrmGeometry(r?.geometry), distanceM: r?.distance };
}

/**
 * Split road path at closest point to current GPS (traveled vs ahead).
 */
export function splitPathAtPosition(
  roadPath: LatLng[],
  current: { lat: number; lng: number } | null | undefined
): { traveled: LatLng[]; remaining: LatLng[] } {
  if (!current || roadPath.length < 2) {
    return { traveled: roadPath, remaining: [] };
  }

  let bestIdx = 0;
  let bestKm = Infinity;
  for (let i = 0; i < roadPath.length; i++) {
    const km = haversineKm(
      { lat: roadPath[i][0], lng: roadPath[i][1] },
      current
    );
    if (km < bestKm) {
      bestKm = km;
      bestIdx = i;
    }
  }

  const traveled = roadPath.slice(0, bestIdx + 1);
  const remaining = roadPath.slice(bestIdx);
  if (traveled.length < 2 && roadPath.length >= 2) {
    return { traveled: roadPath.slice(0, 2), remaining: roadPath.slice(1) };
  }
  return { traveled, remaining };
}

export function pathLengthKmFromPoints(path: LatLng[]): number {
  if (path.length < 2) return 0;
  let sum = 0;
  for (let i = 1; i < path.length; i++) {
    sum += haversineKm(
      { lat: path[i - 1][0], lng: path[i - 1][1] },
      { lat: path[i][0], lng: path[i][1] }
    );
  }
  return roundKm(sum);
}

/**
 * Full road-aligned path for map display (follows streets like ride-hailing apps).
 */
export async function snapPathToRoads(path: LatLng[]): Promise<LatLng[]> {
  if (!isRoadSnappingEnabled() || path.length < 2) return path;

  const key = cacheKey(path);
  const cached = memoryCache.get(key);
  if (cached) return cached;

  const sampled = samplePathForRouting(path);
  let snapped =
    (await matchPathToRoads(sampled)).path ??
    (await routePathToRoads(sampled)).path;

  if (!snapped || snapped.length < 2) return path;

  if (memoryCache.size >= CACHE_MAX) {
    const first = memoryCache.keys().next().value;
    if (first) memoryCache.delete(first);
  }
  memoryCache.set(key, snapped);
  return snapped;
}

export async function buildRideStylePaths(
  rawPath: LatLng[],
  current: { lat: number; lng: number } | null | undefined
): Promise<{
  path: LatLng[];
  traveledPath: LatLng[];
  totalPathKm: number;
  followsRoads: boolean;
}> {
  if (rawPath.length < 2) {
    return {
      path: rawPath,
      traveledPath: rawPath,
      totalPathKm: 0,
      followsRoads: false,
    };
  }

  const roadPath = await snapPathToRoads(rawPath);
  const followsRoads =
    roadPath.length >= 2 &&
    (roadPath.length !== rawPath.length ||
      roadPath[0][0] !== rawPath[0][0] ||
      roadPath[0][1] !== rawPath[0][1]);

  const { traveled } = splitPathAtPosition(roadPath, current);
  const traveledPath = traveled.length >= 2 ? traveled : roadPath;

  return {
    path: roadPath,
    traveledPath,
    totalPathKm: pathLengthKmFromPoints(roadPath),
    followsRoads,
  };
}
