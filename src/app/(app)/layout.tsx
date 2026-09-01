import { redirect } from "next/navigation";

import { ProfileProvider } from "@/components/providers/profile-provider";
import { AppShell } from "@/components/shared/app-shell";
import { requireSession } from "@/lib/auth/session";
import type { AppRole } from "@/types/auth";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();

  if (session.profile?.status === "INACTIVE" || session.profile?.status === "ARCHIVED") {
    redirect("/login");
  }

  const role: AppRole = session.profile?.role ?? "VIEWER";

  return (
    <ProfileProvider role={role}>
      <AppShell profile={session.profile} email={session.email}>
        {children}
      </AppShell>
    </ProfileProvider>
  );
}
