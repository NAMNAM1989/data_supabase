"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, RotateCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  archivePartyAction,
  createPartyAction,
  restorePartyAction,
} from "@/app/(app)/parties/actions";
import { useProfile } from "@/components/providers/profile-provider";
import { EditRowLink, WriteAccessHint } from "@/components/shared/edit-row-actions";
import { IconActionButton } from "@/components/shared/icon-action-button";
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
import { Textarea } from "@/components/ui/textarea";
import { useParties } from "@/hooks/use-parties";
import { useSubmitLock } from "@/hooks/use-submit-lock";
import { canPerform, canWrite } from "@/lib/auth/permissions";
import { formString } from "@/lib/form";
import type { PartyWithUsage } from "@/lib/master-data/parties";

export function PartiesPageClient() {
  const { role } = useProfile();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const { saving, runLocked } = useSubmitLock();
  const { data, isLoading, refetch } = useParties({ search: search || undefined });

  async function handleArchive(party: PartyWithUsage) {
    if (party.status === "ARCHIVED") {
      const result = await restorePartyAction(party.id);
      if (result.error) toast.error(result.error);
      else {
        toast.success("Đã khôi phục party");
        refetch();
      }
      return;
    }

    if (!confirm(`Xóa (archive) party "${party.name}"?`)) return;
    const result = await archivePartyAction(party.id);
    if (result.error) toast.error(result.error);
    else {
      toast.success("Đã xóa (archive) party");
      refetch();
    }
  }

  async function handleCreate(formData: FormData) {
    await runLocked(async () => {
      const result = await createPartyAction({
        name: formString(formData, "name"),
        code: formString(formData, "code"),
        address: formString(formData, "address"),
        phone: formString(formData, "phone"),
        email: formString(formData, "email"),
        tax_code: formString(formData, "tax_code"),
        status: "ACTIVE",
      });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Đã tạo party");
      setOpen(false);
      refetch();
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Parties</h1>
          <p className="text-sm text-muted-foreground">Shipper / Consignee dùng chung</p>
        </div>
        {canWrite(role) ? (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger render={<Button />}>
              <Plus />
              Add Party
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Tạo Party mới</DialogTitle>
              </DialogHeader>
              <form action={handleCreate} className="flex flex-col gap-3">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input id="name" name="name" required />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="code">Code</Label>
                  <Input id="code" name="code" />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="address">Address</Label>
                  <Textarea id="address" name="address" rows={2} />
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
                <Button type="submit" disabled={saving}>
                  {saving ? "Đang lưu..." : "Tạo Party"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        ) : null}
      </div>

      <WriteAccessHint canEdit={canWrite(role)} />

      <Input
        placeholder="Search party..."
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
              <TableHead>Address</TableHead>
              <TableHead className="text-right">Customers</TableHead>
              <TableHead>Status</TableHead>
              {canWrite(role) ? <TableHead className="w-36">Thao tác</TableHead> : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableLoadingRows colSpan={canWrite(role) ? 6 : 5} />
            ) : data?.length ? (
              data.map((party) => (
                <TableRow key={party.id}>
                  <TableCell className="font-medium">
                    <Link href={`/parties/${party.id}`} className="hover:underline">
                      {party.name}
                    </Link>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{party.code ?? "—"}</TableCell>
                  <TableCell className="max-w-xs truncate text-muted-foreground">
                    {party.address ?? "—"}
                  </TableCell>
                  <TableCell className="text-right">{party.customerCount}</TableCell>
                  <TableCell>
                    <StatusBadge status={party.status} />
                  </TableCell>
                  {canWrite(role) ? (
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        <EditRowLink
                          href={`/parties/${party.id}`}
                          label={`party ${party.code || party.name}`}
                        />
                        {canPerform(role, "archive") ? (
                          party.status === "ARCHIVED" ? (
                            <IconActionButton
                              label={`Khôi phục party ${party.name}`}
                              tooltip="Khôi phục"
                              onClick={() => handleArchive(party)}
                            >
                              <RotateCcw />
                            </IconActionButton>
                          ) : (
                            <IconActionButton
                              label={`Xóa party ${party.name}`}
                              tooltip="Xóa"
                              variant="ghost"
                              className="text-destructive hover:text-destructive"
                              onClick={() => handleArchive(party)}
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
                  colSpan={canWrite(role) ? 6 : 5}
                  className="text-center text-muted-foreground"
                >
                  Chưa có party
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
