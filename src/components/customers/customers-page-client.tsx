"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, RotateCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  archiveCustomerAction,
  createCustomerAction,
  restoreCustomerAction,
} from "@/app/(app)/customers/actions";
import { useProfile } from "@/components/providers/profile-provider";
import { EditRowLink, WriteAccessHint } from "@/components/shared/edit-row-actions";
import { IconActionButton } from "@/components/shared/icon-action-button";
import { StatusBadge } from "@/components/shared/status-badge";
import { TableLoadingRows } from "@/components/shared/table-states";
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
import { Textarea } from "@/components/ui/textarea";
import { useCustomers } from "@/hooks/use-customers";
import { useSubmitLock } from "@/hooks/use-submit-lock";
import { canPerform, canWrite } from "@/lib/auth/permissions";
import { formString, formValue } from "@/lib/form";
import type { CustomerListItem } from "@/lib/master-data/customers";
import { CUSTOMER_TYPES } from "@/lib/validation/customer";

export function CustomersPageClient() {
  const { role } = useProfile();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("ALL");
  const [type, setType] = useState<string>("ALL");
  const [open, setOpen] = useState(false);
  const { saving, runLocked } = useSubmitLock();

  const { data, isLoading, refetch } = useCustomers({
    search: search || undefined,
    status: status === "ALL" ? undefined : (status as "ACTIVE" | "INACTIVE" | "ARCHIVED"),
    customerType: type === "ALL" ? undefined : type,
  });

  async function handleArchive(customer: CustomerListItem) {
    if (customer.status === "ARCHIVED") {
      const result = await restoreCustomerAction(customer.id);
      if (result.error) toast.error(result.error);
      else {
        toast.success("Đã khôi phục customer");
        refetch();
      }
      return;
    }

    if (!confirm(`Xóa customer "${customer.code} — ${customer.name}" khỏi danh sách?`)) return;
    const result = await archiveCustomerAction(customer.id);
    if (result.error) toast.error(result.error);
    else {
      toast.success("Đã xóa customer khỏi danh sách");
      refetch();
    }
  }

  async function handleCreate(formData: FormData) {
    await runLocked(async () => {
      const result = await createCustomerAction({
        code: formString(formData, "code"),
        name: formString(formData, "name"),
        short_name: formString(formData, "short_name"),
        customer_type: formValue(formData, "customer_type"),
        tax_code: formString(formData, "tax_code"),
        phone: formString(formData, "phone"),
        email: formString(formData, "email"),
        address: formString(formData, "address"),
        notes: formString(formData, "notes"),
        status: "ACTIVE",
      });

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Đã tạo customer");
      setOpen(false);
      refetch();
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Customers</h1>
          <p className="text-sm text-muted-foreground">Quản lý khách hàng master data</p>
        </div>
        {canWrite(role) ? (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger render={<Button />}>
              <Plus />
              Add Customer
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Tạo Customer mới</DialogTitle>
              </DialogHeader>
              <form action={handleCreate} className="flex flex-col gap-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="code">Code *</Label>
                    <Input id="code" name="code" placeholder="CYL" required />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="customer_type">Type</Label>
                    <Select name="customer_type" defaultValue="DIRECT_SHIPPER">
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CUSTOMER_TYPES.map((t) => (
                          <SelectItem key={t} value={t}>
                            {t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input id="name" name="name" required />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="short_name">Short Name</Label>
                  <Input id="short_name" name="short_name" />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" name="phone" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" name="email" type="email" />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="tax_code">Tax Code</Label>
                  <Input id="tax_code" name="tax_code" />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="address">Address</Label>
                  <Textarea id="address" name="address" rows={2} />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea id="notes" name="notes" rows={2} />
                </div>
                <Button type="submit" disabled={saving}>
                  {saving ? "Đang lưu..." : "Tạo Customer"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        ) : null}
      </div>

      <WriteAccessHint canEdit={canWrite(role)} />

      <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 md:flex-row">
        <Input
          placeholder="Search code, name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="md:max-w-xs"
        />
        <Select value={type} onValueChange={(v) => setType(v ?? "ALL")}>
          <SelectTrigger className="md:w-48">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All types</SelectItem>
            {CUSTOMER_TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={(v) => setStatus(v ?? "ALL")}>
          <SelectTrigger className="md:w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All status</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="INACTIVE">Inactive</SelectItem>
            <SelectItem value="ARCHIVED">Đã xóa</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Shipper</TableHead>
              <TableHead className="text-right">CNEE</TableHead>
              <TableHead className="text-right">Goods</TableHead>
              <TableHead>Status</TableHead>
              {canWrite(role) ? <TableHead className="w-36">Thao tác</TableHead> : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableLoadingRows colSpan={canWrite(role) ? 8 : 7} />
            ) : data?.length ? (
              data.map((customer) => (
                <TableRow key={customer.id} className="cursor-pointer">
                  <TableCell className="font-mono font-medium">
                    <Link href={`/customers/${customer.id}`} className="hover:underline">
                      {customer.code}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link href={`/customers/${customer.id}`} className="hover:underline">
                      {customer.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {customer.customer_type ?? "—"}
                  </TableCell>
                  <TableCell className="text-right">{customer.shipperCount}</TableCell>
                  <TableCell className="text-right">{customer.consigneeCount}</TableCell>
                  <TableCell className="text-right">{customer.commodityCount}</TableCell>
                  <TableCell>
                    <StatusBadge status={customer.status} />
                  </TableCell>
                  {canWrite(role) ? (
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        <EditRowLink
                          href={`/customers/${customer.id}`}
                          label={`customer ${customer.code}`}
                        />
                        {canPerform(role, "archive") ? (
                          customer.status === "ARCHIVED" ? (
                            <IconActionButton
                              label={`Khôi phục customer ${customer.code}`}
                              tooltip="Khôi phục"
                              onClick={() => handleArchive(customer)}
                            >
                              <RotateCcw />
                            </IconActionButton>
                          ) : (
                            <IconActionButton
                              label={`Xóa customer ${customer.code}`}
                              tooltip="Xóa"
                              variant="ghost"
                              className="text-destructive hover:text-destructive"
                              onClick={() => handleArchive(customer)}
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
              <TableRow>
                <TableCell
                  colSpan={canWrite(role) ? 8 : 7}
                  className="h-24 text-center text-muted-foreground"
                >
                  Chưa có customer
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {!canPerform(role, "read") ? (
        <p className="text-sm text-destructive">Bạn không có quyền xem dữ liệu.</p>
      ) : null}
    </div>
  );
}
