"use client";

import Link from "next/link";
import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { scanDuplicatesAction } from "@/app/(app)/duplicates/actions";
import { useProfile } from "@/components/providers/profile-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { DuplicateGroup } from "@/lib/duplicates/detect";
import { canPerform } from "@/lib/auth/permissions";

const ENTITY_HREF: Record<DuplicateGroup["entity"], (id: string) => string> = {
  customer: (id) => `/customers/${id}`,
  party: (id) => `/parties/${id}`,
  driver: (id) => `/drivers/${id}`,
  vehicle: (id) => `/vehicles/${id}`,
  commodity: (id) => `/commodities?edit=${id}`,
  destination: (id) => `/destinations?edit=${id}`,
};

export function DuplicatesPageClient() {
  const { role } = useProfile();
  const [groups, setGroups] = useState<DuplicateGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const canMerge = canPerform(role, "merge_duplicates");

  async function handleScan() {
    setLoading(true);
    const result = await scanDuplicatesAction();
    setLoading(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    setGroups(result.data ?? []);
    toast.success(`Tìm thấy ${result.data?.length ?? 0} nhóm trùng lặp`);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Duplicate Center</h1>
          <p className="text-sm text-muted-foreground">
            Phát hiện trùng lặp — user xác nhận trước khi merge (V1: review + navigate)
          </p>
        </div>
        <Button onClick={handleScan} disabled={loading}>
          <RefreshCw className={loading ? "animate-spin" : ""} />
          Quét duplicates
        </Button>
      </div>

      {!canMerge ? (
        <p className="text-sm text-muted-foreground">
          Merge trực tiếp chỉ dành cho ADMIN. Bạn vẫn có thể xem và mở record để xử lý thủ công.
        </p>
      ) : null}

      {loading ? <Skeleton className="h-40 w-full" /> : null}

      {groups.map((group, index) => (
        <Card key={`${group.entity}-${group.matchKey}-${index}`}>
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base capitalize">{group.entity}</CardTitle>
              <Badge variant={group.matchType === "exact" ? "default" : "secondary"}>
                {group.matchType}
              </Badge>
            </div>
            <span className="text-sm text-muted-foreground">{group.matchKey}</span>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Record</TableHead>
                  <TableHead>Meta</TableHead>
                  <TableHead className="w-40">
                    <div className="flex flex-col gap-0.5">
                      <span>Mở</span>
                      <span className="text-xs font-normal text-muted-foreground">
                        Merge cần xác nhận (review + navigate)
                      </span>
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {group.records.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>{record.label}</TableCell>
                    <TableCell className="text-muted-foreground">{record.meta ?? "—"}</TableCell>
                    <TableCell>
                      <Link
                        href={ENTITY_HREF[group.entity](record.id)}
                        className="text-sm hover:underline"
                      >
                        Mở
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}

      {!loading && groups.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Chưa quét hoặc không có nhóm trùng lặp.
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
