"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import {
  createCommodityAction,
  updateCommodityAction,
} from "@/app/(app)/commodities/actions";
import { useProfile } from "@/components/providers/profile-provider";
import { EditRowButton, WriteAccessHint } from "@/components/shared/edit-row-actions";
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
import { useCommodities } from "@/hooks/use-commodities";
import { useSubmitLock } from "@/hooks/use-submit-lock";
import { canWrite } from "@/lib/auth/permissions";
import { formString } from "@/lib/form";
import type { Tables } from "@/types/database";

type CommodityRow = Tables<"commodities">;

export function CommoditiesPageClient() {
  const { role } = useProfile();
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editRow, setEditRow] = useState<CommodityRow | null>(null);
  const { saving, runLocked } = useSubmitLock();
  const { data, isLoading, refetch } = useCommodities({ search: search || undefined });

  async function handleCreate(formData: FormData) {
    await runLocked(async () => {
      const result = await createCommodityAction({
        name: formString(formData, "name"),
        code: formString(formData, "code"),
        english_name: formString(formData, "english_name"),
        category: formString(formData, "category"),
        status: "ACTIVE",
        is_dg: false,
        contains_battery: false,
        is_liquid: false,
      });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Đã tạo commodity");
      setCreateOpen(false);
      refetch();
    });
  }

  async function handleUpdate(formData: FormData) {
    if (!editRow) return;
    await runLocked(async () => {
      const result = await updateCommodityAction(editRow.id, {
        name: formString(formData, "name"),
        code: formString(formData, "code"),
        english_name: formString(formData, "english_name"),
        category: formString(formData, "category"),
      });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Đã cập nhật commodity");
      setEditRow(null);
      refetch();
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Commodities</h1>
          <p className="text-sm text-muted-foreground">Master danh mục tên hàng</p>
        </div>
        {canWrite(role) ? (
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger render={<Button />}>
              <Plus />
              Add Commodity
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Tạo Commodity</DialogTitle>
              </DialogHeader>
              <CommodityForm onSubmit={handleCreate} saving={saving} />
            </DialogContent>
          </Dialog>
        ) : null}
      </div>

      <WriteAccessHint canEdit={canWrite(role)} />

      <Input
        placeholder="Search commodity..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
      />

      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>English</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Status</TableHead>
              {canWrite(role) ? <TableHead className="w-24">Thao tác</TableHead> : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6}>
                  <Skeleton className="h-4 w-full" />
                </TableCell>
              </TableRow>
            ) : data?.length ? (
              data.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-mono">{item.code ?? "—"}</TableCell>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {item.english_name ?? "—"}
                  </TableCell>
                  <TableCell>{item.category ?? "—"}</TableCell>
                  <TableCell>
                    <StatusBadge status={item.status} />
                  </TableCell>
                  {canWrite(role) ? (
                    <TableCell>
                      <EditRowButton label={item.name} onClick={() => setEditRow(item)} />
                    </TableCell>
                  ) : null}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  Chưa có commodity
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={Boolean(editRow)} onOpenChange={(open) => !open && setEditRow(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sửa {editRow?.name}</DialogTitle>
          </DialogHeader>
          {editRow ? (
            <CommodityForm
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

function CommodityForm({
  defaultValues,
  onSubmit,
  saving,
}: {
  defaultValues?: CommodityRow;
  onSubmit: (formData: FormData) => void | Promise<void>;
  saving: boolean;
}) {
  return (
    <form action={onSubmit} className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Name *</Label>
        <Input id="name" name="name" defaultValue={defaultValues?.name ?? ""} required />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="code">Code</Label>
        <Input
          id="code"
          name="code"
          defaultValue={defaultValues?.code ?? ""}
          placeholder="GARMENTS"
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="english_name">English Name</Label>
        <Input
          id="english_name"
          name="english_name"
          defaultValue={defaultValues?.english_name ?? ""}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="category">Category</Label>
        <Input id="category" name="category" defaultValue={defaultValues?.category ?? ""} />
      </div>
      <Button type="submit" disabled={saving}>
        {saving ? "Đang lưu..." : defaultValues ? "Lưu thay đổi" : "Tạo Commodity"}
      </Button>
    </form>
  );
}
