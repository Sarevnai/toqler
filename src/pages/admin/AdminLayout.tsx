import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import AdminRoute from "@/components/auth/AdminRoute";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Building2, Bell, Settings, LogOut, ArrowLeft, Package, Receipt, FileText, Ticket } from "lucide-react";

const menuItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/admin" },
  { label: "Empresas", icon: Building2, path: "/admin/customers" },
  { label: "Notificações", icon: Bell, path: "/admin/notifications" },
  { label: "Configurações", icon: Settings, path: "/admin/settings" },
];

const billingItems = [
  { label: "Planos", icon: Package, path: "/admin/plans" },
  { label: "Assinaturas", icon: Receipt, path: "/admin/subscriptions" },
  { label: "Faturas", icon: FileText, path: "/admin/invoices" },
  { label: "Cupons", icon: Ticket, path: "/admin/coupons" },
];

function AdminSidebar() {
  const { signOut } = useAuth();
  const { adminUser } = useAdminAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <Sidebar className="border-r-0">
      <div className="flex h-full flex-col bg-zinc-900 text-zinc-100">
        <SidebarHeader className="border-b border-zinc-700 px-4 py-4">
          <span className="text-lg font-bold tracking-tight">Toqler Admin</span>
        </SidebarHeader>
        <SidebarContent className="flex-1">
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {menuItems.map((item) => (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.path}
                        end={item.path === "/admin"}
                        className={({ isActive }) =>
                          `flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                            isActive
                              ? "bg-zinc-700 text-white font-medium"
                              : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
                          }`
                        }
                      >
                        <item.icon className="h-4 w-4" />
                        {item.label}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
          <SidebarGroup>
            <p className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Financeiro</p>
            <SidebarGroupContent>
              <SidebarMenu>
                {billingItems.map((item) => (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.path}
                        className={({ isActive }) =>
                          `flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                            isActive
                              ? "bg-zinc-700 text-white font-medium"
                              : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
                          }`
                        }
                      >
                        <item.icon className="h-4 w-4" />
                        {item.label}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="border-t border-zinc-700 p-4 space-y-3">
          {adminUser && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-zinc-300 truncate">
                {adminUser.display_name || "Admin"}
              </span>
              <Badge variant="secondary" className="text-[10px] bg-zinc-700 text-zinc-300">
                {adminUser.role}
              </Badge>
            </div>
          )}
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="flex-1 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 justify-start"
              asChild
            >
              <a href="/dashboard">
                <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
                Voltar ao app
              </a>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </SidebarFooter>
      </div>
    </Sidebar>
  );
}

export default function AdminLayout() {
  return (
    <AdminRoute>
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <AdminSidebar />
          <main className="flex-1 overflow-auto">
            <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b border-border bg-background/80 backdrop-blur-md px-6">
              <SidebarTrigger />
              <div className="flex-1" />
            </header>
            <div className="p-6">
              <Outlet />
            </div>
          </main>
        </div>
      </SidebarProvider>
    </AdminRoute>
  );
}
