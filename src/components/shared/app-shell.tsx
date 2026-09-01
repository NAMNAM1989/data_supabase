import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppHeader } from "@/components/shared/app-header";
import { AppSidebar } from "@/components/shared/app-sidebar";
import type { UserProfile } from "@/types/auth";

type AppShellProps = {
  children: React.ReactNode;
  profile: UserProfile | null;
  email?: string;
};

export function AppShell({ children, profile, email }: AppShellProps) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="min-h-svh bg-[#E4EBF3]">
        <AppHeader profile={profile} email={email} />
        <main className="flex flex-1 flex-col gap-4 p-4 md:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
