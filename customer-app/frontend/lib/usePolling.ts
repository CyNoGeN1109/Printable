// FILE: apps/web/lib/usePolling.ts
// Reusable polling hook — fetches a URL every `interval` ms.
// Stops automatically when `shouldStop(data)` returns true.
// On failure: retries at 3s (up to 3 times), then falls back to normal interval.

"use client";

import { useState, useEffect, useRef } from "react";

interface PollingResult<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
}

const RETRY_INTERVAL = 3000;
const MAX_RETRIES    = 3;

export function usePolling<T>(
  url: string,
  interval: number = 60000,
  shouldStop?: (data: T) => boolean
): PollingResult<T> {
  const [data, setData]       = useState<T | null>(null);
  const [error, setError]     = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const urlRef        = useRef(url);
  const intervalRef   = useRef(interval);
  const shouldStopRef = useRef(shouldStop);
  useEffect(() => { urlRef.current = url; },           [url]);
  useEffect(() => { intervalRef.current = interval; }, [interval]);
  useEffect(() => { shouldStopRef.current = shouldStop; }, [shouldStop]);

  const stoppedRef     = useRef(false);
  const timerRef       = useRef<ReturnType<typeof setTimeout> | null>(null);
  const failCountRef   = useRef(0);
  const fetchRef       = useRef<(() => Promise<void>) | null>(null);

  fetchRef.current = async () => {
    if (stoppedRef.current) return;

    try {
      const res = await fetch(urlRef.current);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: T = await res.json();
      setData(json);
      setError(null);
      setLoading(false);
      failCountRef.current = 0; // reset on success

      if (shouldStopRef.current?.(json)) {
        stoppedRef.current = true;
        return;
      }
    } catch (err: unknown) {
      failCountRef.current++;
      setError(err instanceof Error ? err.message : "Fetch failed");
      setLoading(false);
    }

    if (!stoppedRef.current) {
      // Use fast retry interval for the first few failures, then normal interval
      const next = failCountRef.current > 0 && failCountRef.current <= MAX_RETRIES
        ? RETRY_INTERVAL
        : intervalRef.current;
      timerRef.current = setTimeout(() => fetchRef.current?.(), next);
    }
  };

  useEffect(() => {
    stoppedRef.current   = false;
    failCountRef.current = 0;
    fetchRef.current?.();
    return () => {
      stoppedRef.current = true;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return { data, error, loading };
}
