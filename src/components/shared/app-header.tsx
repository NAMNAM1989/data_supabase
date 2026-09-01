"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

import { GlobalSearchDialog } from "@/components/shared/global-search-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { createClient } from "@/lib/supabase/client";
import type { UserProfile } from "@/types/auth";

type AppHeaderProps = {
  profile: UserProfile | null;
  email?: string;
};

export function AppHeader({ profile, email }: AppHeaderProps) {
  const router = useRouter();
  const supabase = createClient();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b bg-card px-4">
      <SidebarTrigger />
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <GlobalSearchDialog />
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="outline" size="sm" className="gap-2" />
          }
        >
          <span className="max-w-[160px] truncate">
            {profile?.display_name ?? email ?? "User"}
          </span>
          {profile?.role ? <Badge variant="secondary">{profile.role}</Badge> : null}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Tài khoản</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleSignOut}>
            <LogOut />
            Đăng xuất
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
