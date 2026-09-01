"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

import {
  archivePartyAction,
  restorePartyAction,
  updatePartyAction,
} from "@/app/(app)/parties/actions";
import { useProfile } from "@/components/providers/profile-provider";
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
  const { data: party, isLoading, refetch } = useParty(partyId);
  const customers = usePartyCustomers(partyId);
  const { saving, runLocked } = useSubmitLock();

  if (isLoading) return <Skeleton className="h-64 w-full" />;
  if (!party) return <p>Không tìm thấy party.</p>;

  const record = party;

  async function handleUpdate(formData: FormData) {
    await runLocked(async () => {
      const result = await updatePartyAction(partyId, {
        name: formString(formData, "name"),
        code: formString(formData, "code"),
        address: formString(formData, "address"),
        phone: formString(formData, "phone"),
        email: formString(formData, "email"),
        tax_code: formString(formData, "tax_code"),
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

  async function handleArchive() {
    const result =
      record.status === "ARCHIVED"
        ? await restorePartyAction(partyId)
        : await archivePartyAction(partyId);
    if (result.error) toast.error(result.error);
    else {
      toast.success(record.status === "ARCHIVED" ? "Đã restore" : "Đã archive");
      refetch();
    }
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
        {canPerform(role, "archive") ? (
          <Button variant="outline" onClick={handleArchive}>
            {record.status === "ARCHIVED" ? "Restore" : "Archive"}
          </Button>
        ) : null}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Party Info</CardTitle>
        </CardHeader>
        <CardContent>
          {canWrite(role) ? (
            <form action={handleUpdate} className="grid gap-3 md:grid-cols-2">
              <div className="flex flex-col gap-2 md:col-span-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" name="name" defaultValue={record.name} required />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="code">Code</Label>
                <Input id="code" name="code" defaultValue={record.code ?? ""} />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="tax_code">Tax Code</Label>
                <Input id="tax_code" name="tax_code" defaultValue={record.tax_code ?? ""} />
              </div>
              <div className="flex flex-col gap-2 md:col-span-2">
                <Label htmlFor="address">Address</Label>
                <Textarea id="address" name="address" defaultValue={record.address ?? ""} rows={2} />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" name="phone" defaultValue={record.phone ?? ""} />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" defaultValue={record.email ?? ""} />
              </div>
              <div className="flex flex-col gap-2 md:col-span-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea id="notes" name="notes" defaultValue={record.notes ?? ""} rows={2} />
              </div>
              <div className="md:col-span-2">
                <Button type="submit" disabled={saving}>
                  {saving ? "Đang lưu..." : "Lưu"}
                </Button>
              </div>
            </form>
          ) : (
            <p className="text-sm text-muted-foreground">{record.address}</p>
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
    </div>
  );
}
