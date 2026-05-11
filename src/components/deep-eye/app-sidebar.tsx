import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, Radar, Search, ShieldAlert, FileText, Puzzle, Bell,
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarFooter,
} from "@/components/ui/sidebar";
import { DeepEyeLogo } from "./logo";

const items = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "New Scan", url: "/new-scan", icon: Radar },
  { title: "Advanced Recon", url: "/recon", icon: Search },
  { title: "Vulnerabilities", url: "/vulnerabilities", icon: ShieldAlert },
  { title: "Reports", url: "/reports", icon: FileText },
  { title: "Plugin Manager", url: "/plugins", icon: Puzzle },
  { title: "Alerts & Settings", url: "/settings", icon: Bell },
];

export function AppSidebar() {
  const path = useRouterState({ select: (r) => r.location.pathname });

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="px-3 py-4">
        <DeepEyeLogo />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="font-mono text-[10px] tracking-widest text-muted-foreground">
            OPERATIONS
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const active = path === item.url;
                return (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton asChild isActive={active}>
                      <Link
                        to={item.url}
                        className={`flex items-center gap-3 rounded-md transition-all ${
                          active
                            ? "bg-emerald/10 text-emerald glow-emerald"
                            : "hover:bg-sidebar-accent/60"
                        }`}
                      >
                        <item.icon className="h-4 w-4" />
                        <span className="text-sm">{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="px-3 py-4">
        <div className="glass rounded-md p-3 text-[11px] font-mono text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald pulse-dot" />
            engine online
          </div>
          <div className="mt-1 text-[10px]">node-EU-WEST · 0.42 ms</div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
