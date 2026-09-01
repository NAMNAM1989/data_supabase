"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  archiveDriverAction,
  assignVehicleAction,
  restoreDriverAction,
  setPreferredVehicleAction,
  unassignVehicleAction,
  updateDriverAction,
} from "@/app/(app)/drivers/actions";
import { useProfile } from "@/components/providers/profile-provider";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Textarea } from "@/components/ui/textarea";
import { useDriver, useDriverCustomers, useDriverVehicles } from "@/hooks/use-drivers";
import { useVehicles } from "@/hooks/use-vehicles";
import { canPerform, canWrite } from "@/lib/auth/permissions";

export function DriverDetailClient({ driverId }: { driverId: string }) {
  const { role } = useProfile();
  const { data: driver, isLoading, refetch } = useDriver(driverId);
  const vehicles = useDriverVehicles(driverId);
  const customers = useDriverCustomers(driverId);
  const allVehicles = useVehicles();
  const [saving, setSaving] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [vehicleId, setVehicleId] = useState("");

  if (isLoading) return <Skeleton className="h-64 w-full" />;
  if (!driver) return <p>Không tìm thấy driver.</p>;

  const record = driver;

  async function handleUpdate(formData: FormData) {
    setSaving(true);
    const result = await updateDriverAction(driverId, {
      full_name: formData.get("full_name"),
      code: formData.get("code"),
      phone: formData.get("phone"),
      document_number: formData.get("document_number"),
      license_number: formData.get("license_number"),
      license_class: formData.get("license_class"),
      license_expiry: formData.get("license_expiry"),
      notes: formData.get("notes"),
    });
    setSaving(false);
    if (result.error) toast.error(result.error);
    else {
      toast.success("Đã cập nhật");
      refetch();
    }
  }

  async function handleArchive() {
    const result =
      record.status === "ARCHIVED"
        ? await restoreDriverAction(driverId)
        : await archiveDriverAction(driverId);
    if (result.error) toast.error(result.error);
    else {
      toast.success(record.status === "ARCHIVED" ? "Đã restore" : "Đã archive");
      refetch();
    }
  }

  async function handleAssign() {
    if (!vehicleId) {
      toast.error("Chọn xe");
      return;
    }
    setSaving(true);
    const result = await assignVehicleAction({ driver_id: driverId, vehicle_id: vehicleId });
    setSaving(false);
    if (result.error) toast.error(result.error);
    else {
      toast.success("Đã gán xe");
      setAssignOpen(false);
      vehicles.refetch();
    }
  }

  async function handleUnassign(relationId: string, vehicleIdToUnassign: string) {
    const result = await unassignVehicleAction(relationId, driverId, vehicleIdToUnassign);
    if (result.error) toast.error(result.error);
    else {
      toast.success("Đã gỡ gán");
      vehicles.refetch();
    }
  }

  async function handleSetPreferred(relationId: string) {
    const result = await setPreferredVehicleAction(relationId, driverId);
    if (result.error) toast.error(result.error);
    else {
      toast.success("Đã đặt xe ưu tiên");
      vehicles.refetch();
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Link href="/drivers" className="inline-flex items-center gap-1 text-sm text-muted-foreground">
        <ArrowLeft className="size-4" />
        Drivers
      </Link>
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold">{record.full_name}</h1>
          <StatusBadge status={record.status} />
        </div>
        {canPerform(role, "archive") ? (
          <Button variant="outline" onClick={handleArchive}>
            {record.status === "ARCHIVED" ? "Restore" : "Archive"}
          </Button>
        ) : null}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Thông tin Driver</CardTitle>
        </CardHeader>
        <CardContent>
          {canWrite(role) ? (
            <form action={handleUpdate} className="grid gap-3 md:grid-cols-2">
              <div className="flex flex-col gap-2 md:col-span-2">
                <Label htmlFor="full_name">Họ tên</Label>
                <Input id="full_name" name="full_name" defaultValue={record.full_name} required />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="code">Code</Label>
                <Input id="code" name="code" defaultValue={record.code ?? ""} />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" name="phone" defaultValue={record.phone ?? ""} />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="document_number">CMND/CCCD</Label>
                <Input id="document_number" name="document_number" defaultValue={record.document_number ?? ""} />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="license_number">GPLX</Label>
                <Input id="license_number" name="license_number" defaultValue={record.license_number ?? ""} />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="license_class">Hạng GPLX</Label>
                <Input id="license_class" name="license_class" defaultValue={record.license_class ?? ""} />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="license_expiry">Hết hạn GPLX</Label>
                <Input id="license_expiry" name="license_expiry" type="date" defaultValue={record.license_expiry ?? ""} />
              </div>
              <div className="flex flex-col gap-2 md:col-span-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea id="notes" name="notes" defaultValue={record.notes ?? ""} rows={2} />
              </div>
              <div className="md:col-span-2">
                <Button type="submit" disabled={saving}>
                  {saving ? "Đang lưu..." : "Lưu"}
                </Button>
              </div>
            </form>
          ) : (
            <dl className="grid gap-2 md:grid-cols-2 text-sm">
              <div><dt className="text-muted-foreground">Phone</dt><dd>{record.phone ?? "—"}</dd></div>
              <div><dt className="text-muted-foreground">GPLX</dt><dd>{record.license_number ?? "—"}</dd></div>
            </dl>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Assigned Vehicles</CardTitle>
          {canWrite(role) ? (
            <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
              <DialogTrigger render={<Button size="sm" />}>
                <Plus />
                Gán xe
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Gán xe cho driver</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col gap-2">
                    <Label>Vehicle</Label>
                    <Select value={vehicleId} onValueChange={(v) => setVehicleId(v ?? "")}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Chọn xe" />
                      </SelectTrigger>
                      <SelectContent>
                        {(allVehicles.data ?? []).map((v) => (
                          <SelectItem key={v.id} value={v.id}>
                            {v.plate_display ?? v.plate_number}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleAssign} disabled={saving}>
                    {saving ? "Đang lưu..." : "Gán"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          ) : null}
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Plate</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Preferred</TableHead>
                {canWrite(role) ? <TableHead className="w-28" /> : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {vehicles.isLoading ? (
                <TableRow><TableCell colSpan={4}><Skeleton className="h-4 w-full" /></TableCell></TableRow>
              ) : vehicles.data?.length ? (
                vehicles.data.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <Link href={`/vehicles/${row.vehicle.id}`} className="hover:underline">
                        {row.vehicle.plate_display ?? row.vehicle.plate_number}
                      </Link>
                    </TableCell>
                    <TableCell>{row.vehicle.vehicle_type ?? "—"}</TableCell>
                    <TableCell>{row.is_preferred ? "Yes" : "—"}</TableCell>
                    {canWrite(role) ? (
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="icon-xs" variant="ghost" onClick={() => handleSetPreferred(row.id)}>
                            <Star />
                          </Button>
                          <Button size="icon-xs" variant="ghost" onClick={() => handleUnassign(row.id, row.vehicle.id)}>
                            <Trash2 />
                          </Button>
                        </div>
                      </TableCell>
                    ) : null}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    Chưa gán xe
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Preferred by Customers</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Default</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.isLoading ? (
                <TableRow><TableCell colSpan={2}><Skeleton className="h-4 w-full" /></TableCell></TableRow>
              ) : customers.data?.length ? (
                customers.data.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      {row.customer ? (
                        <Link href={`/customers/${row.customer.id}`} className="hover:underline">
                          {row.customer.code} — {row.customer.name}
                        </Link>
                      ) : "—"}
                    </TableCell>
                    <TableCell>{row.is_default ? "Yes" : "—"}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={2} className="text-center text-muted-foreground">
                    Chưa có customer nào ưu tiên
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
