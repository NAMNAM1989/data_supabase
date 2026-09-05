"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  createCommodityAction,
  deleteCommoditiesAction,
  updateCommodityAction,
} from "@/app/(app)/commodities/actions";
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
import { Textarea } from "@/components/ui/textarea";
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
import { useRowSelection } from "@/hooks/use-row-selection";
import { useSubmitLock } from "@/hooks/use-submit-lock";
import { canPerform, canWrite } from "@/lib/auth/permissions";
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
  const [deleteTarget, setDeleteTarget] = useState<CommodityRow | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const { saving, runLocked } = useSubmitLock();
  const { data, isLoading, isError, refetch } = useCommodities({
    search: search || undefined,
  });
  const showActions = canWrite(role);
  const canDelete = canPerform(role, "delete");
  const rowIds = useMemo(() => (data ?? []).map((c) => c.id), [data]);
  const selection = useRowSelection(rowIds);

  const editFromQuery =
    editId && data?.length ? (data.find((item) => item.id === editId) ?? null) : null;
  const editRow = manualEdit ?? editFromQuery;

  async function executeDelete() {
    if (!deleteTarget) return;
    const result = await deleteCommoditiesAction([deleteTarget.id]);
    if (result.error) toast.error(result.error);
    else {
      toast.success("Đã xóa vĩnh viễn commodity");
      selection.clear();
      refetch();
    }
  }

  async function executeBulkDelete() {
    if (selection.selectedCount === 0) return;
    const result = await deleteCommoditiesAction(selection.selectedIds);
    if (result.error) toast.error(result.error);
    else {
      toast.success(`Đã xóa vĩnh viễn ${result.data?.deleted ?? selection.selectedCount} commodity`);
      selection.clear();
      refetch();
    }
  }

  async function handleCreate(formData: FormData) {
    await runLocked(async () => {
      const shcRaw = formString(formData, "special_handling_codes");
      const shc = shcRaw
        ? shcRaw.split(/[\s,]+/).map((s) => s.trim().toUpperCase()).filter(Boolean)
        : [];

      const result = await createCommodityAction({
        name: formString(formData, "name"),
        code: formString(formData, "code"),
        english_name: formString(formData, "english_name"),
        category: formString(formData, "category"),
        cargo_type: formString(formData, "cargo_type") || "GENERAL",
        special_handling_codes: shc,
        temperature_range: formString(formData, "temperature_range"),
        un_number: formString(formData, "un_number"),
        dg_class: formString(formData, "dg_class"),
        default_packaging: formString(formData, "default_packaging") || "CARTON",
        status: "ACTIVE",
        is_dg: Boolean(formData.get("is_dg")),
        contains_battery: Boolean(formData.get("contains_battery")),
        is_liquid: Boolean(formData.get("is_liquid")),
        notes: formString(formData, "notes"),
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
      const shcRaw = formString(formData, "special_handling_codes");
      const shc = shcRaw
        ? shcRaw.split(/[\s,]+/).map((s) => s.trim().toUpperCase()).filter(Boolean)
        : [];

      const result = await updateCommodityAction(editRow.id, {
        name: formString(formData, "name"),
        code: formString(formData, "code"),
        english_name: formString(formData, "english_name"),
        category: formString(formData, "category"),
        cargo_type: formString(formData, "cargo_type") || "GENERAL",
        special_handling_codes: shc,
        temperature_range: formString(formData, "temperature_range"),
        un_number: formString(formData, "un_number"),
        dg_class: formString(formData, "dg_class"),
        default_packaging: formString(formData, "default_packaging") || "CARTON",
        is_dg: Boolean(formData.get("is_dg")),
        contains_battery: Boolean(formData.get("contains_battery")),
        is_liquid: Boolean(formData.get("is_liquid")),
        notes: formString(formData, "notes"),
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

  const colSpan = (canDelete ? 1 : 0) + 5 + (showActions ? 1 : 0);

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
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Tạo Hàng Hóa Mới (Air Cargo Commodity Master)</DialogTitle>
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

      {canDelete ? (
        <BulkDeleteBar
          selectedCount={selection.selectedCount}
          onClear={selection.clear}
          onDelete={() => setBulkOpen(true)}
          entityLabel="commodity"
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
                    label="Chọn tất cả commodity"
                  />
                </TableHead>
              ) : null}
              <TableHead>Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>English</TableHead>
              <TableHead>Category</TableHead>
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
              data.map((item) => (
                <TableRow
                  key={item.id}
                  className={cn(editId === item.id && "bg-amber-50 dark:bg-amber-950/30")}
                  data-highlight={editId === item.id ? "true" : undefined}
                  data-state={selection.isSelected(item.id) ? "selected" : undefined}
                >
                  {canDelete ? (
                    <TableCell>
                      <RowCheckbox
                        checked={selection.isSelected(item.id)}
                        onChange={() => selection.toggle(item.id)}
                        label={`Chọn commodity ${item.name}`}
                      />
                    </TableCell>
                  ) : null}
                  <TableCell className="font-mono">{item.code ?? "—"}</TableCell>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {item.english_name ?? "—"}
                  </TableCell>
                  <TableCell>{item.category ?? "—"}</TableCell>
                  <TableCell>
                    <StatusBadge status={item.status} />
                  </TableCell>
                  {showActions ? (
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        <EditRowButton
                          label={`commodity ${item.code ?? item.name}`}
                          onClick={() => setManualEdit(item)}
                        />
                        {canDelete ? (
                          <IconActionButton
                            label={`Xóa commodity ${item.name}`}
                            tooltip="Xóa vĩnh viễn"
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setDeleteTarget(item)}
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
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Sửa thông tin hàng hóa: {editRow?.name}</DialogTitle>
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

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        title={`Xóa vĩnh viễn hàng hóa "${deleteTarget?.name}"`}
        description="Thao tác này xóa hẳn khỏi hệ thống, không thể khôi phục."
        confirmLabel="Xóa vĩnh viễn"
        variant="destructive"
        onConfirm={executeDelete}
      />

      <ConfirmDialog
        open={bulkOpen}
        onOpenChange={setBulkOpen}
        title={`Xóa vĩnh viễn ${selection.selectedCount} commodity`}
        description="Thao tác này xóa hẳn các bản ghi đã chọn, không thể khôi phục."
        confirmLabel="Xóa vĩnh viễn"
        variant="destructive"
        onConfirm={executeBulkDelete}
      />
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
  const [cargoType, setCargoType] = useState(defaultValues?.cargo_type ?? "GENERAL");
  const [packaging, setPackaging] = useState(defaultValues?.default_packaging ?? "CARTON");
  const [isDg, setIsDg] = useState(defaultValues?.is_dg ?? false);
  const [hasBattery, setHasBattery] = useState(defaultValues?.contains_battery ?? false);
  const [isLiquid, setIsLiquid] = useState(defaultValues?.is_liquid ?? false);

  const initial = useMemo(
    () => ({
      name: defaultValues?.name ?? "",
      code: defaultValues?.code ?? "",
      english_name: defaultValues?.english_name ?? "",
      category: defaultValues?.category ?? "",
      hs_code: defaultValues?.hs_code ?? "",
      special_handling_codes: (defaultValues?.special_handling_codes ?? []).join(", "),
      temperature_range: defaultValues?.temperature_range ?? "",
      un_number: defaultValues?.un_number ?? "",
      dg_class: defaultValues?.dg_class ?? "",
      notes: defaultValues?.notes ?? "",
      status: defaultValues?.status ?? "ACTIVE",
    }),
    [defaultValues],
  );

  const [name, setName] = useState(initial.name);
  const [code, setCode] = useState(initial.code);
  const [englishName, setEnglishName] = useState(initial.english_name);
  const [category, setCategory] = useState(initial.category);
  const [hsCode, setHsCode] = useState(initial.hs_code);
  const [shc, setShc] = useState(initial.special_handling_codes);
  const [tempRange, setTempRange] = useState(initial.temperature_range);
  const [unNumber, setUnNumber] = useState(initial.un_number);
  const [dgClass, setDgClass] = useState(initial.dg_class);
  const [notes, setNotes] = useState(initial.notes);

  const dirty =
    !defaultValues ||
    name !== initial.name ||
    code !== initial.code ||
    englishName !== initial.english_name ||
    category !== initial.category ||
    hsCode !== initial.hs_code ||
    shc !== initial.special_handling_codes ||
    tempRange !== initial.temperature_range ||
    unNumber !== initial.un_number ||
    dgClass !== initial.dg_class ||
    notes !== initial.notes ||
    cargoType !== (defaultValues?.cargo_type ?? "GENERAL") ||
    packaging !== (defaultValues?.default_packaging ?? "CARTON") ||
    isDg !== (defaultValues?.is_dg ?? false) ||
    hasBattery !== (defaultValues?.contains_battery ?? false) ||
    isLiquid !== (defaultValues?.is_liquid ?? false) ||
    status !== initial.status;

  const valid = name.trim().length > 0;

  function handleCancel() {
    if (dirty && !confirm("Có thay đổi chưa lưu. Đóng form?")) return;
    onCancel?.();
  }

  return (
    <form action={onSubmit} className="grid gap-3 sm:grid-cols-2">
      <div className="flex flex-col gap-2 sm:col-span-2">
        <Label htmlFor="name">Tên hàng hóa (Tiếng Việt) *</Label>
        <Input
          id="name"
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="VD: Quần áo may mặc xuất khẩu / Linh kiện bo mạch"
          required
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="code">Mã hàng (Commodity Code)</Label>
        <Input
          id="code"
          name="code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="VD: GARMENTS, ELEC"
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="english_name">Tên Tiếng Anh (ESID Nature of Goods)</Label>
        <Input
          id="english_name"
          name="english_name"
          value={englishName}
          onChange={(e) => setEnglishName(e.target.value)}
          placeholder="VD: GARMENTS / ELECTRONIC COMPONENTS"
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="category">Phân nhóm (Category)</Label>
        <Input
          id="category"
          name="category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="Textile, Tech, Seafood..."
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="hs_code">Mã HS Code (Hải quan)</Label>
        <Input
          id="hs_code"
          name="hs_code"
          value={hsCode}
          onChange={(e) => setHsCode(e.target.value)}
          placeholder="VD: 6109.10.00"
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label>Loại hàng hàng không (Cargo Type)</Label>
        <input type="hidden" name="cargo_type" value={cargoType} />
        <Select value={cargoType} onValueChange={(v) => setCargoType(v ?? "GENERAL")}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="GENERAL">GENERAL — Hàng bách hóa thông thường</SelectItem>
            <SelectItem value="PERISHABLE">PERISHABLE — Hàng mau hỏng / Tươi sống (PER)</SelectItem>
            <SelectItem value="DANGEROUS_GOODS">DANGEROUS_GOODS — Hàng nguy hiểm (DG)</SelectItem>
            <SelectItem value="PHARMA">PHARMA — Dược phẩm / Y tế (PIL/COL)</SelectItem>
            <SelectItem value="VALUABLE">VALUABLE — Hàng giá trị cao (VAL)</SelectItem>
            <SelectItem value="VULNERABLE">VULNERABLE — Hàng dễ mất cắp (VUN)</SelectItem>
            <SelectItem value="EXPRESS">EXPRESS — Chuyển phát nhanh (XPS)</SelectItem>
            <SelectItem value="LIVE_ANIMALS">LIVE_ANIMALS — Động vật sống (AVI)</SelectItem>
            <SelectItem value="HEAVY_OUTSIZED">HEAVY_OUTSIZED — Quá khổ quá tải (BIG/HEA)</SelectItem>
            <SelectItem value="OTHER">OTHER — Khác</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-2">
        <Label>Quy cách đóng gói chuẩn (Packaging)</Label>
        <input type="hidden" name="default_packaging" value={packaging} />
        <Select value={packaging} onValueChange={(v) => setPackaging(v ?? "CARTON")}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="CARTON">Thùng Carton (CTN)</SelectItem>
            <SelectItem value="WOODEN_CRATE">Kiện gỗ / Khung gỗ (CRATE)</SelectItem>
            <SelectItem value="PALLET">Pallet (PLT)</SelectItem>
            <SelectItem value="PLASTIC_BOX">Hộp nhựa (BOX)</SelectItem>
            <SelectItem value="DRUM">Thùng phuy (DRUM)</SelectItem>
            <SelectItem value="BAG">Bao / Túi (BAG)</SelectItem>
            <SelectItem value="UNPACKED">Không đóng gói</SelectItem>
            <SelectItem value="OTHER">Khác</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="special_handling_codes">Mã xử lý đặc biệt (SHC - cách nhau dấu phẩy)</Label>
        <Input
          id="special_handling_codes"
          name="special_handling_codes"
          value={shc}
          onChange={(e) => setShc(e.target.value)}
          placeholder="VD: PER, COL, ELI, ELM"
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="temperature_range">Nhiệt độ bảo quản</Label>
        <Input
          id="temperature_range"
          name="temperature_range"
          value={tempRange}
          onChange={(e) => setTempRange(e.target.value)}
          placeholder="VD: +15°C đến +25°C / -20°C"
        />
      </div>

      <div className="sm:col-span-2 rounded-lg border p-3 bg-muted/30 flex flex-wrap gap-6 items-center">
        <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
          <input
            type="checkbox"
            name="is_dg"
            checked={isDg}
            onChange={(e) => setIsDg(e.target.checked)}
          />
          Hàng nguy hiểm (DG)
        </label>
        <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
          <input
            type="checkbox"
            name="contains_battery"
            checked={hasBattery}
            onChange={(e) => setHasBattery(e.target.checked)}
          />
          Có chứa pin (Lithium Battery)
        </label>
        <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
          <input
            type="checkbox"
            name="is_liquid"
            checked={isLiquid}
            onChange={(e) => setIsLiquid(e.target.checked)}
          />
          Hàng chất lỏng (Liquid)
        </label>
      </div>

      {isDg ? (
        <>
          <div className="flex flex-col gap-2">
            <Label htmlFor="un_number">Mã UN (UN Number)</Label>
            <Input
              id="un_number"
              name="un_number"
              value={unNumber}
              onChange={(e) => setUnNumber(e.target.value)}
              placeholder="VD: UN 3481"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="dg_class">Phân lớp nguy hiểm (DG Class)</Label>
            <Input
              id="dg_class"
              name="dg_class"
              value={dgClass}
              onChange={(e) => setDgClass(e.target.value)}
              placeholder="VD: Class 9 / 3 / 6.1"
            />
          </div>
        </>
      ) : null}

      <div className="flex flex-col gap-2 sm:col-span-2">
        <Label htmlFor="notes">Ghi chú xử lý / Hướng dẫn đặc biệt</Label>
        <Textarea
          id="notes"
          name="notes"
          value={notes}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNotes(e.target.value)}
          rows={2}
          placeholder="Lưu ý bốc dỡ, không xếp chồng, hướng dẫn chiếu xạ..."
        />
      </div>

      {defaultValues ? (
        <div className="flex flex-col gap-2 sm:col-span-2">
          <Label>Trạng thái</Label>
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

      <div className="flex gap-2 sm:col-span-2 pt-2">
        <Button type="submit" disabled={saving || !valid || (Boolean(defaultValues) && !dirty)}>
          {saving ? "Đang lưu..." : defaultValues ? "Lưu thay đổi" : "Tạo Hàng Hóa"}
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
