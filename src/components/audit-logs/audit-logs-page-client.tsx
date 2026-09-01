"use client";

import { useState } from "react";

import { useProfile } from "@/components/providers/profile-provider";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuditLogs } from "@/hooks/use-audit-logs";
import { canPerform } from "@/lib/auth/permissions";

const ACTION_OPTIONS = ["INSERT", "UPDATE", "ARCHIVE", "IMPORT", "MERGE"] as const;

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString("vi-VN");
}

export function AuditLogsPageClient() {
  const { role } = useProfile();
  const canView = canPerform(role, "view_audit");
  const [search, setSearch] = useState("");
  const [action, setAction] = useState("all");
  const [tableName, setTableName] = useState("");

  const { data, isLoading } = useAuditLogs(
    {
      search: search || undefined,
      action: action === "all" ? undefined : action,
      tableName: tableName || undefined,
      limit: 100,
    },
    canView,
  );

  if (!canView) {
    return <p className="text-muted-foreground">Bạn không có quyền xem audit logs.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Audit Logs</h1>
        <p className="text-sm text-muted-foreground">Lịch sử thay đổi hệ thống (ADMIN only)</p>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <Input
          placeholder="Search action, table..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Select value={action} onValueChange={(v) => setAction(v ?? "all")}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Tất cả actions" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả actions</SelectItem>
            {ACTION_OPTIONS.map((item) => (
              <SelectItem key={item} value={item}>
                {item}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          placeholder="Table name (customers, profiles...)"
          value={tableName}
          onChange={(e) => setTableName(e.target.value)}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Thời gian</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Table</TableHead>
                <TableHead>Record</TableHead>
                <TableHead>App</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5}>
                    <Skeleton className="h-4 w-full" />
                  </TableCell>
                </TableRow>
              ) : data?.length ? (
                data.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="whitespace-nowrap text-sm">
                      {formatDate(row.created_at)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{row.action}</Badge>
                    </TableCell>
                    <TableCell>{row.table_name}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {row.record_id ? row.record_id.slice(0, 8) + "…" : "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{row.app_name}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    Chưa có audit log
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
