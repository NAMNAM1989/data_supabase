"use client";

import { useMemo, useState } from "react";
import { Upload } from "lucide-react";
import { toast } from "sonner";

import { commitImportAction, previewImportAction } from "@/app/(app)/import/actions";
import { useProfile } from "@/components/providers/profile-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { applyColumnMapping, autoMapColumns } from "@/lib/import/column-mapping";
import { parseSpreadsheet } from "@/lib/import/parse-spreadsheet";
import type { ImportEntityType, ImportPreviewRow, ImportRowAction } from "@/lib/import/types";
import { canPerform } from "@/lib/auth/permissions";
import { useSubmitLock } from "@/hooks/use-submit-lock";

const ENTITY_OPTIONS: Array<{ value: ImportEntityType; label: string }> = [
  { value: "customers", label: "Customers" },
  { value: "parties", label: "Parties" },
  { value: "drivers", label: "Drivers" },
  { value: "vehicles", label: "Vehicles" },
  { value: "commodities", label: "Commodities" },
];

const ALLOWED_EXTENSIONS = new Set([".xlsx", ".xls", ".csv"]);
const ALLOWED_MIME_TYPES = new Set([
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "text/csv",
  "application/csv",
  "text/plain",
]);
const MAX_FILE_SIZE = 10 * 1024 * 1024;

function statusVariant(status: ImportPreviewRow["status"]) {
  if (status === "valid") return "default" as const;
  if (status === "duplicate") return "secondary" as const;
  if (status === "warning") return "outline" as const;
  return "destructive" as const;
}

function getFileExtension(name: string) {
  const idx = name.lastIndexOf(".");
  return idx >= 0 ? name.slice(idx).toLowerCase() : "";
}

function isValidImportFile(file: File) {
  const ext = getFileExtension(file.name);
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return "Chỉ chấp nhận file .xlsx, .xls hoặc .csv";
  }
  if (file.type && !ALLOWED_MIME_TYPES.has(file.type)) {
    return "Loại MIME không hợp lệ cho spreadsheet";
  }
  if (file.size > MAX_FILE_SIZE) {
    return "File vượt quá 10MB";
  }
  return null;
}

