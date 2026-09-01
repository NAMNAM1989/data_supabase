"use client";

import { useState } from "react";
import { Pencil, Plus } from "lucide-react";
import { toast } from "sonner";

import {
  archiveDestinationAction,
  createDestinationAction,
  restoreDestinationAction,
  updateDestinationAction,
} from "@/app/(app)/destinations/actions";
import { useProfile } from "@/components/providers/profile-provider";
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
import { Skeleton } from "@/components/ui/skeleton";
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
import type { Tables } from "@/types/database";

type DestinationRow = Tables<"destinations">;

export function DestinationsPageClient() {
  const { role } = useProfile();
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editRow, setEditRow] = useState<DestinationRow | null>(null);
  const { saving, runLocked } = useSubmitLock();
  const { data, isLoading, refetch } = useDestinations({ search: search || undefined });

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
      });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Đã cập nhật");
      setEditRow(null);
      refetch();
    });
  }

  async function handleArchive(row: DestinationRow) {
    const result =
      row.status === "ARCHIVED"
        ? await restoreDestinationAction(row.id)
        : await archiveDestinationAction(row.id);
    if (result.error) toast.error(result.error);
    else {
      toast.success(row.status === "ARCHIVED" ? "Đã restore" : "Đã archive");
      refetch();
    }
  }

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
              <DestinationForm onSubmit={handleCreate} saving={saving} />
            </DialogContent>
          </Dialog>
        ) : null}
      </div>

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
              {canWrite(role) ? <TableHead className="w-28" /> : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7}>
                  <Skeleton className="h-4 w-full" />
                </TableCell>
              </TableRow>
            ) : data?.length ? (
              data.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-mono font-medium">{row.iata_code}</TableCell>
                  <TableCell>{row.city_name ?? "—"}</TableCell>
                  <TableCell>
                    {row.country_name ?? row.country_code ?? "—"}
                  </TableCell>
                  <TableCell>{row.region ?? "—"}</TableCell>
                  <TableCell>{row.timezone ?? "—"}</TableCell>
                  <TableCell>
                    <StatusBadge status={row.status} />
                  </TableCell>
                  {canWrite(role) ? (
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="icon-xs" variant="ghost" onClick={() => setEditRow(row)}>
                          <Pencil />
                        </Button>
                        {canPerform(role, "archive") ? (
                          <Button size="icon-xs" variant="ghost" onClick={() => handleArchive(row)}>
                            {row.status === "ARCHIVED" ? "↩" : "✕"}
                          </Button>
                        ) : null}
                      </div>
                    </TableCell>
                  ) : null}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  Chưa có destination
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={Boolean(editRow)} onOpenChange={(open) => !open && setEditRow(null)}>
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
}: {
  defaultValues?: DestinationRow;
  onSubmit: (formData: FormData) => void | Promise<void>;
  saving: boolean;
}) {
  return (
    <form action={onSubmit} className="grid gap-3 md:grid-cols-2">
      <div className="flex flex-col gap-2">
        <Label htmlFor="iata_code">IATA Code *</Label>
        <Input
          id="iata_code"
          name="iata_code"
          defaultValue={defaultValues?.iata_code ?? ""}
          placeholder="SGN"
          maxLength={3}
          required
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="city_name">City</Label>
        <Input id="city_name" name="city_name" defaultValue={defaultValues?.city_name ?? ""} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="country_code">Country Code</Label>
        <Input
          id="country_code"
          name="country_code"
          defaultValue={defaultValues?.country_code ?? ""}
          placeholder="VN"
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="country_name">Country</Label>
        <Input id="country_name" name="country_name" defaultValue={defaultValues?.country_name ?? ""} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="region">Region</Label>
        <Input id="region" name="region" defaultValue={defaultValues?.region ?? ""} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="timezone">Timezone</Label>
        <Input id="timezone" name="timezone" defaultValue={defaultValues?.timezone ?? ""} />
      </div>
      <div className="md:col-span-2">
        <Button type="submit" disabled={saving}>
          {saving ? "Đang lưu..." : "Lưu"}
        </Button>
      </div>
    </form>
  );
}
