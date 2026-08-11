import { useCallback, useEffect, useRef, useState } from "react";
import { fetchWorkItems, type WorkItem } from "../lib/work-items";

type Options = {
  enabled?: boolean;
  onError?: (err: unknown) => void;
};

/**
 * Loads unified work items once per enablement.
 * Uses a generation counter so Strict Mode remounts don't apply stale results twice.
 */
export function useWorkItems(options: Options = {}) {
  const { enabled = true, onError } = options;
  const [items, setItems] = useState<WorkItem[]>([]);
  const [loading, setLoading] = useState(false);
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;
  const genRef = useRef(0);

  const refresh = useCallback(async () => {
    if (!enabled) {
      setItems([]);
      return;
    }
    const gen = ++genRef.current;
    setLoading(true);
    try {
      const next = await fetchWorkItems();
      if (gen === genRef.current) setItems(next);
    } catch (err) {
      if (gen === genRef.current) onErrorRef.current?.(err);
    } finally {
      if (gen === genRef.current) setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { items, loading, refresh };
}
