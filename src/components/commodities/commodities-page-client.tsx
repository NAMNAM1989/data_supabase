"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import {
  createCommodityAction,
  updateCommodityAction,
} from "@/app/(app)/commodities/actions";
import { useProfile } from "@/components/providers/profile-provider";
import { EditRowButton, WriteAccessHint } from "@/components/shared/edit-row-actions";
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
import { useCommodities } from "@/hooks/use-commodities";
import { useSubmitLock } from "@/hooks/use-submit-lock";
import { canWrite } from "@/lib/auth/permissions";
import { formString } from "@/lib/form";
import { cn } from "@/lib/utils";
import type { Tables } from "@/types/database";

type CommodityRow = Tables<"commodities">;

export function CommoditiesPageClient() {
  const { role } = useProfile();
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [manualEdit, setManualEdit] = useState<CommodityRow | null>(null);
  const { saving, runLocked } = useSubmitLock();
  const { data, isLoading, isError, refetch } = useCommodities({
    search: search || undefined,
  });

  const editFromQuery =
    editId && data?.length ? (data.find((item) => item.id === editId) ?? null) : null;
  const editRow = manualEdit ?? editFromQuery;

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
        status: formString(formData, "status") || editRow.status,
      });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Đã cập nhật commodity");
      closeEdit();
      refetch();
    });
  }

  function closeEdit() {
    setManualEdit(null);
    if (editId) {
      router.replace("/commodities", { scroll: false });
    }
  }

  const colSpan = canWrite(role) ? 6 : 5;

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
              <CommodityForm onSubmit={handleCreate} saving={saving} onCancel={() => setCreateOpen(false)} />
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
              <TableLoadingRows colSpan={colSpan} />
            ) : isError ? (
              <TableErrorRow colSpan={colSpan} onRetry={() => refetch()} />
            ) : data?.length ? (
              data.map((item) => (
                <TableRow
                  key={item.id}
                  className={cn(editId === item.id && "bg-amber-50 dark:bg-amber-950/30")}
                  data-highlight={editId === item.id ? "true" : undefined}
                >
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
                      <EditRowButton
                        label={`commodity ${item.code ?? item.name}`}
                        onClick={() => setManualEdit(item)}
                      />
                    </TableCell>
                  ) : null}
                </TableRow>
              ))
            ) : (
              <TableEmptyRow colSpan={colSpan} message="Chưa có commodity" />
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
            <DialogTitle>Sửa {editRow?.name}</DialogTitle>
          </DialogHeader>
          {editRow ? (
            <CommodityForm
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

function CommodityForm({
  defaultValues,
  onSubmit,
  saving,
  onCancel,
}: {
  defaultValues?: CommodityRow;
  onSubmit: (formData: FormData) => void | Promise<void>;
  saving: boolean;
  onCancel?: () => void;
}) {
  const [status, setStatus] = useState(defaultValues?.status ?? "ACTIVE");
  const initial = useMemo(
    () => ({
      name: defaultValues?.name ?? "",
      code: defaultValues?.code ?? "",
      english_name: defaultValues?.english_name ?? "",
      category: defaultValues?.category ?? "",
      status: defaultValues?.status ?? "ACTIVE",
    }),
    [defaultValues],
  );
  const [name, setName] = useState(initial.name);
  const [code, setCode] = useState(initial.code);
  const [englishName, setEnglishName] = useState(initial.english_name);
  const [category, setCategory] = useState(initial.category);

  const dirty =
    !defaultValues ||
    name !== initial.name ||
    code !== initial.code ||
    englishName !== initial.english_name ||
    category !== initial.category ||
    status !== initial.status;

  const valid = name.trim().length > 0;

  function handleCancel() {
    if (dirty && !confirm("Có thay đổi chưa lưu. Đóng form?")) return;
    onCancel?.();
  }

  return (
    <form action={onSubmit} className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Name *</Label>
        <Input
          id="name"
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="code">Code</Label>
        <Input
          id="code"
          name="code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="GARMENTS"
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="english_name">English Name</Label>
        <Input
          id="english_name"
          name="english_name"
          value={englishName}
          onChange={(e) => setEnglishName(e.target.value)}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="category">Category</Label>
        <Input
          id="category"
          name="category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        />
      </div>
      {defaultValues ? (
        <div className="flex flex-col gap-2">
          <Label>Status</Label>
          <input type="hidden" name="status" value={status} />
          <Select value={status} onValueChange={(v) => setStatus((v as CommodityRow["status"]) ?? "ACTIVE")}>
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
      <div className="flex gap-2">
        <Button type="submit" disabled={saving || !valid || (Boolean(defaultValues) && !dirty)}>
          {saving ? "Đang lưu..." : defaultValues ? "Lưu thay đổi" : "Tạo Commodity"}
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
