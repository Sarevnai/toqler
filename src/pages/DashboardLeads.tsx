import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Search, Loader2, ChevronLeft, ChevronRight, Bell, Pencil } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { EditLeadDialog } from "@/components/dashboard/EditLeadDialog";
import type { LeadWithProfile } from "@/types/entities";

const PAGE_SIZE = 20;

export default function DashboardLeads() {
  const { companyId } = useAuth();
  const [leads, setLeads] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [profileFilter, setProfileFilter] = useState("all");
  const [periodFilter, setPeriodFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [editingLead, setEditingLead] = useState<LeadWithProfile | null>(null);

  const fetchLeads = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);

    let query = supabase
      .from("leads")
      .select("*, profiles(name)", { count: "exact" })
      .eq("company_id", companyId)
      .order("created_at", { ascending: false });

    if (profileFilter !== "all") {
      query = query.eq("profile_id", profileFilter);
    }

    if (periodFilter !== "all") {
      const days = parseInt(periodFilter);
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);
      query = query.gte("created_at", cutoff.toISOString());
    }

    if (search.trim()) {
      query = query.or(`name.ilike.%${search.trim()}%,email.ilike.%${search.trim()}%`);
    }

    query = query.range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    try {
      const { data, count, error } = await query;
      if (error) { console.error("Leads fetch error:", error); toast.error("Erro ao carregar leads."); }
      setLeads(data ?? []);
      setTotalCount(count ?? 0);
    } catch (err) {
      console.error("Leads fetch error:", err);
      toast.error("Erro ao carregar leads.");
    }
    setLoading(false);
  }, [companyId, profileFilter, periodFilter, search, page]);

  useEffect(() => {
    if (!companyId) return;
    supabase.from("profiles").select("id, name").eq("company_id", companyId).then(({ data }) => {
      setProfiles(data ?? []);
    });
  }, [companyId]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  // Reset page when filters change
  useEffect(() => { setPage(0); }, [search, profileFilter, periodFilter]);

  // Realtime subscription for new leads
  useEffect(() => {
    if (!companyId) return;

    const channel = supabase
      .channel("leads-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "leads",
          filter: `company_id=eq.${companyId}`,
        },
        (payload) => {
          toast.info("Novo lead recebido!", {
            description: `${(payload.new as any).name} - ${(payload.new as any).email}`,
            icon: <Bell className="h-4 w-4" />,
          });
          // Refresh the list if on first page
          if (page === 0) {
            fetchLeads();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [companyId, page, fetchLeads]);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const exportCSV = async () => {
    try {
      // Fetch all filtered leads for export (not just current page)
      let query = supabase
        .from("leads")
        .select("*, profiles(name)")
        .eq("company_id", companyId!)
        .order("created_at", { ascending: false });

      if (profileFilter !== "all") query = query.eq("profile_id", profileFilter);
      if (periodFilter !== "all") {
        const days = parseInt(periodFilter);
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - days);
        query = query.gte("created_at", cutoff.toISOString());
      }
      if (search.trim()) {
        query = query.or(`name.ilike.%${search.trim()}%,email.ilike.%${search.trim()}%`);
      }

      const { data: allLeads, error } = await query;
      if (error) { console.error("CSV export error:", error); toast.error("Erro ao exportar CSV."); return; }
      const filtered = allLeads ?? [];

    const bom = "\uFEFF";
    const header = "Nome,Email,Telefone,Perfil,Data\n";
    const rows = filtered.map((l: any) => `"${l.name}","${l.email}","${l.phone || ""}","${l.profiles?.name || ""}","${format(new Date(l.created_at), "dd/MM/yyyy")}"`).join("\n");
    const blob = new Blob([bom + header + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "leads.csv";
    a.click();
    URL.revokeObjectURL(url);
      toast.success("CSV exportado!");
    } catch (err) {
      console.error("CSV export error:", err);
      toast.error("Erro ao exportar CSV.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Leads</h1>
          <p className="text-muted-foreground">{totalCount} leads encontrados</p>
        </div>
        <Button onClick={exportCSV} variant="outline" className="gap-2"><Download className="h-4 w-4" />Exportar CSV</Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={profileFilter} onValueChange={setProfileFilter}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Perfil" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os perfis</SelectItem>
            {profiles.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={periodFilter} onValueChange={setPeriodFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Período" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todo período</SelectItem>
            <SelectItem value="7">7 dias</SelectItem>
            <SelectItem value="30">30 dias</SelectItem>
            <SelectItem value="90">90 dias</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : (
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="hidden md:table-cell">Telefone</TableHead>
                <TableHead className="hidden md:table-cell">Perfil</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="w-[60px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {leads.map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="font-medium">{l.name}</TableCell>
                  <TableCell>{l.email}</TableCell>
                  <TableCell className="hidden md:table-cell">{l.phone || "—"}</TableCell>
                  <TableCell className="hidden md:table-cell">{l.profiles?.name || "—"}</TableCell>
                  <TableCell>{format(new Date(l.created_at), "dd/MM/yyyy", { locale: ptBR })}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => setEditingLead(l)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {leads.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Nenhum lead encontrado</TableCell></TableRow>
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
              <p className="text-sm text-muted-foreground">
                Página {page + 1} de {totalPages}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)}>
                  <ChevronLeft className="h-4 w-4 mr-1" />Anterior
                </Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>
                  Próxima<ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      <EditLeadDialog
        lead={editingLead}
        open={!!editingLead}
        onOpenChange={(open) => { if (!open) setEditingLead(null); }}
        onSaved={fetchLeads}
      />
    </div>
  );
}
