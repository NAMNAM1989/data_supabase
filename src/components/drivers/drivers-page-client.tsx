"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { createDriverAction } from "@/app/(app)/drivers/actions";
import { useProfile } from "@/components/providers/profile-provider";
import { EditRowLink, WriteAccessHint } from "@/components/shared/edit-row-actions";
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
import { useSubmitLock } from "@/hooks/use-submit-lock";
import { canWrite } from "@/lib/auth/permissions";

export function DriversPageClient() {
  const { role } = useProfile();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const { saving, runLocked } = useSubmitLock();
  const { data, isLoading, refetch } = useDrivers({ search: search || undefined });

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

      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Vehicles</TableHead>
              <TableHead>Customers</TableHead>
              <TableHead>Status</TableHead>
              {canWrite(role) ? <TableHead className="w-24">Thao tác</TableHead> : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableLoadingRows colSpan={canWrite(role) ? 7 : 6} />
            ) : data?.length ? (
              data.map((driver) => (
                <TableRow key={driver.id}>
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
                  {canWrite(role) ? (
                    <TableCell>
                      <EditRowLink href={`/drivers/${driver.id}`} label={`driver ${driver.full_name}`} />
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
                  Chưa có driver
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
