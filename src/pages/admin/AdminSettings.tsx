import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, ShieldCheck, UserPlus, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AdminUser {
  id: string;
  user_id: string;
  role: string;
  display_name: string | null;
  is_active: boolean;
  created_at: string | null;
}

const roleLabels: Record<string, string> = {
  super_admin: "Super Admin",
  finance: "Financeiro",
  support: "Suporte",
  operations: "Operações",
};

const roleBadgeColors: Record<string, string> = {
  super_admin: "bg-red-500/10 text-red-500",
  finance: "bg-blue-500/10 text-blue-500",
  support: "bg-green-500/10 text-green-500",
  operations: "bg-orange-500/10 text-orange-500",
};

export default function AdminSettings() {
  const { user } = useAuth();
  const { adminUser } = useAdminAuth();
  const { toast } = useToast();
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState("support");
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState(false);

  const isSuperAdmin = adminUser?.role === "super_admin";

  const fetchAdmins = async () => {
    try {
      const { data, error } = await supabase
        .from("admin_users")
        .select("id, user_id, role, display_name, is_active, created_at")
        .order("created_at", { ascending: true });
      if (error) throw error;
      setAdmins(data || []);
    } catch (err: any) {
      toast({ title: "Erro ao carregar admins", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAdmins(); }, []);

  const handleAddAdmin = async () => {
    if (!newEmail.trim()) return;
    setSaving(true);
    try {
      // Look up user by email via auth — we need to find the user_id
      // Since we can't query auth.users from client, we'll inform the user
      toast({
        title: "Funcionalidade limitada",
        description: "Para adicionar um novo admin, insira o user_id diretamente no banco de dados via Lovable Cloud.",
      });
      setDialogOpen(false);
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (admin: AdminUser) => {
    if (admin.user_id === user?.id) {
      toast({ title: "Você não pode desativar a si mesmo", variant: "destructive" });
      return;
    }
    try {
      const { error } = await supabase
        .from("admin_users")
        .update({ is_active: !admin.is_active })
        .eq("id", admin.id);
      if (error) throw error;
      setAdmins((prev) =>
        prev.map((a) => (a.id === admin.id ? { ...a, is_active: !a.is_active } : a))
      );
      toast({ title: admin.is_active ? "Admin desativado" : "Admin reativado" });
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
  };

  const deleteAdmin = async (admin: AdminUser) => {
    if (admin.user_id === user?.id) {
      toast({ title: "Você não pode remover a si mesmo", variant: "destructive" });
      return;
    }
    try {
      const { error } = await supabase.from("admin_users").delete().eq("id", admin.id);
      if (error) throw error;
      setAdmins((prev) => prev.filter((a) => a.id !== admin.id));
      toast({ title: "Admin removido" });
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Configurações</h1>
        <p className="text-sm text-muted-foreground">Gerencie os administradores da plataforma</p>
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                Administradores
              </CardTitle>
              <CardDescription>{admins.length} administrador(es) cadastrado(s)</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Desde</TableHead>
                  {isSuperAdmin && <TableHead className="text-right">Ações</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {admins.map((admin) => (
                  <TableRow key={admin.id}>
                    <TableCell className="font-medium">
                      {admin.display_name || "Sem nome"}
                      {admin.user_id === user?.id && (
                        <Badge variant="outline" className="ml-2 text-[10px]">Você</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={`border-0 ${roleBadgeColors[admin.role] || "bg-muted text-muted-foreground"}`}>
                        {roleLabels[admin.role] || admin.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={admin.is_active ? "default" : "secondary"}>
                        {admin.is_active ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {admin.created_at ? new Date(admin.created_at).toLocaleDateString("pt-BR") : "—"}
                    </TableCell>
                    {isSuperAdmin && (
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleActive(admin)}
                            disabled={admin.user_id === user?.id}
                          >
                            {admin.is_active ? "Desativar" : "Ativar"}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => deleteAdmin(admin)}
                            disabled={admin.user_id === user?.id}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
