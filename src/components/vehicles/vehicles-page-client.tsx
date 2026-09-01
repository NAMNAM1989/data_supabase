"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { createVehicleAction } from "@/app/(app)/vehicles/actions";
import { useProfile } from "@/components/providers/profile-provider";
import { EditRowLink, WriteAccessHint } from "@/components/shared/edit-row-actions";
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
import { useVehicles } from "@/hooks/use-vehicles";
import { useSubmitLock } from "@/hooks/use-submit-lock";
import { canWrite } from "@/lib/auth/permissions";

export function VehiclesPageClient() {
  const { role } = useProfile();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const { saving, runLocked } = useSubmitLock();
  const { data, isLoading, refetch } = useVehicles({ search: search || undefined });

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

      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Plate</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Brand / Model</TableHead>
              <TableHead>Drivers</TableHead>
              <TableHead>Customers</TableHead>
              <TableHead>Status</TableHead>
              {canWrite(role) ? <TableHead className="w-24">Thao tác</TableHead> : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={canWrite(role) ? 7 : 6}>
                  <Skeleton className="h-4 w-full" />
                </TableCell>
              </TableRow>
            ) : data?.length ? (
              data.map((vehicle) => (
                <TableRow key={vehicle.id}>
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
                  {canWrite(role) ? (
                    <TableCell>
                      <EditRowLink
                        href={`/vehicles/${vehicle.id}`}
                        label={vehicle.plate_display ?? vehicle.plate_number}
                      />
                    </TableCell>
                  ) : null}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={canWrite(role) ? 7 : 6}
                  className="text-center text-muted-foreground"
                >
                  Chưa có vehicle
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
