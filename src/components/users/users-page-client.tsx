"use client";

import { useState } from "react";
import { Pencil, Plus } from "lucide-react";
import { toast } from "sonner";

import { createUserAction, updateUserAction } from "@/app/(app)/users/actions";
import { useProfile } from "@/components/providers/profile-provider";
import { StatusBadge } from "@/components/shared/status-badge";
import { Badge } from "@/components/ui/badge";
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useUsers } from "@/hooks/use-users";
import { canPerform } from "@/lib/auth/permissions";
import { formString } from "@/lib/form";
import { APP_ROLES } from "@/types/auth";

type EditUser = {
  id: string;
  email: string;
  display_name: string;
};

export function UsersPageClient() {
  const { role } = useProfile();
  const canManage = canPerform(role, "manage_users");
  const { data, isLoading, refetch } = useUsers();
  const [open, setOpen] = useState(false);
  const [editUser, setEditUser] = useState<EditUser | null>(null);
  const [saving, setSaving] = useState(false);
  const [newRole, setNewRole] = useState<string>("VIEWER");

  async function handleCreate(formData: FormData) {
    setSaving(true);
    const result = await createUserAction({
      email: formData.get("email"),
      password: formData.get("password"),
      display_name: formData.get("display_name"),
      role: newRole,
    });
    setSaving(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Đã tạo user");
    setOpen(false);
    refetch();
  }

  async function handleUpdateDisplayName(formData: FormData) {
    if (!editUser) return;
    setSaving(true);
    const result = await updateUserAction(editUser.id, {
      display_name: formString(formData, "display_name"),
    });
    setSaving(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Đã cập nhật display name");
    setEditUser(null);
    refetch();
  }

  async function handleRoleChange(userId: string, nextRole: string) {
    const result = await updateUserAction(userId, { role: nextRole });
    if (result.error) toast.error(result.error);
    else {
      toast.success("Đã cập nhật role");
      refetch();
    }
  }

  async function handleStatusChange(userId: string, status: string) {
    const result = await updateUserAction(userId, {
      status: status as "ACTIVE" | "INACTIVE" | "ARCHIVED",
    });
    if (result.error) toast.error(result.error);
    else {
      toast.success("Đã cập nhật status");
      refetch();
    }
  }

  if (!canManage) {
    return <p className="text-muted-foreground">Chỉ ADMIN mới quản lý users.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
          <p className="text-sm text-muted-foreground">Quản lý tài khoản và phân quyền</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button />}>
            <Plus />
            Add User
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tạo user mới</DialogTitle>
            </DialogHeader>
            <form action={handleCreate} className="flex flex-col gap-3">
              <div className="flex flex-col gap-2">
                <Label htmlFor="email">Email *</Label>
                <Input id="email" name="email" type="email" required />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="password">Password *</Label>
                <Input id="password" name="password" type="password" minLength={8} required />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="display_name">Display Name</Label>
                <Input id="display_name" name="display_name" />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Role</Label>
                <Select value={newRole} onValueChange={(v) => setNewRole(v ?? "VIEWER")}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {APP_ROLES.map((item) => (
                      <SelectItem key={item} value={item}>
                        {item}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" disabled={saving}>
                {saving ? "Đang tạo..." : "Tạo user"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Display Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-16" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5}>
                  <Skeleton className="h-4 w-full" />
                </TableCell>
              </TableRow>
            ) : data?.length ? (
              data.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.profile?.display_name ?? "—"}</TableCell>
                  <TableCell>
                    <Select
                      value={user.profile?.role ?? "VIEWER"}
                      onValueChange={(v) => handleRoleChange(user.id, v ?? "VIEWER")}
                    >
                      <SelectTrigger className="w-36">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {APP_ROLES.map((item) => (
                          <SelectItem key={item} value={item}>
                            {item}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    {user.profile ? (
                      <div className="flex items-center gap-2">
                        <StatusBadge status={user.profile.status} />
                        <Select
                          value={user.profile.status}
                          onValueChange={(v) => handleStatusChange(user.id, v ?? "ACTIVE")}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                            <SelectItem value="INACTIVE">INACTIVE</SelectItem>
                            <SelectItem value="ARCHIVED">ARCHIVED</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    ) : (
                      <Badge variant="secondary">No profile</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {user.profile ? (
                      <Button
                        size="icon-xs"
                        variant="ghost"
                        onClick={() =>
                          setEditUser({
                            id: user.id,
                            email: user.email,
                            display_name: user.profile?.display_name ?? "",
                          })
                        }
                        aria-label={`Sửa ${user.email}`}
                      >
                        <Pencil />
                      </Button>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  Chưa có user — tạo admin đầu tiên qua Supabase Dashboard
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={Boolean(editUser)} onOpenChange={(openState) => !openState && setEditUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sửa {editUser?.email}</DialogTitle>
          </DialogHeader>
          {editUser ? (
            <form
              key={editUser.id}
              action={handleUpdateDisplayName}
              className="flex flex-col gap-3"
            >
              <div className="flex flex-col gap-2">
                <Label htmlFor="edit_display_name">Display Name</Label>
                <Input
                  id="edit_display_name"
                  name="display_name"
                  defaultValue={editUser.display_name}
                  placeholder="Tên hiển thị"
                />
              </div>
              <Button type="submit" disabled={saving}>
                {saving ? "Đang lưu..." : "Lưu thay đổi"}
              </Button>
            </form>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
