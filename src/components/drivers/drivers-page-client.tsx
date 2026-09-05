"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { createDriverAction, deleteDriversAction } from "@/app/(app)/drivers/actions";
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
import { useDrivers } from "@/hooks/use-drivers";
import { useRowSelection } from "@/hooks/use-row-selection";
import { useSubmitLock } from "@/hooks/use-submit-lock";
import { canPerform, canWrite } from "@/lib/auth/permissions";
import type { DriverWithCounts } from "@/lib/master-data/drivers";

export function DriversPageClient() {
  const { role } = useProfile();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DriverWithCounts | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const { saving, runLocked } = useSubmitLock();
  const { data, isLoading, refetch } = useDrivers({ search: search || undefined });
  const showActions = canWrite(role);
  const canDelete = canPerform(role, "delete");
  const rowIds = useMemo(() => (data ?? []).map((d) => d.id), [data]);
  const selection = useRowSelection(rowIds);

  async function executeDelete() {
    if (!deleteTarget) return;
    const result = await deleteDriversAction([deleteTarget.id]);
    if (result.error) toast.error(result.error);
    else {
      toast.success("Đã xóa vĩnh viễn driver");
      selection.clear();
      refetch();
    }
  }

  async function executeBulkDelete() {
    if (selection.selectedCount === 0) return;
    const result = await deleteDriversAction(selection.selectedIds);
    if (result.error) toast.error(result.error);
    else {
      toast.success(`Đã xóa vĩnh viễn ${result.data?.deleted ?? selection.selectedCount} driver`);
      selection.clear();
      refetch();
    }
  }

  async function handleCreate(formData: FormData) {
    await runLocked(async () => {
      const result = await createDriverAction({
        full_name: formData.get("full_name"),
        code: formData.get("code"),
        phone: formData.get("phone"),
        document_number: formData.get("document_number"),
        license_number: formData.get("license_number"),
        status: "ACTIVE",
      });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Đã tạo driver");
      setOpen(false);
      refetch();
    });
  }

  const colSpan = (canDelete ? 1 : 0) + 6 + (showActions ? 1 : 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Drivers</h1>
          <p className="text-sm text-muted-foreground">Quản lý tài xế</p>
        </div>
        {canWrite(role) ? (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger render={<Button />}>
              <Plus />
              Add Driver
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Tạo Driver mới</DialogTitle>
              </DialogHeader>
              <form action={handleCreate} className="flex flex-col gap-3">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="full_name">Họ tên *</Label>
                  <Input id="full_name" name="full_name" required />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="code">Code</Label>
                  <Input id="code" name="code" />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" name="phone" />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="document_number">CMND/CCCD</Label>
                  <Input id="document_number" name="document_number" />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="license_number">GPLX</Label>
                  <Input id="license_number" name="license_number" />
                </div>
                <Button type="submit" disabled={saving}>
                  {saving ? "Đang lưu..." : "Tạo Driver"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        ) : null}
      </div>

      <WriteAccessHint canEdit={canWrite(role)} />

      <Input
        placeholder="Search driver..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
      />

      {canDelete ? (
        <BulkDeleteBar
          selectedCount={selection.selectedCount}
          onClear={selection.clear}
          onDelete={() => setBulkOpen(true)}
          entityLabel="driver"
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
                    label="Chọn tất cả driver"
                  />
                </TableHead>
              ) : null}
              <TableHead>Name</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Vehicles</TableHead>
              <TableHead>Customers</TableHead>
              <TableHead>Status</TableHead>
              {showActions ? <TableHead className="w-36">Thao tác</TableHead> : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableLoadingRows colSpan={colSpan} />
            ) : data?.length ? (
              data.map((driver) => (
                <TableRow key={driver.id} data-state={selection.isSelected(driver.id) ? "selected" : undefined}>
                  {canDelete ? (
                    <TableCell>
                      <RowCheckbox
                        checked={selection.isSelected(driver.id)}
                        onChange={() => selection.toggle(driver.id)}
                        label={`Chọn driver ${driver.full_name}`}
                      />
                    </TableCell>
                  ) : null}
                  <TableCell>
                    <Link href={`/drivers/${driver.id}`} className="font-medium hover:underline">
                      {driver.full_name}
                    </Link>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{driver.code ?? "—"}</TableCell>
                  <TableCell>{driver.phone ?? "—"}</TableCell>
                  <TableCell>{driver.vehicleCount}</TableCell>
                  <TableCell>{driver.customerCount}</TableCell>
                  <TableCell>
                    <StatusBadge status={driver.status} />
                  </TableCell>
                  {showActions ? (
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        <EditRowLink
                          href={`/drivers/${driver.id}`}
                          label={`driver ${driver.full_name}`}
                        />
                        {canDelete ? (
                          <IconActionButton
                            label={`Xóa driver ${driver.full_name}`}
                            tooltip="Xóa vĩnh viễn"
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setDeleteTarget(driver)}
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
                  Chưa có driver
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        title={`Xóa vĩnh viễn tài xế "${deleteTarget?.full_name}"`}
        description="Thao tác này xóa hẳn khỏi hệ thống, không thể khôi phục. Quan hệ xe/khách hàng liên quan cũng bị xóa."
        confirmLabel="Xóa vĩnh viễn"
        variant="destructive"
        onConfirm={executeDelete}
      />

      <ConfirmDialog
        open={bulkOpen}
        onOpenChange={setBulkOpen}
        title={`Xóa vĩnh viễn ${selection.selectedCount} driver`}
        description="Thao tác này xóa hẳn các bản ghi đã chọn, không thể khôi phục."
        confirmLabel="Xóa vĩnh viễn"
        variant="destructive"
        onConfirm={executeBulkDelete}
      />
    </div>
  );
}
