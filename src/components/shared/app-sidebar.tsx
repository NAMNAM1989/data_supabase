"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useProfile } from "@/components/providers/profile-provider";
import { appBrand, mainNavigation } from "@/config/navigation";
import { canPerform } from "@/lib/auth/permissions";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";

export function AppSidebar() {
  const pathname = usePathname();
  const { role } = useProfile();
  const BrandIcon = appBrand.icon;

  const navigation = mainNavigation
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        if (item.href === "/audit-logs") return canPerform(role, "view_audit");
        if (item.href === "/users") return canPerform(role, "manage_users");
        return true;
      }),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2 px-2 py-1">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <BrandIcon className="size-4" />
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-semibold tracking-tight">{appBrand.name}</span>
            <span className="text-xs text-muted-foreground">{appBrand.tagline}</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        {navigation.map((group) => (
          <SidebarGroup key={group.label || "root"}>
            {group.label ? <SidebarGroupLabel>{group.label}</SidebarGroupLabel> : null}
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    pathname === item.href || pathname.startsWith(`${item.href}/`);

                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        render={<Link href={item.href} />}
                        isActive={isActive}
                        tooltip={item.title}
                      >
                        <Icon />
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border p-2 text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">
        Nam Nam Logistics
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
