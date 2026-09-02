"use client";

import Link from "next/link";
import { Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type EditRowLinkProps = {
  href: string;
  label: string;
};

/** Nút Sửa — mở trang detail để chỉnh sửa. */
export function EditRowLink({ href, label }: EditRowLinkProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              size="xs"
              variant="outline"
              render={<Link href={href} />}
              aria-label={`Sửa ${label}`}
            />
          }
        >
          <Pencil />
          Sửa
        </TooltipTrigger>
        <TooltipContent>Sửa</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

type EditRowButtonProps = {
  label: string;
  onClick: () => void;
};

/** Nút Sửa — mở dialog chỉnh sửa inline trên list. */
export function EditRowButton({ label, onClick }: EditRowButtonProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              size="xs"
              variant="outline"
              onClick={onClick}
              aria-label={`Sửa ${label}`}
            />
          }
        >
          <Pencil />
          Sửa
        </TooltipTrigger>
        <TooltipContent>Sửa</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

type WriteAccessHintProps = {
  canEdit: boolean;
};

/** Hiển thị khi user VIEWER — giải thích vì sao không có nút Sửa. */
export function WriteAccessHint({ canEdit }: WriteAccessHintProps) {
  if (canEdit) return null;
  return (
    <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
      Tài khoản VIEWER chỉ được xem dữ liệu. Liên hệ ADMIN để được quyền nhập và sửa.
    </p>
  );
}

type DetailEditHintProps = {
  canEdit: boolean;
};

/** Gợi ý trên trang detail — form chính là màn hình sửa. */
export function DetailEditHint({ canEdit }: DetailEditHintProps) {
  if (!canEdit) {
    return <WriteAccessHint canEdit={false} />;
  }
  return (
    <p className="text-sm text-muted-foreground">
      Chỉnh sửa các trường bên dưới, sau đó bấm Lưu để cập nhật.
    </p>
  );
}
