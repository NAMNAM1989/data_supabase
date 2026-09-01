import { SettingsPageClient } from "@/components/settings/settings-page-client";
import { requireSession } from "@/lib/auth/session";
import type { AppRole } from "@/types/auth";

export default async function SettingsPage() {
  const session = await requireSession();
  const role: AppRole = session.profile?.role ?? "VIEWER";

  return (
    <SettingsPageClient profile={session.profile} email={session.email} role={role} />
  );
}
