"use client";

import { useCallback, useMemo, useState } from "react";

export function useRowSelection(rowIds: string[]) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const idKey = rowIds.join("|");
  // Drop selections that are no longer on the page (after delete/refetch)
  const visibleSelected = useMemo(() => {
    const visible = new Set(rowIds);
    const next = new Set<string>();
    for (const id of selected) {
      if (visible.has(id)) next.add(id);
    }
    return next;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sync when row set identity changes
  }, [idKey, selected]);

  const selectedIds = useMemo(() => Array.from(visibleSelected), [visibleSelected]);
  const selectedCount = selectedIds.length;
  const allSelected = rowIds.length > 0 && selectedCount === rowIds.length;
  const someSelected = selectedCount > 0 && !allSelected;

  const toggle = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    setSelected((prev) => {
      const allVisibleSelected = rowIds.length > 0 && rowIds.every((id) => prev.has(id));
      if (allVisibleSelected) {
        const next = new Set(prev);
        for (const id of rowIds) next.delete(id);
        return next;
      }
      const next = new Set(prev);
      for (const id of rowIds) next.add(id);
      return next;
    });
  }, [rowIds]);

  const clear = useCallback(() => setSelected(new Set()), []);

  const isSelected = useCallback((id: string) => visibleSelected.has(id), [visibleSelected]);

  return {
    selectedIds,
    selectedCount,
    allSelected,
    someSelected,
    isSelected,
    toggle,
    toggleAll,
    clear,
  };
}
