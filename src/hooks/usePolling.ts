"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface PollingResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function usePolling<T>(
  url: string,
  intervalMs: number = 5000,
): PollingResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const inFlight = useRef(false);

  const fetchData = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json);
      setError(null);
    } catch (e) {
      if (e instanceof Error && e.name !== "AbortError") {
        setError(e.message);
      }
    } finally {
      setLoading(false);
      inFlight.current = false;
    }
  }, [url]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, intervalMs);
    return () => clearInterval(interval);
  }, [fetchData, intervalMs]);

  return { data, loading, error, refetch: fetchData };
}
