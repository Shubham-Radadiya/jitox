import { useEffect, useRef } from "react";
import L from "leaflet";
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
 *   totalPathKm?: number,
 *   commuteChordKm?: number,
 *   commuteMid?: { lat: number; lng: number },
 *   stops?: { lat: number, lng: number, time?: string, partyName?: string, address?: string, distanceFromPrevKm?: number | null }[]
 * }} mapTrack
 */
export function EmployeeTrackingMap({ mapTrack, className = "" }) {
  const containerRef = useRef(null);

  useEffect(() => {
    const path = mapTrack?.path;
    const stops = mapTrack?.stops;
    if (!containerRef.current || !path?.length) return undefined;

    const el = containerRef.current;
    const map = L.map(el, { scrollWheelZoom: true });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    const latlngs = path.map(([lat, lng]) => L.latLng(lat, lng));

    if (latlngs.length >= 2) {
      L.polyline(latlngs, {
        color: "#22c55e",
        weight: 4,
        opacity: 0.92,
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

    if (latlngs.length === 1) {
      map.setView(latlngs[0], 14);
    } else {
      map.fitBounds(L.latLngBounds(latlngs), { padding: [40, 40], maxZoom: 15 });
    }

    const raf = requestAnimationFrame(() => map.invalidateSize());
    const t = setTimeout(() => map.invalidateSize(), 300);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t);
      map.remove();
    };
  }, [mapTrack]);

  if (!mapTrack?.path?.length) return null;

  const total = mapTrack.totalPathKm;

  return (
    <div className={`space-y-1 ${className}`}>
      <div className="h-44 overflow-hidden rounded-md border border-light-border sm:h-60">
        <div ref={containerRef} className="h-full w-full leaflet-root" />
      </div>
      {total != null && total > 0 && (
        <div className="text-[11px] text-light flex flex-wrap gap-x-3 gap-y-0.5">
          <span>
            <span className="text-dark/80 font-medium">Full route (path):</span>{" "}
            {total} km
          </span>
          <span className="text-light/90">
            Labels show straight-line distance between consecutive visit stops.
          </span>
        </div>
      )}
    </div>
  );
}
