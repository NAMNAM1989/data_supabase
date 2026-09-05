"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { createPartyAction, deletePartiesAction } from "@/app/(app)/parties/actions";
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
import { Textarea } from "@/components/ui/textarea";
import { useParties } from "@/hooks/use-parties";
import { useRowSelection } from "@/hooks/use-row-selection";
import { useSubmitLock } from "@/hooks/use-submit-lock";
import { canPerform, canWrite } from "@/lib/auth/permissions";
import { formString } from "@/lib/form";
import type { PartyWithUsage } from "@/lib/master-data/parties";

export function PartiesPageClient() {
  const { role } = useProfile();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<PartyWithUsage | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const { saving, runLocked } = useSubmitLock();
  const { data, isLoading, refetch } = useParties({ search: search || undefined });
  const showActions = canWrite(role);
  const canDelete = canPerform(role, "delete");
  const rowIds = useMemo(() => (data ?? []).map((p) => p.id), [data]);
  const selection = useRowSelection(rowIds);

  async function executeDelete() {
    if (!deleteTarget) return;
    const result = await deletePartiesAction([deleteTarget.id]);
    if (result.error) toast.error(result.error);
    else {
      toast.success("Đã xóa vĩnh viễn party");
      selection.clear();
      refetch();
    }
  }

  async function executeBulkDelete() {
    if (selection.selectedCount === 0) return;
    const result = await deletePartiesAction(selection.selectedIds);
    if (result.error) toast.error(result.error);
    else {
      toast.success(`Đã xóa vĩnh viễn ${result.data?.deleted ?? selection.selectedCount} party`);
      selection.clear();
      refetch();
    }
  }

  async function handleCreate(formData: FormData) {
    await runLocked(async () => {
      const result = await createPartyAction({
        name: formString(formData, "name"),
        code: formString(formData, "code"),
        tax_code: formString(formData, "tax_code"),
        branch_name: formString(formData, "branch_name"),
        contact_person: formString(formData, "contact_person"),
        contact_phone: formString(formData, "contact_phone"),
        address: formString(formData, "address"),
        phone: formString(formData, "phone"),
        fax: formString(formData, "fax"),
        email: formString(formData, "email"),
        handling_instructions: formString(formData, "handling_instructions"),
        status: "ACTIVE",
      });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Đã tạo party");
      setOpen(false);
      refetch();
    });
  }

  const colSpan = (canDelete ? 1 : 0) + 5 + (showActions ? 1 : 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Parties</h1>
          <p className="text-sm text-muted-foreground">
            Shipper / Consignee / Agent / Notify (ESID)
          </p>
        </div>
        {canWrite(role) ? (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger render={<Button />}>
              <Plus />
              Add Party
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Tạo Party mới (Shipper / CNEE / Agent / Notify)</DialogTitle>
              </DialogHeader>
              <form action={handleCreate} className="grid gap-3 sm:grid-cols-2">
                <div className="flex flex-col gap-2 sm:col-span-2">
                  <Label htmlFor="name">Tên Công ty / Pháp nhân *</Label>
                  <Input id="name" name="name" placeholder="VD: AIR GLOBAL VIETNAM CO.,LTD" required />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="code">Mã đối tác (Code)</Label>
                  <Input id="code" name="code" placeholder="VD: AGL-S01" />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="tax_code">Mã số thuế (VAT / Tax Code)</Label>
                  <Input id="tax_code" name="tax_code" placeholder="VD: 0312345678" />
                </div>
                <div className="flex flex-col gap-2 sm:col-span-2">
                  <Label htmlFor="branch_name">Tên chi nhánh / Kho / Warehouse</Label>
                  <Input id="branch_name" name="branch_name" placeholder="VD: Kho hàng SCSC / Chi nhánh Hà Nội" />
                </div>
                <div className="flex flex-col gap-2 sm:col-span-2">
                  <Label htmlFor="address">Địa chỉ đầy đủ (Address) *</Label>
                  <Textarea id="address" name="address" rows={2} placeholder="Số nhà, đường, phường, quận, tỉnh thành" />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="contact_person">Người liên hệ (Contact Person)</Label>
                  <Input id="contact_person" name="contact_person" placeholder="VD: Nguyễn Văn A" />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="contact_phone">SĐT người liên hệ</Label>
                  <Input id="contact_phone" name="contact_phone" placeholder="VD: 0987654321" />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="phone">Điện thoại cty (Phone)</Label>
                  <Input id="phone" name="phone" placeholder="VD: 028-38486489" />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="fax">Fax (ESID)</Label>
                  <Input id="fax" name="fax" placeholder="VD: 028-38486490" />
                </div>
                <div className="flex flex-col gap-2 sm:col-span-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" placeholder="ops@example.com" />
                </div>
                <div className="flex flex-col gap-2 sm:col-span-2">
                  <Label htmlFor="handling_instructions">Hướng dẫn giao nhận / Ghi chú hàng hóa</Label>
                  <Textarea id="handling_instructions" name="handling_instructions" rows={2} placeholder="Yêu cầu bốc dỡ, lưu ý cổng kho, nhiệt độ bảo quản..." />
                </div>
                <div className="sm:col-span-2 pt-2">
                  <Button type="submit" className="w-full" disabled={saving}>
                    {saving ? "Đang lưu..." : "Tạo Party"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        ) : null}
      </div>

      <WriteAccessHint canEdit={canWrite(role)} />

      <Input
        placeholder="Search party..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
      />

      {canDelete ? (
        <BulkDeleteBar
          selectedCount={selection.selectedCount}
          onClear={selection.clear}
          onDelete={() => setBulkOpen(true)}
          entityLabel="party"
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
                    label="Chọn tất cả party"
                  />
                </TableHead>
              ) : null}
              <TableHead>Name</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Address</TableHead>
              <TableHead className="text-right">Customers</TableHead>
              <TableHead>Status</TableHead>
              {showActions ? <TableHead className="w-36">Thao tác</TableHead> : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableLoadingRows colSpan={colSpan} />
            ) : data?.length ? (
              data.map((party) => (
                <TableRow key={party.id} data-state={selection.isSelected(party.id) ? "selected" : undefined}>
                  {canDelete ? (
                    <TableCell>
                      <RowCheckbox
                        checked={selection.isSelected(party.id)}
                        onChange={() => selection.toggle(party.id)}
                        label={`Chọn party ${party.name}`}
                      />
                    </TableCell>
                  ) : null}
                  <TableCell className="font-medium">
                    <Link href={`/parties/${party.id}`} className="hover:underline">
                      {party.name}
                    </Link>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{party.code ?? "—"}</TableCell>
                  <TableCell className="max-w-xs truncate text-muted-foreground">
                    {party.address ?? "—"}
                  </TableCell>
                  <TableCell className="text-right">{party.customerCount}</TableCell>
                  <TableCell>
                    <StatusBadge status={party.status} />
                  </TableCell>
                  {showActions ? (
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        <EditRowLink
                          href={`/parties/${party.id}`}
                          label={`party ${party.code || party.name}`}
                        />
                        {canDelete ? (
                          <IconActionButton
                            label={`Xóa party ${party.name}`}
                            tooltip="Xóa vĩnh viễn"
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setDeleteTarget(party)}
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
                  Chưa có party
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        title={`Xóa vĩnh viễn party "${deleteTarget?.name}"`}
        description="Thao tác này xóa hẳn khỏi hệ thống, không thể khôi phục. Quan hệ khách hàng liên quan cũng bị xóa."
        confirmLabel="Xóa vĩnh viễn"
        variant="destructive"
        onConfirm={executeDelete}
      />

      <ConfirmDialog
        open={bulkOpen}
        onOpenChange={setBulkOpen}
        title={`Xóa vĩnh viễn ${selection.selectedCount} party`}
        description="Thao tác này xóa hẳn các bản ghi đã chọn, không thể khôi phục."
        confirmLabel="Xóa vĩnh viễn"
        variant="destructive"
        onConfirm={executeBulkDelete}
      />
    </div>
  );
}
