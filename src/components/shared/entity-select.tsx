"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type EntitySelectOption = {
  value: string;
  label: string;
};

type EntitySelectProps = {
  value: string;
  onValueChange: (value: string) => void;
  options: EntitySelectOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
};

/**
 * Base UI Select hiển thị raw value trừ khi có `items`.
 * Component này luôn map value → label để tránh hiện UUID.
 */
export function EntitySelect({
  value,
  onValueChange,
  options,
  placeholder = "Chọn...",
  disabled,
  className,
}: EntitySelectProps) {
  const items = [
    { value: null as string | null, label: placeholder },
    ...options.map((o) => ({ value: o.value, label: o.label })),
  ];

  return (
    <Select
      value={value || null}
      onValueChange={(v) => onValueChange((v as string | null) ?? "")}
      items={items}
      disabled={disabled}
    >
      <SelectTrigger className={className ?? "w-full"}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
