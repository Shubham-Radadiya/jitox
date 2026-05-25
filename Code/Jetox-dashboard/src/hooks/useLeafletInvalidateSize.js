import { useEffect } from "react";

/** Leaflet often renders grey tiles when the container was zero-sized on mount. */
export function useLeafletInvalidateSize(mapRef, containerRef, deps = []) {
  useEffect(() => {
    const el = containerRef?.current;
    const map = mapRef?.current;
    if (!el || !map) return undefined;

    const invalidate = () => {
      try {
        map.invalidateSize({ animate: false });
      } catch (_) {
        /* map may be removed */
      }
    };

    invalidate();
    const raf = requestAnimationFrame(invalidate);
    const t1 = setTimeout(invalidate, 150);
    const t2 = setTimeout(invalidate, 500);

    let ro;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(invalidate);
      ro.observe(el);
    }

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t1);
      clearTimeout(t2);
      ro?.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
