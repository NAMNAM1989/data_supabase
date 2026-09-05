"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { createVehicleAction, deleteVehiclesAction } from "@/app/(app)/vehicles/actions";
import { useProfile } from "@/components/providers/profile-provider";
import { BulkDeleteBar, RowCheckbox } from "@/components/shared/bulk-delete-bar";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EditRowLink, WriteAccessHint } from "@/components/shared/edit-row-actions";
import { IconActionButton } from "@/components/shared/icon-action-button";
import { TableLoadingRows } from "@/components/shared/table-states";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useRowSelection } from "@/hooks/use-row-selection";
import { useSubmitLock } from "@/hooks/use-submit-lock";
import { useVehicles } from "@/hooks/use-vehicles";
import { canPerform, canWrite } from "@/lib/auth/permissions";
import type { VehicleWithCounts } from "@/lib/master-data/vehicles";

export function VehiclesPageClient() {
  const { role } = useProfile();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<VehicleWithCounts | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const { saving, runLocked } = useSubmitLock();
  const { data, isLoading, refetch } = useVehicles({ search: search || undefined });
  const showActions = canWrite(role);
  const canDelete = canPerform(role, "delete");
  const rowIds = useMemo(() => (data ?? []).map((v) => v.id), [data]);
  const selection = useRowSelection(rowIds);
  const colSpan = (canDelete ? 1 : 0) + 6 + (showActions ? 1 : 0);

  async function executeDelete() {
    if (!deleteTarget) return;
    const result = await deleteVehiclesAction([deleteTarget.id]);
    if (result.error) toast.error(result.error);
    else {
      toast.success("Đã xóa vĩnh viễn vehicle");
      selection.clear();
      refetch();
    }
  }

  async function executeBulkDelete() {
    if (selection.selectedCount === 0) return;
    const result = await deleteVehiclesAction(selection.selectedIds);
    if (result.error) toast.error(result.error);
    else {
      toast.success(`Đã xóa vĩnh viễn ${result.data?.deleted ?? selection.selectedCount} vehicle`);
      selection.clear();
      refetch();
    }
  }

  async function handleCreate(formData: FormData) {
    await runLocked(async () => {
      const result = await createVehicleAction({
        plate_number: formData.get("plate_number"),
        plate_display: formData.get("plate_display"),
        vehicle_type: formData.get("vehicle_type"),
        brand: formData.get("brand"),
        model: formData.get("model"),
        status: "ACTIVE",
      });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Đã tạo vehicle");
      setOpen(false);
      refetch();
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Vehicles</h1>
          <p className="text-sm text-muted-foreground">Quản lý xe</p>
        </div>
        {canWrite(role) ? (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger render={<Button />}>
              <Plus />
              Add Vehicle
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Tạo Vehicle mới</DialogTitle>
              </DialogHeader>
              <form action={handleCreate} className="flex flex-col gap-3">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="plate_number">Biển số *</Label>
                  <Input id="plate_number" name="plate_number" placeholder="51C-123.45" required />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="plate_display">Hiển thị</Label>
                  <Input id="plate_display" name="plate_display" placeholder="51C-123.45" />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="vehicle_type">Loại xe</Label>
                  <Input id="vehicle_type" name="vehicle_type" />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="brand">Hãng</Label>
                  <Input id="brand" name="brand" />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="model">Model</Label>
                  <Input id="model" name="model" />
                </div>
                <Button type="submit" disabled={saving}>
                  {saving ? "Đang lưu..." : "Tạo Vehicle"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        ) : null}
      </div>

      <WriteAccessHint canEdit={canWrite(role)} />

      <Input
        placeholder="Search vehicle..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
      />

      {canDelete ? (
        <BulkDeleteBar
          selectedCount={selection.selectedCount}
          onClear={selection.clear}
          onDelete={() => setBulkOpen(true)}
          entityLabel="vehicle"
        />
      ) : null}

      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              {canDelete ? (
                <TableHead className="w-10">
                  <RowCheckbox
                    checked={selection.allSelected}
                    indeterminate={selection.someSelected}
                    onChange={selection.toggleAll}
                    label="Chọn tất cả vehicle"
                  />
                </TableHead>
              ) : null}
              <TableHead>Plate</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Brand / Model</TableHead>
              <TableHead>Drivers</TableHead>
              <TableHead>Customers</TableHead>
              <TableHead>Status</TableHead>
              {showActions ? <TableHead className="w-36">Thao tác</TableHead> : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableLoadingRows colSpan={colSpan} />
            ) : data?.length ? (
              data.map((vehicle) => (
                <TableRow
                  key={vehicle.id}
                  data-state={selection.isSelected(vehicle.id) ? "selected" : undefined}
                >
                  {canDelete ? (
                    <TableCell>
                      <RowCheckbox
                        checked={selection.isSelected(vehicle.id)}
                        onChange={() => selection.toggle(vehicle.id)}
                        label={`Chọn vehicle ${vehicle.plate_display ?? vehicle.plate_number}`}
                      />
                    </TableCell>
                  ) : null}
                  <TableCell>
                    <Link href={`/vehicles/${vehicle.id}`} className="font-medium hover:underline">
                      {vehicle.plate_display ?? vehicle.plate_number}
                    </Link>
                  </TableCell>
                  <TableCell>{vehicle.vehicle_type ?? "—"}</TableCell>
                  <TableCell>
                    {[vehicle.brand, vehicle.model].filter(Boolean).join(" ") || "—"}
                  </TableCell>
                  <TableCell>{vehicle.driverCount}</TableCell>
                  <TableCell>{vehicle.customerCount}</TableCell>
                  <TableCell>
                    <StatusBadge status={vehicle.status} />
                  </TableCell>
                  {showActions ? (
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        <EditRowLink
                          href={`/vehicles/${vehicle.id}`}
                          label={`vehicle ${vehicle.plate_display ?? vehicle.plate_number}`}
                        />
                        {canDelete ? (
                          <IconActionButton
                            label={`Xóa vehicle ${vehicle.plate_display ?? vehicle.plate_number}`}
                            tooltip="Xóa vĩnh viễn"
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setDeleteTarget(vehicle)}
                          >
                            <Trash2 />
                          </IconActionButton>
                        ) : null}
                      </div>
                    </TableCell>
                  ) : null}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={colSpan} className="text-center text-muted-foreground">
                  Chưa có vehicle
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        title={`Xóa vĩnh viễn xe "${deleteTarget?.plate_display ?? deleteTarget?.plate_number}"`}
        description="Thao tác này xóa hẳn khỏi hệ thống, không thể khôi phục. Quan hệ tài xế/khách hàng liên quan cũng bị xóa."
        confirmLabel="Xóa vĩnh viễn"
        variant="destructive"
        onConfirm={executeDelete}
      />

      <ConfirmDialog
        open={bulkOpen}
        onOpenChange={setBulkOpen}
        title={`Xóa vĩnh viễn ${selection.selectedCount} vehicle`}
        description="Thao tác này xóa hẳn các bản ghi đã chọn, không thể khôi phục."
        confirmLabel="Xóa vĩnh viễn"
        variant="destructive"
        onConfirm={executeBulkDelete}
      />
    </div>
  );
}
