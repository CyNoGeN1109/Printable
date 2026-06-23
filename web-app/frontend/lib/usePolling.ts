// FILE: apps/web/lib/usePolling.ts
// Reusable polling hook — fetches a URL every `interval` ms.
// Stops automatically when `shouldStop(data)` returns true.
//
// FIX: url, interval, and shouldStop are stored in refs so that inline
// callback references (e.g. arrow functions in JSX) don't cause fetchData
// to be recreated on every render, which previously triggered an infinite
// re-fetch loop ignoring the interval entirely.

"use client";

import { useState, useEffect, useRef } from "react";

interface PollingResult<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
}

export function usePolling<T>(
  url: string,
  interval: number = 60000,
  shouldStop?: (data: T) => boolean
): PollingResult<T> {
  const [data, setData]       = useState<T | null>(null);
  const [error, setError]     = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Keep latest values in refs — fetchData reads from refs so it never
  // needs to be recreated when props change.
  const urlRef        = useRef(url);
  const intervalRef   = useRef(interval);
  const shouldStopRef = useRef(shouldStop);
  useEffect(() => { urlRef.current = url; },          [url]);
  useEffect(() => { intervalRef.current = interval; }, [interval]);
  useEffect(() => { shouldStopRef.current = shouldStop; }, [shouldStop]);

  const stoppedRef  = useRef(false);
  const timerRef    = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Stable ref to the fetch function — created once, never changes.
  const fetchRef    = useRef<(() => Promise<void>) | null>(null);

  fetchRef.current = async () => {
    if (stoppedRef.current) return;

    try {
      const res = await fetch(urlRef.current);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: T = await res.json();
      setData(json);
      setError(null);
      setLoading(false);

      if (shouldStopRef.current?.(json)) {
        stoppedRef.current = true;
        return; // Stop polling — order complete / cancelled
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Fetch failed");
      setLoading(false);
    }

    if (!stoppedRef.current) {
      timerRef.current = setTimeout(() => fetchRef.current?.(), intervalRef.current);
    }
  };

  // Run once on mount, clean up on unmount. No dependencies that can change.
  useEffect(() => {
    stoppedRef.current = false;
    fetchRef.current?.();          // immediate first fetch
    return () => {
      stoppedRef.current = true;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []); // ← intentionally empty — stable mount/unmount only

  return { data, error, loading };
}