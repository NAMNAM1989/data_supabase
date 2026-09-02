"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { toast } from "sonner";

import {
  exportCustomersCsvAction,
  exportDriversCsvAction,
  exportVehiclesCsvAction,
} from "@/app/(app)/export/actions";
import { useProfile } from "@/components/providers/profile-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { canPerform } from "@/lib/auth/permissions";

function downloadCsv(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

type ExportResult = {
  data?: { filename: string; content: string };
  error?: string;
};

export function ExportPageClient() {
  const { role } = useProfile();
  const canExport = canPerform(role, "export");
  const [loadingKey, setLoadingKey] = useState<string | null>(null);

  async function handleExport(key: string, action: () => Promise<ExportResult>) {
    setLoadingKey(key);
    try {
      const result = await action();
      if (result.error) {
        toast.error(result.error);
        return;
      }
      if (!result.data?.content) {
        toast.error("Không có dữ liệu để xuất");
        return;
      }
      downloadCsv(result.data.filename, result.data.content);
      toast.success(`Đã tải ${result.data.filename}`);
    } catch {
      toast.error("Xuất CSV thất bại");
    } finally {
      setLoadingKey(null);
    }
  }

  if (!canExport) {
    return <p className="text-muted-foreground">Bạn không có quyền export.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Export</h1>
        <p className="text-sm text-muted-foreground">Xuất CSV để backup hoặc re-import</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Customers</CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              disabled={loadingKey !== null}
              onClick={() => handleExport("customers", exportCustomersCsvAction)}
            >
              <Download />
              {loadingKey === "customers" ? "Đang tạo…" : "Export CSV"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Drivers</CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              disabled={loadingKey !== null}
              onClick={() => handleExport("drivers", exportDriversCsvAction)}
            >
              <Download />
              {loadingKey === "drivers" ? "Đang tạo…" : "Export CSV"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Vehicles</CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              disabled={loadingKey !== null}
              onClick={() => handleExport("vehicles", exportVehiclesCsvAction)}
            >
              <Download />
              {loadingKey === "vehicles" ? "Đang tạo…" : "Export CSV"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
