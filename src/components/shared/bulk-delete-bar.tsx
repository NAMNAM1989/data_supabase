"use client";

import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type BulkDeleteBarProps = {
  selectedCount: number;
  onClear: () => void;
  onDelete: () => void;
  entityLabel: string;
  className?: string;
};

export function BulkDeleteBar({
  selectedCount,
  onClear,
  onDelete,
  entityLabel,
  className,
}: BulkDeleteBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3",
        className,
      )}
    >
      <p className="text-sm">
        Đã chọn <span className="font-semibold">{selectedCount}</span> {entityLabel}
      </p>
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onClear}>
          Bỏ chọn
        </Button>
        <Button type="button" variant="destructive" size="sm" onClick={onDelete}>
          <Trash2 />
          Xóa {selectedCount} mục
        </Button>
      </div>
    </div>
  );
}

type RowCheckboxProps = {
  checked: boolean;
  indeterminate?: boolean;
  onChange: () => void;
  label: string;
};

export function RowCheckbox({ checked, indeterminate, onChange, label }: RowCheckboxProps) {
  return (
    <input
      type="checkbox"
      className="size-4 cursor-pointer rounded border-input accent-primary"
      checked={checked}
      ref={(el) => {
        if (el) el.indeterminate = Boolean(indeterminate) && !checked;
      }}
      onChange={onChange}
      onClick={(e) => e.stopPropagation()}
      aria-label={label}
    />
  );
}
