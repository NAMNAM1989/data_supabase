"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";

type TableLoadingRowsProps = {
  colSpan: number;
  rows?: number;
  message?: string;
};

/** Skeleton rõ ràng — không render hàng dữ liệu trống. */
export function TableLoadingRows({
  colSpan,
  rows = 5,
  message = "Đang tải dữ liệu…",
}: TableLoadingRowsProps) {
  return (
    <>
      <TableRow>
        <TableCell colSpan={colSpan} className="text-sm text-muted-foreground">
          {message}
        </TableCell>
      </TableRow>
      {Array.from({ length: rows }).map((_, index) => (
        <TableRow key={index} aria-hidden>
          <TableCell colSpan={colSpan}>
            <Skeleton className="h-4 w-full" />
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}

type TableEmptyRowProps = {
  colSpan: number;
  message: string;
};

export function TableEmptyRow({ colSpan, message }: TableEmptyRowProps) {
  return (
    <TableRow>
      <TableCell colSpan={colSpan} className="text-center text-muted-foreground">
        {message}
      </TableCell>
    </TableRow>
  );
}

type TableErrorRowProps = {
  colSpan: number;
  message?: string;
  onRetry?: () => void;
};

export function TableErrorRow({
  colSpan,
  message = "Không tải được dữ liệu",
  onRetry,
}: TableErrorRowProps) {
  return (
    <TableRow>
      <TableCell colSpan={colSpan}>
        <div className="flex flex-col items-center gap-2 py-4 text-center">
          <p className="text-sm text-destructive">{message}</p>
          {onRetry ? (
            <Button type="button" size="sm" variant="outline" onClick={onRetry}>
              Thử lại
            </Button>
          ) : null}
        </div>
      </TableCell>
    </TableRow>
  );
}
