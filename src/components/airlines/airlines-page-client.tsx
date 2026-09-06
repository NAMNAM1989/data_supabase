"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  createAirlineAction,
  deleteAirlinesAction,
  updateAirlineAction,
} from "@/app/(app)/airlines/actions";
import { useProfile } from "@/components/providers/profile-provider";
import { BulkDeleteBar, RowCheckbox } from "@/components/shared/bulk-delete-bar";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EditRowButton, WriteAccessHint } from "@/components/shared/edit-row-actions";
import { IconActionButton } from "@/components/shared/icon-action-button";
import { StatusBadge } from "@/components/shared/status-badge";
import { TableEmptyRow, TableErrorRow, TableLoadingRows } from "@/components/shared/table-states";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAirlines } from "@/hooks/use-airlines";
import { useRowSelection } from "@/hooks/use-row-selection";
import { useSubmitLock } from "@/hooks/use-submit-lock";
import { canPerform, canWrite } from "@/lib/auth/permissions";
import { formString } from "@/lib/form";
import { cn } from "@/lib/utils";
import type { Tables } from "@/types/database";

type AirlineRow = Tables<"airlines">;

export function AirlinesPageClient() {
  const { role } = useProfile();
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [manualEdit, setManualEdit] = useState<AirlineRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AirlineRow | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const { saving, runLocked } = useSubmitLock();
  const { data, isLoading, isError, refetch } = useAirlines({
    search: search || undefined,
  });
  const showActions = canWrite(role);
  const canDelete = canPerform(role, "delete");
  const rowIds = useMemo(() => (data ?? []).map((d) => d.id), [data]);
  const selection = useRowSelection(rowIds);

  const editFromQuery =
    editId && data?.length ? (data.find((item) => item.id === editId) ?? null) : null;
  const editRow = manualEdit ?? editFromQuery;

  async function handleCreate(formData: FormData) {
    await runLocked(async () => {
      const result = await createAirlineAction({
        iata_code: formData.get("iata_code"),
        name: formData.get("name"),
        short_name: formData.get("short_name"),
        icao_code: formData.get("icao_code"),
        awb_prefix: formData.get("awb_prefix"),
        country_code: formData.get("country_code"),
        is_cargo_only: formData.get("is_cargo_only") === "on",
        notes: formData.get("notes"),
        status: "ACTIVE",
      });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Đã tạo airline");
      setCreateOpen(false);
      refetch();
    });
  }

  async function handleUpdate(formData: FormData) {
    if (!editRow) return;
    await runLocked(async () => {
      const result = await updateAirlineAction(editRow.id, {
        iata_code: formData.get("iata_code"),
        name: formData.get("name"),
        short_name: formData.get("short_name"),
        icao_code: formData.get("icao_code"),
        awb_prefix: formData.get("awb_prefix"),
        country_code: formData.get("country_code"),
        is_cargo_only: formData.get("is_cargo_only") === "on",
        notes: formData.get("notes"),
        status: formString(formData, "status") || editRow.status,
      });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Đã cập nhật");
      closeEdit();
      refetch();
    });
  }

  function closeEdit() {
    setManualEdit(null);
    if (editId) {
      router.replace("/airlines", { scroll: false });
    }
  }

  async function executeDelete() {
    if (!deleteTarget) return;
    const result = await deleteAirlinesAction([deleteTarget.id]);
    if (result.error) toast.error(result.error);
    else {
      toast.success("Đã xóa vĩnh viễn airline");
      selection.clear();
      refetch();
    }
  }

  async function executeBulkDelete() {
    if (selection.selectedCount === 0) return;
    const result = await deleteAirlinesAction(selection.selectedIds);
    if (result.error) toast.error(result.error);
    else {
      toast.success(`Đã xóa vĩnh viễn ${result.data?.deleted ?? selection.selectedCount} airline`);
      selection.clear();
      refetch();
    }
  }

  const colSpan = (canDelete ? 1 : 0) + 7 + (showActions ? 1 : 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Airlines</h1>
          <p className="text-sm text-muted-foreground">Hãng bay / AWB prefix (air cargo)</p>
        </div>
        {canWrite(role) ? (
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger render={<Button />}>
              <Plus />
              Add Airline
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Tạo Airline</DialogTitle>
              </DialogHeader>
              <AirlineForm
                onSubmit={handleCreate}
                saving={saving}
                onCancel={() => setCreateOpen(false)}
              />
            </DialogContent>
          </Dialog>
        ) : null}
      </div>

      <WriteAccessHint canEdit={canWrite(role)} />

      <Input
        placeholder="Search IATA, name, AWB prefix..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
      />

      {canDelete ? (
        <BulkDeleteBar
          selectedCount={selection.selectedCount}
          onClear={selection.clear}
          onDelete={() => setBulkOpen(true)}
          entityLabel="airline"
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
                    label="Chọn tất cả airline"
                  />
                </TableHead>
              ) : null}
              <TableHead>IATA</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>AWB</TableHead>
              <TableHead>ICAO</TableHead>
              <TableHead>Country</TableHead>
              <TableHead>Cargo</TableHead>
              <TableHead>Status</TableHead>
              {showActions ? <TableHead className="w-36">Thao tác</TableHead> : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableLoadingRows colSpan={colSpan} />
            ) : isError ? (
              <TableErrorRow colSpan={colSpan} onRetry={() => refetch()} />
            ) : data?.length ? (
              data.map((row) => (
                <TableRow
                  key={row.id}
                  className={cn(editId === row.id && "bg-amber-50 dark:bg-amber-950/30")}
                  data-highlight={editId === row.id ? "true" : undefined}
                  data-state={selection.isSelected(row.id) ? "selected" : undefined}
                >
                  {canDelete ? (
                    <TableCell>
                      <RowCheckbox
                        checked={selection.isSelected(row.id)}
                        onChange={() => selection.toggle(row.id)}
                        label={`Chọn airline ${row.iata_code}`}
                      />
                    </TableCell>
                  ) : null}
                  <TableCell className="font-mono font-medium">{row.iata_code}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span>{row.name}</span>
                      {row.short_name ? (
                        <span className="text-xs text-muted-foreground">{row.short_name}</span>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono">{row.awb_prefix ?? "—"}</TableCell>
                  <TableCell className="font-mono">{row.icao_code ?? "—"}</TableCell>
                  <TableCell>{row.country_code ?? "—"}</TableCell>
                  <TableCell>{row.is_cargo_only ? "Yes" : "—"}</TableCell>
                  <TableCell>
                    <StatusBadge status={row.status} />
                  </TableCell>
                  {showActions ? (
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        <EditRowButton
                          label={row.iata_code ?? row.name ?? "airline"}
                          onClick={() => setManualEdit(row)}
                        />
                        {canDelete ? (
                          <IconActionButton
                            label={`Xóa airline ${row.iata_code}`}
                            tooltip="Xóa vĩnh viễn"
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setDeleteTarget(row)}
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
              <TableEmptyRow colSpan={colSpan} message="Chưa có airline" />
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog
        open={Boolean(editRow)}
        onOpenChange={(open) => {
          if (!open) closeEdit();
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Sửa {editRow?.iata_code}</DialogTitle>
          </DialogHeader>
          {editRow ? (
            <AirlineForm
              key={editRow.id}
              defaultValues={editRow}
              onSubmit={handleUpdate}
              saving={saving}
              onCancel={closeEdit}
            />
          ) : null}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        title={`Xóa vĩnh viễn airline "${deleteTarget?.iata_code}"`}
        description="Thao tác này xóa hẳn khỏi hệ thống, không thể khôi phục."
        confirmLabel="Xóa vĩnh viễn"
        variant="destructive"
        onConfirm={executeDelete}
      />

      <ConfirmDialog
        open={bulkOpen}
        onOpenChange={setBulkOpen}
        title={`Xóa vĩnh viễn ${selection.selectedCount} airline`}
        description="Thao tác này xóa hẳn các bản ghi đã chọn, không thể khôi phục."
        confirmLabel="Xóa vĩnh viễn"
        variant="destructive"
        onConfirm={executeBulkDelete}
      />
    </div>
  );
}

function AirlineForm({
  defaultValues,
  onSubmit,
  saving,
  onCancel,
}: {
  defaultValues?: AirlineRow;
  onSubmit: (formData: FormData) => void | Promise<void>;
  saving: boolean;
  onCancel?: () => void;
}) {
  const [status, setStatus] = useState(defaultValues?.status ?? "ACTIVE");
  const initial = useMemo(
    () => ({
      iata_code: defaultValues?.iata_code ?? "",
      name: defaultValues?.name ?? "",
      short_name: defaultValues?.short_name ?? "",
      icao_code: defaultValues?.icao_code ?? "",
      awb_prefix: defaultValues?.awb_prefix ?? "",
      country_code: defaultValues?.country_code ?? "",
      is_cargo_only: defaultValues?.is_cargo_only ?? false,
      notes: defaultValues?.notes ?? "",
      status: defaultValues?.status ?? "ACTIVE",
    }),
    [defaultValues],
  );
  const [iataCode, setIataCode] = useState(initial.iata_code);
  const [name, setName] = useState(initial.name);
  const [shortName, setShortName] = useState(initial.short_name);
  const [icaoCode, setIcaoCode] = useState(initial.icao_code);
  const [awbPrefix, setAwbPrefix] = useState(initial.awb_prefix);
  const [countryCode, setCountryCode] = useState(initial.country_code);
  const [isCargoOnly, setIsCargoOnly] = useState(initial.is_cargo_only);
  const [notes, setNotes] = useState(initial.notes);

  const dirty =
    !defaultValues ||
    iataCode !== initial.iata_code ||
    name !== initial.name ||
    shortName !== initial.short_name ||
    icaoCode !== initial.icao_code ||
    awbPrefix !== initial.awb_prefix ||
    countryCode !== initial.country_code ||
    isCargoOnly !== initial.is_cargo_only ||
    notes !== initial.notes ||
    status !== initial.status;

  const valid = iataCode.trim().length > 0 && name.trim().length > 0;

  function handleCancel() {
    if (defaultValues && dirty && !confirm("Có thay đổi chưa lưu. Đóng form?")) return;
    onCancel?.();
  }

  return (
    <form action={onSubmit} className="grid gap-3 md:grid-cols-2">
      <div className="flex flex-col gap-2">
        <Label htmlFor="iata_code">IATA Code *</Label>
        <Input
          id="iata_code"
          name="iata_code"
          value={iataCode}
          onChange={(e) => setIataCode(e.target.value)}
          placeholder="CI"
          maxLength={2}
          required
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="awb_prefix">AWB Prefix</Label>
        <Input
          id="awb_prefix"
          name="awb_prefix"
          value={awbPrefix}
          onChange={(e) => setAwbPrefix(e.target.value)}
          placeholder="297"
          maxLength={3}
        />
      </div>
      <div className="flex flex-col gap-2 md:col-span-2">
        <Label htmlFor="name">Name *</Label>
        <Input
          id="name"
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="China Airlines"
          required
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="short_name">Short Name</Label>
        <Input
          id="short_name"
          name="short_name"
          value={shortName}
          onChange={(e) => setShortName(e.target.value)}
          placeholder="CI / China Air"
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="icao_code">ICAO</Label>
        <Input
          id="icao_code"
          name="icao_code"
          value={icaoCode}
          onChange={(e) => setIcaoCode(e.target.value)}
          placeholder="CAL"
          maxLength={3}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="country_code">Country Code</Label>
        <Input
          id="country_code"
          name="country_code"
          value={countryCode}
          onChange={(e) => setCountryCode(e.target.value)}
          placeholder="TW"
          maxLength={2}
        />
      </div>
      <div className="flex items-center gap-2 pt-6">
        <input
          id="is_cargo_only"
          name="is_cargo_only"
          type="checkbox"
          checked={isCargoOnly}
          onChange={(e) => setIsCargoOnly(e.target.checked)}
          className="size-4 rounded border"
        />
        <Label htmlFor="is_cargo_only">Cargo only</Label>
      </div>
      <div className="flex flex-col gap-2 md:col-span-2">
        <Label htmlFor="notes">Notes</Label>
        <Input
          id="notes"
          name="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>
      {defaultValues ? (
        <div className="flex flex-col gap-2 md:col-span-2">
          <Label>Status</Label>
          <input type="hidden" name="status" value={status} />
          <Select
            value={status}
            onValueChange={(v) => setStatus((v as AirlineRow["status"]) ?? "ACTIVE")}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ACTIVE">ACTIVE</SelectItem>
              <SelectItem value="INACTIVE">INACTIVE</SelectItem>
              <SelectItem value="ARCHIVED">ARCHIVED</SelectItem>
            </SelectContent>
          </Select>
        </div>
      ) : null}
      <div className="flex gap-2 md:col-span-2">
        <Button
          type="submit"
          disabled={saving || !valid || (Boolean(defaultValues) && !dirty)}
        >
          {saving ? "Đang lưu..." : defaultValues ? "Lưu thay đổi" : "Lưu"}
        </Button>
        {onCancel ? (
          <Button type="button" variant="outline" onClick={handleCancel} disabled={saving}>
            Hủy
          </Button>
        ) : null}
      </div>
    </form>
  );
}
