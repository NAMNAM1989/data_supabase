"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { assignVehicleAction, setPreferredVehicleAction, unassignVehicleAction } from "@/app/(app)/drivers/actions";
import { useProfile } from "@/components/providers/profile-provider";
import { EditRowLink, WriteAccessHint } from "@/components/shared/edit-row-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { useDrivers } from "@/hooks/use-drivers";
import { useDriverVehicleAssignments, useVehicles } from "@/hooks/use-vehicles";
import { useSubmitLock } from "@/hooks/use-submit-lock";
import { canWrite } from "@/lib/auth/permissions";

export function DriverVehiclesPageClient() {
  const { role } = useProfile();
  const assignments = useDriverVehicleAssignments();
  const drivers = useDrivers();
  const vehicles = useVehicles();
  const [open, setOpen] = useState(false);
  const { saving, runLocked } = useSubmitLock();
  const [driverId, setDriverId] = useState("");
  const [vehicleId, setVehicleId] = useState("");

  async function handleAssign() {
    if (!driverId || !vehicleId) {
      toast.error("Chọn driver và vehicle");
      return;
    }
    await runLocked(async () => {
      const result = await assignVehicleAction({ driver_id: driverId, vehicle_id: vehicleId });
      if (result.error) toast.error(result.error);
      else {
        toast.success("Đã tạo assignment");
        setOpen(false);
        assignments.refetch();
      }
    });
  }

  async function handleUnassign(
    relationId: string,
    driverIdToUnassign: string,
    vehicleIdToUnassign: string,
  ) {
    const result = await unassignVehicleAction(relationId, driverIdToUnassign, vehicleIdToUnassign);
    if (result.error) toast.error(result.error);
    else {
      toast.success("Đã gỡ assignment");
      assignments.refetch();
    }
  }

  async function handleSetPreferred(relationId: string, driverIdForPreferred: string) {
    const result = await setPreferredVehicleAction(relationId, driverIdForPreferred);
    if (result.error) toast.error(result.error);
    else {
      toast.success("Đã đặt ưu tiên");
      assignments.refetch();
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Driver ↔ Vehicle</h1>
          <p className="text-sm text-muted-foreground">Quan hệ N:N tài xế và xe</p>
        </div>
        {canWrite(role) ? (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger render={<Button />}>
              <Plus />
              New Assignment
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Gán Driver ↔ Vehicle</DialogTitle>
              </DialogHeader>
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-2">
                  <Label>Driver</Label>
                  <Select value={driverId} onValueChange={(v) => setDriverId(v ?? "")}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Chọn driver" />
                    </SelectTrigger>
                    <SelectContent>
                      {(drivers.data ?? []).map((d) => (
                        <SelectItem key={d.id} value={d.id}>
                          {d.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Vehicle</Label>
                  <Select value={vehicleId} onValueChange={(v) => setVehicleId(v ?? "")}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Chọn vehicle" />
                    </SelectTrigger>
                    <SelectContent>
                      {(vehicles.data ?? []).map((v) => (
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
      </div>

      <WriteAccessHint canEdit={canWrite(role)} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Assignments</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Driver</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>Preferred</TableHead>
                {canWrite(role) ? <TableHead className="w-48">Thao tác</TableHead> : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {assignments.isLoading ? (
                <TableRow>
                  <TableCell colSpan={4}>
                    <Skeleton className="h-4 w-full" />
                  </TableCell>
                </TableRow>
              ) : assignments.data?.length ? (
                assignments.data.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      {row.driver ? (
                        <Link href={`/drivers/${row.driver.id}`} className="hover:underline">
                          {row.driver.full_name}
                        </Link>
                      ) : "—"}
                    </TableCell>
                    <TableCell>
                      {row.vehicle ? (
                        <Link href={`/vehicles/${row.vehicle.id}`} className="hover:underline">
                          {row.vehicle.plate_display ?? row.vehicle.plate_number}
                        </Link>
                      ) : "—"}
                    </TableCell>
                    <TableCell>{row.is_preferred ? "Yes" : "—"}</TableCell>
                    {canWrite(role) ? (
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {row.driver ? (
                            <EditRowLink
                              href={`/drivers/${row.driver.id}`}
                              label={row.driver.full_name}
                            />
                          ) : null}
                          {row.vehicle ? (
                            <EditRowLink
                              href={`/vehicles/${row.vehicle.id}`}
                              label={row.vehicle.plate_display ?? row.vehicle.plate_number}
                            />
                          ) : null}
                          <Button
                            size="icon-xs"
                            variant="ghost"
                            onClick={() => handleSetPreferred(row.id, row.driver_id)}
                            aria-label="Đặt xe ưu tiên"
                          >
                            <Star />
                          </Button>
                          <Button
                            size="icon-xs"
                            variant="ghost"
                            onClick={() => handleUnassign(row.id, row.driver_id, row.vehicle_id)}
                            aria-label="Gỡ assignment"
                          >
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
                    Chưa có assignment
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
