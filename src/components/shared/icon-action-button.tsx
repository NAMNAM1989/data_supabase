"use client";

import type { ComponentProps, ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type IconActionButtonProps = {
  label: string;
  tooltip?: string;
  onClick?: () => void;
  disabled?: boolean;
  variant?: ComponentProps<typeof Button>["variant"];
  className?: string;
  children: ReactNode;
};

/** Nút icon có aria-label + tooltip — dùng cho Star/Trash/Edit icon-only. */
export function IconActionButton({
  label,
  tooltip,
  onClick,
  disabled,
  variant = "ghost",
  className,
  children,
}: IconActionButtonProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              type="button"
              size="icon-xs"
              variant={variant}
              aria-label={label}
              disabled={disabled}
              onClick={onClick}
              className={cn("min-h-8 min-w-8", className)}
            />
          }
        >
          {children}
        </TooltipTrigger>
        <TooltipContent>{tooltip ?? label}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
