import Link from "next/link";
import {
  Building2,
  Car,
  Package,
  TriangleAlert,
  Users,
  UsersRound,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getDashboardStats } from "@/lib/master-data/dashboard";
import { getRecentAuditLogs } from "@/lib/master-data/audit";
import { createClient } from "@/lib/supabase/server";

const statCards = [
  { key: "totalCustomers", label: "Customers", icon: Building2 },
  { key: "totalShippers", label: "Shippers", icon: UsersRound },
  { key: "totalConsignees", label: "Consignees", icon: UsersRound },
  { key: "totalCommodities", label: "Commodities", icon: Package },
  { key: "totalDrivers", label: "Drivers", icon: Users },
  { key: "totalVehicles", label: "Vehicles", icon: Car },
] as const;

export default async function DashboardPage() {
  const supabase = await createClient();
  const [stats, recentAudit] = await Promise.all([
    getDashboardStats(supabase).catch((error) => {
      console.error("[dashboard] stats failed:", error);
      return {
        totalCustomers: 0,
        totalShippers: 0,
        totalConsignees: 0,
        totalCommodities: 0,
        totalDrivers: 0,
        totalVehicles: 0,
        inactiveRecords: 0,
      };
    }),
    getRecentAuditLogs(supabase, 8).catch(() => []),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Tổng quan Master Data — Nam Nam Logistics
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {statCards.map(({ key, label, icon: Icon }) => (
          <Card key={key}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {label}
              </CardTitle>
              <Icon className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold">{stats[key]}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Inactive Records</CardTitle>
            <TriangleAlert className="size-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">{stats.inactiveRecords}</div>
            <p className="mt-1 text-sm text-muted-foreground">
              Customers, drivers, vehicles đang INACTIVE
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Recent Changes</CardTitle>
            <Link href="/audit-logs" className="text-sm text-primary hover:underline">
              Xem tất cả
            </Link>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Action</TableHead>
                  <TableHead>Table</TableHead>
                  <TableHead>Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentAudit.length ? (
                  recentAudit.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>
                        <Badge variant="outline">{row.action}</Badge>
                      </TableCell>
                      <TableCell>{row.table_name}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(row.created_at).toLocaleString("vi-VN")}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground">
                      Chưa có audit log
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Trạng thái hệ thống</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-sm">
              <span>Phase</span>
              <Badge>System</Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>Import / Export</span>
              <Badge variant="secondary">Ready</Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>Global Search</span>
              <Badge variant="secondary">Ready</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
