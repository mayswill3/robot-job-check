"use client";
import { useCallback, useEffect, useRef, useState } from "react";

/** Width of a container element, updated on resize. Charts use it to stay fluid at 375px. */
export function useMeasure<T extends HTMLElement>(initial = 343) {
  const ref = useRef<T | null>(null);
  const [width, setWidth] = useState(initial);
  const measure = useCallback(() => {
    if (ref.current) setWidth(Math.max(200, Math.round(ref.current.getBoundingClientRect().width)));
  }, []);
  useEffect(() => {
    measure();
    if (!ref.current || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(measure);
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, [measure]);
  return { ref, width };
}
