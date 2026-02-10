import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/hooks/useAuth";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { LayoutDashboard, User, CreditCard, Users, BarChart3, Puzzle, Settings, LogOut, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";

const items = [
  { title: "Overview", url: "/dashboard", icon: LayoutDashboard },
  { title: "Perfis", url: "/dashboard/profiles", icon: User },
  { title: "Cartões NFC", url: "/dashboard/cards", icon: CreditCard },
  { title: "Leads", url: "/dashboard/leads", icon: Users },
  { title: "Analytics", url: "/dashboard/analytics", icon: BarChart3 },
  { title: "Aparência", url: "/dashboard/appearance", icon: Palette },
  { title: "Integrações", url: "/dashboard/integrations", icon: Puzzle },
  { title: "Configurações", url: "/dashboard/settings", icon: Settings },
];

export function DashboardSidebar() {
  const { signOut } = useAuth();

  return (
    <Sidebar>
      <div className="flex items-center gap-2 px-4 py-4 text-lg font-bold text-foreground">
        Greattings
      </div>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end={item.url === "/dashboard"} activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium">
                      <item.icon className="mr-2 h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <Button variant="ghost" className="w-full justify-start gap-2 text-muted-foreground" onClick={signOut}>
          <LogOut className="h-4 w-4" />
          Sair
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
