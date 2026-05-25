import { useEffect, useRef } from "react";
import L from "leaflet";
import { useLeafletInvalidateSize } from "../../hooks/useLeafletInvalidateSize";
import "leaflet/dist/leaflet.css";

import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

const DefaultIcon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function isDrawableTrack(track) {
  return (
    (Array.isArray(track.path) && track.path.length > 0) ||
    Boolean(track.currentPosition?.lat && track.currentPosition?.lng)
  );
}

/**
 * @param {{
 *   tracks: {
 *     id: string;
 *     name: string;
 *     department?: string;
 *     color: string;
 *     online?: boolean;
 *     path: [number, number][];
 *     traveledPath?: [number, number][];
 *     totalPathKm?: number;
 *     currentPosition?: { lat: number; lng: number } | null;
 *   }[];
 *   dateLabel?: string;
 *   highlightUserId?: string | null;
 *   className?: string;
 * }} props
 */
export function EmployeeFleetMap({
  tracks = [],
  dateLabel = "",
  highlightUserId = null,
  className = "",
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const drawable = tracks.filter(isDrawableTrack);
  const activeCount = tracks.filter((t) => t.online).length;

  useEffect(() => {
    const items = tracks.filter(isDrawableTrack);
    if (!containerRef.current || !items.length) {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      return undefined;
    }

    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    const map = L.map(containerRef.current, {
      scrollWheelZoom: false,
      zoomControl: true,
    });
    const mapEl = map.getContainer();
    const onEnter = () => map.scrollWheelZoom.enable();
    const onLeave = () => map.scrollWheelZoom.disable();
    mapEl.addEventListener("mouseenter", onEnter);
    mapEl.addEventListener("mouseleave", onLeave);
    mapRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    const allLatLngs = [];

    items.forEach((track) => {
      const trackKey = track.userId || track.id;
      const isHighlighted =
        highlightUserId &&
        (trackKey === highlightUserId || track.id === highlightUserId);
      const dimOthers = Boolean(highlightUserId) && !isHighlighted;

      const routeLatlngs = (track.path || []).map(([lat, lng]) =>
        L.latLng(lat, lng)
      );
      const traveledRaw =
        track.traveledPath?.length >= 2 ? track.traveledPath : track.path;
      const traveledLatlngs = (traveledRaw || []).map(([lat, lng]) =>
        L.latLng(lat, lng)
      );
      allLatLngs.push(...routeLatlngs);

      const routeColor = track.color || "#0A9242";

      if (routeLatlngs.length >= 2) {
        L.polyline(routeLatlngs, {
          color: routeColor,
          weight: isHighlighted ? 4 : 3,
          opacity: dimOthers ? 0.12 : isHighlighted ? 0.35 : 0.28,
          lineJoin: "round",
          lineCap: "round",
        }).addTo(map);
      }

      if (traveledLatlngs.length >= 2) {
        L.polyline(traveledLatlngs, {
          color: routeColor,
          weight: isHighlighted ? 7 : 5,
          opacity: dimOthers ? 0.2 : track.online ? 1 : 0.88,
          lineJoin: "round",
          lineCap: "round",
        }).addTo(map);
      }

      const pos = track.currentPosition;
      if (pos?.lat != null && pos?.lng != null) {
        allLatLngs.push(L.latLng(pos.lat, pos.lng));
        const liveClass = track.online ? " jetox-fleet-dot--live" : "";
        const pulseIcon = L.divIcon({
          className: "jetox-fleet-marker-wrap",
          html: `<div class="jetox-fleet-dot${liveClass}" style="background:${escapeHtml(track.color)}"></div>`,
          iconSize: [18, 18],
          iconAnchor: [9, 9],
        });
        const m = L.marker([pos.lat, pos.lng], { icon: pulseIcon }).addTo(map);
        m.bindPopup(
          `<div class="text-xs min-w-[140px]"><strong>${escapeHtml(track.name)}</strong><br/><span class="text-gray-600">${escapeHtml(track.department || "")}</span><br/>${track.online ? '<span style="color:#0A9242;font-weight:600">● Online now</span>' : '<span style="color:#64748b">Offline</span>'}${track.totalPathKm != null && track.path?.length >= 2 ? `<br/>${escapeHtml(String(track.totalPathKm))} km on route` : ""}</div>`
        );
      }

      if (routeLatlngs.length === 1 && !pos) {
        const startIcon = L.divIcon({
          className: "jetox-fleet-marker-wrap",
          html: `<div class="jetox-fleet-dot" style="background:${escapeHtml(track.color)}"></div>`,
          iconSize: [18, 18],
          iconAnchor: [9, 9],
        });
        L.marker(routeLatlngs[0], { icon: startIcon }).addTo(map);
      }
    });

    if (allLatLngs.length === 1) {
      map.setView(allLatLngs[0], 13);
    } else if (allLatLngs.length > 1) {
      map.fitBounds(L.latLngBounds(allLatLngs), { padding: [52, 52], maxZoom: 14 });
    }

    return () => {
      mapEl.removeEventListener("mouseenter", onEnter);
      mapEl.removeEventListener("mouseleave", onLeave);
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [tracks, highlightUserId]);

  useLeafletInvalidateSize(mapRef, containerRef, [tracks, drawable.length]);

  const emptyMessage =
    tracks.length === 0
      ? "No GPS trails for this date. Routes appear after field users tap Day Start in the mobile app."
      : "No map points for this date. Online users appear when they have sent a recent GPS ping.";

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-2 px-0.5">
        <div>
          <div className="text-xs font-semibold text-slate-700 dark:text-slate-200">
            Live fleet map — all field users
          </div>
          {dateLabel ? (
            <div className="text-[10px] text-slate-500 dark:text-slate-400">
              Showing routes for {dateLabel} · roads aligned (OSRM)
            </div>
          ) : (
            <div className="text-[10px] text-slate-500 dark:text-slate-400">
              Bold line = distance covered · faint line = full day route
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-2 text-[10px] text-slate-500 dark:text-slate-400">
          <span>{tracks.length} user{tracks.length !== 1 ? "s" : ""}</span>
          <span>·</span>
          <span className="text-emerald-600 dark:text-emerald-400">
            {activeCount} online
          </span>
        </div>
      </div>
      {!drawable.length ? (
        <div className="flex h-52 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50/80 px-4 text-center text-sm text-slate-500 dark:border-slate-600 dark:bg-slate-900/40 dark:text-slate-400 sm:h-64">
          {emptyMessage}
        </div>
      ) : (
        <div className="h-56 min-h-[224px] overflow-hidden rounded-xl border border-slate-200/80 shadow-sm dark:border-slate-600/60 sm:h-72 lg:h-80">
          <div
            ref={containerRef}
            className="leaflet-root h-full min-h-[224px] w-full"
            style={{ minHeight: 224 }}
          />
        </div>
      )}
      {tracks.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tracks.map((t) => (
            <span
              key={t.id}
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/80 bg-white px-2 py-0.5 text-[10px] font-medium text-slate-700 dark:border-slate-600/60 dark:bg-slate-800/80 dark:text-slate-200"
            >
              <span
                className="h-2 w-2 rounded-full shrink-0"
                style={{ backgroundColor: t.color }}
              />
              {t.name}
              {t.online && (
                <span className="text-emerald-600 dark:text-emerald-400">●</span>
              )}
              {t.totalPathKm > 0 && (
                <span className="text-slate-400">· {t.totalPathKm} km</span>
              )}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
