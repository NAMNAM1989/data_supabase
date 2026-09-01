"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-2xl font-semibold">Đã xảy ra lỗi</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        Ứng dụng gặp sự cố không mong muốn. Vui lòng thử lại.
      </p>
      <Button onClick={reset}>Thử lại</Button>
    </div>
  );
}