export function ImportPageClient() {
  const { role } = useProfile();
  const canImport = canPerform(role, "import");
  const [entity, setEntity] = useState<ImportEntityType>("customers");
  const [fileName, setFileName] = useState("");
  const [previewRows, setPreviewRows] = useState<ImportPreviewRow[]>([]);
  const [summary, setSummary] = useState({ total: 0, valid: 0, warnings: 0, errors: 0, duplicates: 0 });
  const [loading, setLoading] = useState(false);
  const { saving: committing, runLocked } = useSubmitLock();

  const emptySummary = { total: 0, valid: 0, warnings: 0, errors: 0, duplicates: 0 };

  const selectedCount = useMemo(
    () => previewRows.filter((row) => row.action !== "skip" && row.status !== "error").length,
    [previewRows],
  );

  function clearPreview() {
    setPreviewRows([]);
    setSummary(emptySummary);
    setFileName("");
  }

  function handleEntityChange(next: ImportEntityType) {
    setEntity(next);
    if (previewRows.length > 0 || fileName) {
      clearPreview();
      toast.message("Đã đổi entity — tải lại file để preview");
    }
  }

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const input = event.target;
    const file = input.files?.[0];
    if (!file) return;

    const validationError = isValidImportFile(file);
    if (validationError) {
      toast.error(validationError);
      input.value = "";
      setFileName("");
      setPreviewRows([]);
      setSummary({ total: 0, valid: 0, warnings: 0, errors: 0, duplicates: 0 });
      return;
    }

    setLoading(true);
    setFileName(file.name);

    try {
      const buffer = await file.arrayBuffer();
      const parsed = parseSpreadsheet(buffer);
      const mapping = autoMapColumns(entity, parsed.headers);
      const mappedRows = applyColumnMapping(parsed.rows, mapping);

      const result = await previewImportAction({ entity, rows: mappedRows });
      if (result.error) {
        toast.error(result.error);
        input.value = "";
        setFileName("");
        setPreviewRows([]);
        return;
      }

      setPreviewRows(result.data?.rows ?? []);
      setSummary({
        total: result.data?.total ?? 0,
        valid: result.data?.valid ?? 0,
        warnings: result.data?.warnings ?? 0,
        errors: result.data?.errors ?? 0,
        duplicates: result.data?.duplicates ?? 0,
      });
      toast.success(`Đã load ${result.data?.total ?? 0} dòng`);
    } catch {
      toast.error("Không thể đọc file");
      input.value = "";
      setFileName("");
      setPreviewRows([]);
    } finally {
      setLoading(false);
    }
  }

  function updateRowAction(rowNumber: number, action: ImportRowAction) {
    setPreviewRows((rows) => rows.map((row) => (row.rowNumber === rowNumber ? { ...row, action } : row)));
  }

  async function handleCommit() {
    if (!confirm(`Import ${selectedCount} dòng đã chọn?`)) return;

    await runLocked(async () => {
      const result = await commitImportAction({
        entity,
        rows: previewRows.map((row) => ({
          rowNumber: row.rowNumber,
          action: row.action,
          data: row.data,
          matchId: row.matchId,
        })),
      });

      if (result.error) {
        toast.error(result.error);
        return;
      }

      const data = result.data;
      toast.success(`Import xong: ${data?.created} tạo, ${data?.updated} cập nhật, ${data?.skipped} bỏ qua`);
      if (data?.errors.length) {
        toast.error(`${data.errors.length} dòng lỗi`);
      }
      clearPreview();
    });
  }

  if (!canImport) {
    return <p className="text-muted-foreground">Bạn không có quyền import dữ liệu.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Import</h1>
        <p className="text-sm text-muted-foreground">
          Upload Excel/CSV → preview → validate → commit (có audit IMPORT)
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">1. Chọn loại dữ liệu & file</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label>Entity</Label>
            <Select value={entity} onValueChange={(v) => handleEntityChange((v ?? "customers") as ImportEntityType)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ENTITY_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="import-file">File (.xlsx, .xls, .csv)</Label>
            <Input
              id="import-file"
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              disabled={loading}
            />
            {fileName ? <p className="text-xs text-muted-foreground">{fileName}</p> : null}
          </div>
        </CardContent>
      </Card>

      {previewRows.length ? (
        <>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">Total: {summary.total}</Badge>
            <Badge>Valid: {summary.valid}</Badge>
            <Badge variant="secondary">Duplicates: {summary.duplicates}</Badge>
            <Badge variant="destructive">Errors: {summary.errors}</Badge>
            <Badge variant="outline">Selected: {selectedCount}</Badge>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">2. Preview</CardTitle>
              <Button onClick={handleCommit} disabled={committing || selectedCount === 0}>
                <Upload />
                {committing ? "Đang import..." : `Import ${selectedCount} dòng`}
              </Button>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Preview</TableHead>
                    <TableHead>Match</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewRows.map((row) => (
                    <TableRow key={row.rowNumber}>
                      <TableCell>{row.rowNumber}</TableCell>
                      <TableCell>
                        <Badge variant={statusVariant(row.status)}>{row.status}</Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate text-sm">
                        {Object.entries(row.data)
                          .filter(([, value]) => value)
                          .slice(0, 3)
                          .map(([key, value]) => `${key}: ${value}`)
                          .join(" · ")}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {row.matchLabel ?? row.message ?? "—"}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={row.action}
                          onValueChange={(v) => updateRowAction(row.rowNumber, (v ?? "skip") as ImportRowAction)}
                          disabled={row.status === "error"}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="create">Create</SelectItem>
                            <SelectItem value="update">Update</SelectItem>
                            <SelectItem value="skip">Skip</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}
