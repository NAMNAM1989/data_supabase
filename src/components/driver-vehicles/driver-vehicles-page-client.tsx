"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  assignVehicleAction,
  setPreferredVehicleAction,
  unassignVehicleAction,
  updateDriverVehicleAction,
} from "@/app/(app)/drivers/actions";
import { useProfile } from "@/components/providers/profile-provider";
import { EditRowButton, WriteAccessHint } from "@/components/shared/edit-row-actions";
import { EntitySelect } from "@/components/shared/entity-select";
import { IconActionButton } from "@/components/shared/icon-action-button";
import { TableEmptyRow, TableErrorRow, TableLoadingRows } from "@/components/shared/table-states";
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

type AssignmentRow = NonNullable<
  ReturnType<typeof useDriverVehicleAssignments>["data"]
>[number];

export function DriverVehiclesPageClient() {
  const { role } = useProfile();
  const assignments = useDriverVehicleAssignments();
  const drivers = useDrivers();
  const vehicles = useVehicles();
  const [open, setOpen] = useState(false);
  const [editRow, setEditRow] = useState<AssignmentRow | null>(null);
  const { saving, runLocked } = useSubmitLock();
  const [driverId, setDriverId] = useState("");
  const [vehicleId, setVehicleId] = useState("");
  const [editDriverId, setEditDriverId] = useState("");
  const [editVehicleId, setEditVehicleId] = useState("");
  const [editPreferred, setEditPreferred] = useState(false);

  const colSpan = canWrite(role) ? 4 : 3;

  function openEdit(row: AssignmentRow) {
    setEditRow(row);
    setEditDriverId(row.driver_id);
    setEditVehicleId(row.vehicle_id);
    setEditPreferred(Boolean(row.is_preferred));
  }

  function assignmentLabel(row: AssignmentRow) {
    const driverName = row.driver?.full_name ?? "driver";
    const plate = row.vehicle?.plate_display ?? row.vehicle?.plate_number ?? "vehicle";
    return `${driverName} ↔ ${plate}`;
  }

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

  async function handleUpdate() {
    if (!editRow || !editDriverId || !editVehicleId) {
      toast.error("Chọn driver và vehicle");
      return;
    }
    await runLocked(async () => {
      const result = await updateDriverVehicleAction({
        relation_id: editRow.id,
        driver_id: editDriverId,
        vehicle_id: editVehicleId,
        is_preferred: editPreferred,
      });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Đã cập nhật assignment");
      setEditRow(null);
      assignments.refetch();
    });
  }

  async function handleUnassign(
    relationId: string,
    driverIdToUnassign: string,
    vehicleIdToUnassign: string,
    label: string,
  ) {
    if (!confirm(`Gỡ assignment "${label}"?`)) return;
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
                  <EntitySelect
                    value={driverId}
                    onValueChange={setDriverId}
                    placeholder="Chọn driver"
                    options={(drivers.data ?? []).map((d) => ({
                      value: d.id,
                      label: d.full_name,
                    }))}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Vehicle</Label>
                  <EntitySelect
                    value={vehicleId}
                    onValueChange={setVehicleId}
                    placeholder="Chọn vehicle"
                    options={(vehicles.data ?? []).map((v) => ({
                      value: v.id,
                      label: v.plate_display ?? v.plate_number,
                    }))}
                  />
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
                <TableLoadingRows colSpan={colSpan} />
              ) : assignments.isError ? (
                <TableErrorRow colSpan={colSpan} onRetry={() => assignments.refetch()} />
              ) : assignments.data?.length ? (
                assignments.data.map((row) => {
                  const label = assignmentLabel(row);
                  return (
                    <TableRow key={row.id}>
                      <TableCell>
                        {row.driver ? (
                          <Link href={`/drivers/${row.driver.id}`} className="hover:underline">
                            {row.driver.full_name}
                          </Link>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell>
                        {row.vehicle ? (
                          <Link href={`/vehicles/${row.vehicle.id}`} className="hover:underline">
                            {row.vehicle.plate_display ?? row.vehicle.plate_number}
                          </Link>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell>{row.is_preferred ? "Yes" : "—"}</TableCell>
                      {canWrite(role) ? (
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            <EditRowButton label={label} onClick={() => openEdit(row)} />
                            <IconActionButton
                              label={`Đặt ưu tiên ${label}`}
                              tooltip="Đặt xe ưu tiên"
                              onClick={() => handleSetPreferred(row.id, row.driver_id)}
                            >
                              <Star />
                            </IconActionButton>
                            <IconActionButton
                              label={`Gỡ assignment ${label}`}
                              tooltip="Gỡ assignment"
                              className="text-destructive hover:text-destructive"
                              onClick={() =>
                                handleUnassign(row.id, row.driver_id, row.vehicle_id, label)
                              }
                            >
                              <Trash2 />
                            </IconActionButton>
                          </div>
                        </TableCell>
                      ) : null}
                    </TableRow>
                  );
                })
              ) : (
                <TableEmptyRow colSpan={colSpan} message="Chưa có assignment" />
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog
        open={Boolean(editRow)}
        onOpenChange={(openState) => {
          if (!openState) setEditRow(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sửa assignment</DialogTitle>
          </DialogHeader>
          {editRow ? (
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-2">
                <Label>Driver</Label>
                <EntitySelect
                  value={editDriverId}
                  onValueChange={setEditDriverId}
                  placeholder="Chọn driver"
                  options={(drivers.data ?? []).map((d) => ({
                    value: d.id,
                    label: d.full_name,
                  }))}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Vehicle</Label>
                <EntitySelect
                  value={editVehicleId}
                  onValueChange={setEditVehicleId}
                  placeholder="Chọn vehicle"
                  options={(vehicles.data ?? []).map((v) => ({
                    value: v.id,
                    label: v.plate_display ?? v.plate_number,
                  }))}
                />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={editPreferred}
                  onChange={(e) => setEditPreferred(e.target.checked)}
                />
                Preferred
              </label>
              <div className="flex gap-2">
                <Button onClick={handleUpdate} disabled={saving}>
                  {saving ? "Đang lưu..." : "Lưu thay đổi"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={saving}
                  onClick={() => setEditRow(null)}
                >
                  Hủy
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
