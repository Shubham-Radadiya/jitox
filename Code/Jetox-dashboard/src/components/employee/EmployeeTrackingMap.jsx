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

function midpoint(a, b) {
  return [(a.lat + b.lat) / 2, (a.lng + b.lng) / 2];
}

/**
 * @param {{
 *   path: [number, number][],
 *   traveledPath?: [number, number][],
 *   followsRoads?: boolean,
 *   totalPathKm?: number,
 *   commuteChordKm?: number,
 *   commuteMid?: { lat: number; lng: number },
 *   stops?: { lat: number, lng: number, time?: string, partyName?: string, address?: string, distanceFromPrevKm?: number | null }[]
 * }} mapTrack
 */
export function EmployeeTrackingMap({ mapTrack, className = "" }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);

  useEffect(() => {
    const path =
      mapTrack?.path?.length >= 2
        ? mapTrack.path
        : mapTrack?.traveledPath?.length >= 2
          ? mapTrack.traveledPath
          : mapTrack?.path?.length
            ? mapTrack.path
            : mapTrack?.traveledPath;
    const stops = mapTrack?.stops;
    if (!containerRef.current || !path?.length) {
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
    mapRef.current = map;
    const mapEl = map.getContainer();
    const onEnter = () => map.scrollWheelZoom.enable();
    const onLeave = () => map.scrollWheelZoom.disable();
    mapEl.addEventListener("mouseenter", onEnter);
    mapEl.addEventListener("mouseleave", onLeave);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    const fullRoute =
      mapTrack?.path?.length >= 2 ? mapTrack.path : path;
    const traveledRaw =
      mapTrack?.traveledPath?.length >= 2 ? mapTrack.traveledPath : path;
    const fullLatlngs = fullRoute.map(([lat, lng]) => L.latLng(lat, lng));
    const traveledLatlngs = traveledRaw.map(([lat, lng]) => L.latLng(lat, lng));

    if (fullLatlngs.length >= 2) {
      L.polyline(fullLatlngs, {
        color: "#86efac",
        weight: 3,
        opacity: 0.45,
        lineJoin: "round",
        lineCap: "round",
      }).addTo(map);
    }

    if (traveledLatlngs.length >= 2) {
      L.polyline(traveledLatlngs, {
        color: "#16a34a",
        weight: 6,
        opacity: 0.95,
        lineJoin: "round",
        lineCap: "round",
      }).addTo(map);
    }

    (stops || []).forEach((s, i) => {
      const numIcon = L.divIcon({
        className: "jetox-track-marker-wrap",
        html: `<div class="jetox-track-marker">${i + 1}</div>`,
        iconSize: [26, 26],
        iconAnchor: [13, 13],
      });
      const m = L.marker([s.lat, s.lng], { icon: numIcon }).addTo(map);
      const leg =
        s.distanceFromPrevKm != null
          ? `<br/><span class="text-gray-700">From previous stop: <strong>${escapeHtml(
              String(s.distanceFromPrevKm)
            )} km</strong></span>`
          : "";
      m.bindPopup(
        `<div class="text-xs min-w-[140px]"><strong>${escapeHtml(
          s.partyName || "Stop"
        )}</strong><br/><span class="text-gray-600">${escapeHtml(
          s.time || ""
        )}</span><br/>${escapeHtml(s.address || "")}${leg}</div>`
      );
    });

    for (let i = 1; i < (stops || []).length; i++) {
      const prev = stops[i - 1];
      const cur = stops[i];
      const km = cur.distanceFromPrevKm;
      if (km == null) continue;
      const [midLat, midLng] = midpoint(prev, cur);
      const labelIcon = L.divIcon({
        className: "jetox-track-dist-wrap",
        html: `<div class="jetox-track-dist">${escapeHtml(String(km))} km</div>`,
        iconSize: [52, 22],
        iconAnchor: [26, 11],
      });
      L.marker([midLat, midLng], { icon: labelIcon, zIndexOffset: -100 }).addTo(
        map
      );
    }

    const chord = mapTrack?.commuteChordKm;
    const chordMid = mapTrack?.commuteMid;
    if (
      chord != null &&
      chordMid &&
      (stops || []).length === 1
    ) {
      const chordIcon = L.divIcon({
        className: "jetox-track-dist-wrap",
        html: `<div class="jetox-track-dist jetox-track-dist--chord">${escapeHtml(
          String(chord)
        )} km</div>`,
        iconSize: [56, 24],
        iconAnchor: [28, 12],
      });
      L.marker([chordMid.lat, chordMid.lng], {
        icon: chordIcon,
        zIndexOffset: -120,
      }).addTo(map);
    }

    const boundsPoints =
      fullLatlngs.length >= 2
        ? fullLatlngs
        : traveledLatlngs.length >= 2
          ? traveledLatlngs
          : fullLatlngs;
    if (boundsPoints.length === 1) {
      map.setView(boundsPoints[0], 14);
    } else if (boundsPoints.length > 1) {
      map.fitBounds(L.latLngBounds(boundsPoints), {
        padding: [40, 40],
        maxZoom: 15,
      });
    }

    return () => {
      mapEl.removeEventListener("mouseenter", onEnter);
      mapEl.removeEventListener("mouseleave", onLeave);
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [mapTrack]);

  useLeafletInvalidateSize(mapRef, containerRef, [mapTrack]);

  const hasPath =
    (mapTrack?.path?.length ?? 0) > 0 ||
    (mapTrack?.traveledPath?.length ?? 0) > 0;
  if (!hasPath) return null;

  const total = mapTrack.totalPathKm;

  return (
    <div className={`space-y-1 ${className}`}>
      <div className="h-56 min-h-[220px] overflow-hidden rounded-lg border border-slate-200/80 shadow-sm dark:border-slate-600/60 sm:h-72 lg:h-80">
        <div
          ref={containerRef}
          className="leaflet-root h-full min-h-[192px] w-full"
          style={{ minHeight: 192 }}
        />
      </div>
      {total != null && total > 0 && (
        <div className="text-[11px] text-light flex flex-wrap gap-x-3 gap-y-0.5">
          <span>
            <span className="text-dark/80 font-medium">Route on roads:</span>{" "}
            {total} km
          </span>
          {mapTrack?.followsRoads !== false && (
            <span className="text-emerald-600 dark:text-emerald-400">
              Route aligned to roads (OSRM)
            </span>
          )}
          <span className="text-light/90">
            Stop labels use straight-line distance between visits.
          </span>
        </div>
      )}
    </div>
  );
}
