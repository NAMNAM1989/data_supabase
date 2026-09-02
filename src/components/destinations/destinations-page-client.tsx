"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, RotateCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  archiveDestinationAction,
  createDestinationAction,
  restoreDestinationAction,
  updateDestinationAction,
} from "@/app/(app)/destinations/actions";
import { useProfile } from "@/components/providers/profile-provider";
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
import { useDestinations } from "@/hooks/use-destinations";
import { useSubmitLock } from "@/hooks/use-submit-lock";
import { canPerform, canWrite } from "@/lib/auth/permissions";
import { formString } from "@/lib/form";
import { cn } from "@/lib/utils";
import type { Tables } from "@/types/database";

type DestinationRow = Tables<"destinations">;

export function DestinationsPageClient() {
  const { role } = useProfile();
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [manualEdit, setManualEdit] = useState<DestinationRow | null>(null);
  const { saving, runLocked } = useSubmitLock();
  const { data, isLoading, isError, refetch } = useDestinations({
    search: search || undefined,
  });

  const editFromQuery =
    editId && data?.length ? (data.find((item) => item.id === editId) ?? null) : null;
  const editRow = manualEdit ?? editFromQuery;

  async function handleCreate(formData: FormData) {
    await runLocked(async () => {
      const result = await createDestinationAction({
        iata_code: formData.get("iata_code"),
        city_name: formData.get("city_name"),
        country_code: formData.get("country_code"),
        country_name: formData.get("country_name"),
        region: formData.get("region"),
        timezone: formData.get("timezone"),
        status: "ACTIVE",
      });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Đã tạo destination");
      setCreateOpen(false);
      refetch();
    });
  }

  async function handleUpdate(formData: FormData) {
    if (!editRow) return;
    await runLocked(async () => {
      const result = await updateDestinationAction(editRow.id, {
        iata_code: formData.get("iata_code"),
        city_name: formData.get("city_name"),
        country_code: formData.get("country_code"),
        country_name: formData.get("country_name"),
        region: formData.get("region"),
        timezone: formData.get("timezone"),
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
      router.replace("/destinations", { scroll: false });
    }
  }

  async function handleArchive(row: DestinationRow) {
    if (row.status === "ARCHIVED") {
      const result = await restoreDestinationAction(row.id);
      if (result.error) toast.error(result.error);
      else {
        toast.success("Đã restore");
        refetch();
      }
      return;
    }

    if (!confirm(`Archive destination "${row.iata_code}"?`)) return;
    const result = await archiveDestinationAction(row.id);
    if (result.error) toast.error(result.error);
    else {
      toast.success("Đã archive");
      refetch();
    }
  }

  const colSpan = canWrite(role) ? 7 : 6;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Destinations</h1>
          <p className="text-sm text-muted-foreground">Mã IATA đích hàng không</p>
        </div>
        {canWrite(role) ? (
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger render={<Button />}>
              <Plus />
              Add Destination
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Tạo Destination</DialogTitle>
              </DialogHeader>
              <DestinationForm
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
        placeholder="Search IATA, city, country..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
      />

      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>IATA</TableHead>
              <TableHead>City</TableHead>
              <TableHead>Country</TableHead>
              <TableHead>Region</TableHead>
              <TableHead>Timezone</TableHead>
              <TableHead>Status</TableHead>
              {canWrite(role) ? <TableHead className="w-36">Thao tác</TableHead> : null}
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
                >
                  <TableCell className="font-mono font-medium">{row.iata_code}</TableCell>
                  <TableCell>{row.city_name ?? "—"}</TableCell>
                  <TableCell>{row.country_name ?? row.country_code ?? "—"}</TableCell>
                  <TableCell>{row.region ?? "—"}</TableCell>
                  <TableCell>{row.timezone ?? "—"}</TableCell>
                  <TableCell>
                    <StatusBadge status={row.status} />
                  </TableCell>
                  {canWrite(role) ? (
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        <EditRowButton
                          label={row.iata_code ?? row.city_name ?? "destination"}
                          onClick={() => setManualEdit(row)}
                        />
                        {canPerform(role, "archive") ? (
                          row.status === "ARCHIVED" ? (
                            <IconActionButton
                              label={`Restore destination ${row.iata_code}`}
                              tooltip="Restore destination"
                              onClick={() => handleArchive(row)}
                            >
                              <RotateCcw />
                            </IconActionButton>
                          ) : (
                            <IconActionButton
                              label={`Archive destination ${row.iata_code}`}
                              tooltip="Archive destination"
                              variant="ghost"
                              className="text-destructive hover:text-destructive"
                              onClick={() => handleArchive(row)}
                            >
                              <Trash2 />
                            </IconActionButton>
                          )
                        ) : null}
                      </div>
                    </TableCell>
                  ) : null}
                </TableRow>
              ))
            ) : (
              <TableEmptyRow colSpan={colSpan} message="Chưa có destination" />
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sửa {editRow?.iata_code}</DialogTitle>
          </DialogHeader>
          {editRow ? (
            <DestinationForm
              key={editRow.id}
              defaultValues={editRow}
              onSubmit={handleUpdate}
              saving={saving}
              onCancel={closeEdit}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DestinationForm({
  defaultValues,
  onSubmit,
  saving,
  onCancel,
}: {
  defaultValues?: DestinationRow;
  onSubmit: (formData: FormData) => void | Promise<void>;
  saving: boolean;
  onCancel?: () => void;
}) {
  const [status, setStatus] = useState(defaultValues?.status ?? "ACTIVE");
  const initial = useMemo(
    () => ({
      iata_code: defaultValues?.iata_code ?? "",
      city_name: defaultValues?.city_name ?? "",
      country_code: defaultValues?.country_code ?? "",
      country_name: defaultValues?.country_name ?? "",
      region: defaultValues?.region ?? "",
      timezone: defaultValues?.timezone ?? "",
      status: defaultValues?.status ?? "ACTIVE",
    }),
    [defaultValues],
  );
  const [iataCode, setIataCode] = useState(initial.iata_code);
  const [cityName, setCityName] = useState(initial.city_name);
  const [countryCode, setCountryCode] = useState(initial.country_code);
  const [countryName, setCountryName] = useState(initial.country_name);
  const [region, setRegion] = useState(initial.region);
  const [timezone, setTimezone] = useState(initial.timezone);

  const dirty =
    !defaultValues ||
    iataCode !== initial.iata_code ||
    cityName !== initial.city_name ||
    countryCode !== initial.country_code ||
    countryName !== initial.country_name ||
    region !== initial.region ||
    timezone !== initial.timezone ||
    status !== initial.status;

  const valid = iataCode.trim().length > 0;

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
          placeholder="SGN"
          maxLength={3}
          required
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="city_name">City</Label>
        <Input
          id="city_name"
          name="city_name"
          value={cityName}
          onChange={(e) => setCityName(e.target.value)}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="country_code">Country Code</Label>
        <Input
          id="country_code"
          name="country_code"
          value={countryCode}
          onChange={(e) => setCountryCode(e.target.value)}
          placeholder="VN"
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="country_name">Country</Label>
        <Input
          id="country_name"
          name="country_name"
          value={countryName}
          onChange={(e) => setCountryName(e.target.value)}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="region">Region</Label>
        <Input
          id="region"
          name="region"
          value={region}
          onChange={(e) => setRegion(e.target.value)}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="timezone">Timezone</Label>
        <Input
          id="timezone"
          name="timezone"
          value={timezone}
          onChange={(e) => setTimezone(e.target.value)}
        />
      </div>
      {defaultValues ? (
        <div className="flex flex-col gap-2 md:col-span-2">
          <Label>Status</Label>
          <input type="hidden" name="status" value={status} />
          <Select
            value={status}
            onValueChange={(v) => setStatus((v as DestinationRow["status"]) ?? "ACTIVE")}
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
