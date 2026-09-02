"use client";

import { useState } from "react";
import { toast } from "sonner";

import { updateSelfSettingsAction } from "@/app/(app)/settings/actions";
import { APP_SETTINGS } from "@/config/settings";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSubmitLock } from "@/hooks/use-submit-lock";
import { canPerform } from "@/lib/auth/permissions";
import type { UserProfile } from "@/types/auth";

type SettingsPageClientProps = {
  profile: UserProfile | null;
  email?: string;
  role: UserProfile["role"] | "VIEWER";
};

export function SettingsPageClient({ profile, email, role }: SettingsPageClientProps) {
  const { saving, runLocked } = useSubmitLock();
  const isAdmin = canPerform(role, "manage_users");
  const [initialDisplayName, setInitialDisplayName] = useState(profile?.display_name ?? "");
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const dirty = displayName !== initialDisplayName;

  async function handleSave(formData: FormData) {
    await runLocked(async () => {
      const nextName = String(formData.get("display_name") ?? "");
      const result = await updateSelfSettingsAction({
        display_name: nextName,
      });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      setInitialDisplayName(nextName);
      setDisplayName(nextName);
      toast.success("Đã lưu cài đặt");
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">Cài đặt tài khoản và thông tin ứng dụng</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tài khoản của tôi</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={handleSave} className="grid max-w-lg gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={email || ""}
                placeholder="Không có email"
                readOnly
              />
              <p className="text-xs text-muted-foreground">
                Email đăng nhập không thể thay đổi tại đây
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="display_name">Display Name</Label>
              <Input
                id="display_name"
                name="display_name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Role</Label>
              <div>
                <Badge variant="secondary">{profile?.role ?? role}</Badge>
              </div>
            </div>
            <Button type="submit" disabled={saving || !dirty}>
              {saving ? "Đang lưu..." : "Lưu thay đổi"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ứng dụng</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm md:grid-cols-2">
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">App</span>
            <span>{APP_SETTINGS.appName}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Version</span>
            <span>{APP_SETTINGS.version}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Company</span>
            <span>{APP_SETTINGS.companyName}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Locale</span>
            <span>{APP_SETTINGS.defaultLocale}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Viewer export</span>
            <span>{APP_SETTINGS.allowViewerExport ? "Enabled" : "Disabled"}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Audit retention</span>
            <span>{APP_SETTINGS.auditRetentionDays} days</span>
          </div>
        </CardContent>
      </Card>

      {isAdmin ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Admin</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Quản lý users và audit logs tại menu System. Bootstrap admin đầu tiên qua Supabase
            Dashboard, sau đó promote role = ADMIN trong bảng profiles.
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
