import { useCallback, useRef, useState } from "react";

/**
 * Prevents duplicate form submits (e.g. double-click) before React re-renders disabled state.
 */
export function useSubmitLock() {
  const lockedRef = useRef(false);
  const [saving, setSaving] = useState(false);

  const runLocked = useCallback(async (fn: () => Promise<void>) => {
    if (lockedRef.current) return;
    lockedRef.current = true;
    setSaving(true);
    try {
      await fn();
    } finally {
      lockedRef.current = false;
      setSaving(false);
    }
  }, []);

  return { saving, runLocked };
}
