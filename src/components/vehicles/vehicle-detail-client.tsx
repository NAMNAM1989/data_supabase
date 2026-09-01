"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { assignDriverAction, archiveVehicleAction, restoreVehicleAction, updateVehicleAction } from "@/app/(app)/vehicles/actions";
import { unassignVehicleAction, setPreferredVehicleAction } from "@/app/(app)/drivers/actions";
import { useProfile } from "@/components/providers/profile-provider";
import { DetailEditHint } from "@/components/shared/edit-row-actions";
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
import { useDrivers } from "@/hooks/use-drivers";
import { useVehicle, useVehicleCustomers, useVehicleDrivers } from "@/hooks/use-vehicles";
import { canPerform, canWrite } from "@/lib/auth/permissions";

export function VehicleDetailClient({ vehicleId }: { vehicleId: string }) {
  const { role } = useProfile();
  const { data: vehicle, isLoading, refetch } = useVehicle(vehicleId);
  const drivers = useVehicleDrivers(vehicleId);
  const customers = useVehicleCustomers(vehicleId);
  const allDrivers = useDrivers();
  const [saving, setSaving] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [driverId, setDriverId] = useState("");

  if (isLoading) return <Skeleton className="h-64 w-full" />;
  if (!vehicle) return <p>Không tìm thấy vehicle.</p>;

  const record = vehicle;

  async function handleUpdate(formData: FormData) {
    setSaving(true);
    const result = await updateVehicleAction(vehicleId, {
      plate_number: formData.get("plate_number"),
      plate_display: formData.get("plate_display"),
      vehicle_type: formData.get("vehicle_type"),
      brand: formData.get("brand"),
      model: formData.get("model"),
      payload_kg: formData.get("payload_kg"),
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
        ? await restoreVehicleAction(vehicleId)
        : await archiveVehicleAction(vehicleId);
    if (result.error) toast.error(result.error);
    else {
      toast.success(record.status === "ARCHIVED" ? "Đã restore" : "Đã archive");
      refetch();
    }
  }

  async function handleAssign() {
    if (!driverId) {
      toast.error("Chọn tài xế");
      return;
    }
    setSaving(true);
    const result = await assignDriverAction({ driver_id: driverId, vehicle_id: vehicleId });
    setSaving(false);
    if (result.error) toast.error(result.error);
    else {
      toast.success("Đã gán tài xế");
      setAssignOpen(false);
      drivers.refetch();
    }
  }

  async function handleUnassign(relationId: string, driverIdToUnassign: string) {
    const result = await unassignVehicleAction(relationId, driverIdToUnassign, vehicleId);
    if (result.error) toast.error(result.error);
    else {
      toast.success("Đã gỡ gán");
      drivers.refetch();
    }
  }

  async function handleSetPreferred(relationId: string, driverIdForPreferred: string) {
    const result = await setPreferredVehicleAction(relationId, driverIdForPreferred);
    if (result.error) toast.error(result.error);
    else {
      toast.success("Đã đặt ưu tiên");
      drivers.refetch();
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Link href="/vehicles" className="inline-flex items-center gap-1 text-sm text-muted-foreground">
        <ArrowLeft className="size-4" />
        Vehicles
      </Link>
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold">
            {record.plate_display ?? record.plate_number}
          </h1>
          <StatusBadge status={record.status} />
        </div>
        {canPerform(role, "archive") ? (
          <Button variant="outline" onClick={handleArchive}>
            {record.status === "ARCHIVED" ? "Restore" : "Archive"}
          </Button>
        ) : null}
      </div>

      <DetailEditHint canEdit={canWrite(role)} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Thông tin Vehicle</CardTitle>
        </CardHeader>
        <CardContent>
          {canWrite(role) ? (
            <form action={handleUpdate} className="grid gap-3 md:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="plate_number">Biển số (canonical)</Label>
                <Input id="plate_number" name="plate_number" defaultValue={record.plate_number} required />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="plate_display">Hiển thị</Label>
                <Input id="plate_display" name="plate_display" defaultValue={record.plate_display ?? ""} />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="vehicle_type">Loại xe</Label>
                <Input id="vehicle_type" name="vehicle_type" defaultValue={record.vehicle_type ?? ""} />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="payload_kg">Tải trọng (kg)</Label>
                <Input id="payload_kg" name="payload_kg" type="number" defaultValue={record.payload_kg ?? ""} />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="brand">Hãng</Label>
                <Input id="brand" name="brand" defaultValue={record.brand ?? ""} />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="model">Model</Label>
                <Input id="model" name="model" defaultValue={record.model ?? ""} />
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
              <div><dt className="text-muted-foreground">Type</dt><dd>{record.vehicle_type ?? "—"}</dd></div>
              <div><dt className="text-muted-foreground">Brand</dt><dd>{record.brand ?? "—"}</dd></div>
            </dl>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Assigned Drivers</CardTitle>
          {canWrite(role) ? (
            <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
              <DialogTrigger render={<Button size="sm" />}>
                <Plus />
                Gán tài xế
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Gán tài xế cho xe</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col gap-2">
                    <Label>Driver</Label>
                    <Select value={driverId} onValueChange={(v) => setDriverId(v ?? "")}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Chọn tài xế" />
                      </SelectTrigger>
                      <SelectContent>
                        {(allDrivers.data ?? []).map((d) => (
                          <SelectItem key={d.id} value={d.id}>
                            {d.full_name}
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
                <TableHead>Driver</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Preferred</TableHead>
                {canWrite(role) ? <TableHead className="w-28" /> : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {drivers.isLoading ? (
                <TableRow><TableCell colSpan={4}><Skeleton className="h-4 w-full" /></TableCell></TableRow>
              ) : drivers.data?.length ? (
                drivers.data.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <Link href={`/drivers/${row.driver.id}`} className="hover:underline">
                        {row.driver.full_name}
                      </Link>
                    </TableCell>
                    <TableCell>{row.driver.phone ?? "—"}</TableCell>
                    <TableCell>{row.is_preferred ? "Yes" : "—"}</TableCell>
                    {canWrite(role) ? (
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="icon-xs" variant="ghost" onClick={() => handleSetPreferred(row.id, row.driver.id)}>
                            <Star />
                          </Button>
                          <Button size="icon-xs" variant="ghost" onClick={() => handleUnassign(row.id, row.driver.id)}>
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
                    Chưa gán tài xế
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
