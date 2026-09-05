"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

import { deletePartiesAction, updatePartyAction } from "@/app/(app)/parties/actions";
import { useProfile } from "@/components/providers/profile-provider";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { DetailEditHint } from "@/components/shared/edit-row-actions";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Textarea } from "@/components/ui/textarea";
import { useParty, usePartyCustomers } from "@/hooks/use-parties";
import { useSubmitLock } from "@/hooks/use-submit-lock";
import { canPerform, canWrite } from "@/lib/auth/permissions";
import { formString } from "@/lib/form";

export function PartyDetailClient({ partyId }: { partyId: string }) {
  const { role } = useProfile();
  const router = useRouter();
  const { data: party, isLoading, refetch } = useParty(partyId);
  const customers = usePartyCustomers(partyId);
  const { saving, runLocked } = useSubmitLock();
  const [deleteOpen, setDeleteOpen] = useState(false);

  if (isLoading) return <Skeleton className="h-64 w-full" />;
  if (!party) return <p>Không tìm thấy party.</p>;

  const record = party;

  async function handleUpdate(formData: FormData) {
    await runLocked(async () => {
      const result = await updatePartyAction(partyId, {
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
        notes: formString(formData, "notes"),
      });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Đã cập nhật");
      refetch();
    });
  }

  async function handleDelete() {
    const result = await deletePartiesAction([partyId]);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Đã xóa vĩnh viễn party");
    router.push("/parties");
  }

  return (
    <div className="flex flex-col gap-4">
      <Link href="/parties" className="inline-flex items-center gap-1 text-sm text-muted-foreground">
        <ArrowLeft className="size-4" />
        Parties
      </Link>
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold">{record.name}</h1>
          <StatusBadge status={record.status} />
        </div>
        {canPerform(role, "delete") ? (
          <Button
            variant="outline"
            onClick={() => setDeleteOpen(true)}
            className="text-destructive"
          >
            Xóa vĩnh viễn
          </Button>
        ) : null}
      </div>

      <DetailEditHint canEdit={canWrite(role)} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Thông tin chi tiết Party (Logistics Master)</CardTitle>
        </CardHeader>
        <CardContent>
          {canWrite(role) ? (
            <form action={handleUpdate} className="grid gap-3 md:grid-cols-2">
              <div className="flex flex-col gap-2 md:col-span-2">
                <Label htmlFor="name">Tên Công ty / Pháp nhân *</Label>
                <Input id="name" name="name" defaultValue={record.name} required />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="code">Mã đối tác (Code)</Label>
                <Input id="code" name="code" defaultValue={record.code ?? ""} />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="tax_code">Mã số thuế (Tax / VAT)</Label>
                <Input id="tax_code" name="tax_code" defaultValue={record.tax_code ?? ""} />
              </div>
              <div className="flex flex-col gap-2 md:col-span-2">
                <Label htmlFor="branch_name">Chi nhánh / Kho hàng (Branch / Warehouse)</Label>
                <Input id="branch_name" name="branch_name" defaultValue={record.branch_name ?? ""} />
              </div>
              <div className="flex flex-col gap-2 md:col-span-2">
                <Label htmlFor="address">Địa chỉ đầy đủ (Address)</Label>
                <Textarea id="address" name="address" defaultValue={record.address ?? ""} rows={2} />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="contact_person">Người liên hệ (Contact Person)</Label>
                <Input id="contact_person" name="contact_person" defaultValue={record.contact_person ?? ""} />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="contact_phone">SĐT người liên hệ</Label>
                <Input id="contact_phone" name="contact_phone" defaultValue={record.contact_phone ?? ""} />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="phone">Điện thoại cty (Phone)</Label>
                <Input id="phone" name="phone" defaultValue={record.phone ?? ""} />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="fax">Fax (ESID)</Label>
                <Input id="fax" name="fax" defaultValue={record.fax ?? ""} />
              </div>
              <div className="flex flex-col gap-2 md:col-span-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" defaultValue={record.email ?? ""} />
              </div>
              <div className="flex flex-col gap-2 md:col-span-2">
                <Label htmlFor="handling_instructions">Hướng dẫn giao nhận / Ghi chú hàng</Label>
                <Textarea
                  id="handling_instructions"
                  name="handling_instructions"
                  defaultValue={record.handling_instructions ?? ""}
                  rows={2}
                />
              </div>
              <div className="flex flex-col gap-2 md:col-span-2">
                <Label htmlFor="notes">Notes nội bộ</Label>
                <Textarea id="notes" name="notes" defaultValue={record.notes ?? ""} rows={2} />
              </div>
              <div className="md:col-span-2">
                <Button type="submit" disabled={saving}>
                  {saving ? "Đang lưu..." : "Lưu thay đổi"}
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-2 text-sm text-muted-foreground">
              <p><strong>Địa chỉ:</strong> {record.address || "—"}</p>
              {record.contact_person && <p><strong>Liên hệ:</strong> {record.contact_person} ({record.contact_phone || record.phone || "—"})</p>}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Used by Customers</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Role</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.isLoading ? (
                <TableRow>
                  <TableCell colSpan={2}>
                    <Skeleton className="h-4 w-full" />
                  </TableCell>
                </TableRow>
              ) : customers.data?.length ? (
                customers.data.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      {row.customer ? (
                        <Link
                          href={`/customers/${row.customer.id}`}
                          className="hover:underline"
                        >
                          {row.customer.code} — {row.customer.name}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>{row.role}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={2} className="text-center text-muted-foreground">
                    Chưa được customer nào sử dụng
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={`Xóa vĩnh viễn party "${record.name}"`}
        description="Thao tác này xóa hẳn khỏi hệ thống, không thể khôi phục. Quan hệ khách hàng liên quan cũng bị xóa."
        confirmLabel="Xóa vĩnh viễn"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </div>
  );
}
