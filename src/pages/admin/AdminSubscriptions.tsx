import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Loader2, DollarSign, TrendingUp, UserCheck, Clock, UserX, MoreHorizontal, Building2 } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { formatCurrency, STATUS_COLORS, STATUS_LABELS } from "@/lib/billing-utils";
import type { BillingKpis, AdminSubscription, Plan } from "@/types/entities";

export default function AdminSubscriptions() {
  const navigate = useNavigate();
  const [kpis, setKpis] = useState<BillingKpis | null>(null);
  const [subs, setSubs] = useState<AdminSubscription[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [planFilter, setPlanFilter] = useState("");
  const [page, setPage] = useState(0);

  // Action dialog
  const [actionDialog, setActionDialog] = useState<{ type: string; sub: AdminSubscription } | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const [kpiRes, subsRes, plansRes] = await Promise.all([
      supabase.rpc("get_admin_billing_kpis"),
      supabase.rpc("get_admin_subscriptions", {
        _status: statusFilter,
        _plan_slug: planFilter,
        _search: search,
        _limit: 20,
        _offset: page * 20,
      }),
      supabase.from("plans").select("*").order("sort_order"),
    ]);

    if (kpiRes.data) setKpis(kpiRes.data as unknown as BillingKpis);
    if (subsRes.data) {
      const d = subsRes.data as any;
      setSubs(d.data || []);
      setTotal(d.total || 0);
    }
    if (plansRes.data) setPlans(plansRes.data as unknown as Plan[]);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [search, statusFilter, planFilter, page]);

  const handleAction = async () => {
    if (!actionDialog) return;
    setActionLoading(true);
    try {
      const { type, sub } = actionDialog;
      if (type === "change_plan" && selectedPlanId) {
        await supabase.from("subscriptions").update({ plan_id: selectedPlanId }).eq("id", sub.id);
        await supabase.from("subscription_events").insert({
          subscription_id: sub.id,
          event_type: "plan_changed",
          old_plan_id: sub.plan.id,
          new_plan_id: selectedPlanId,
        });
        toast.success("Plano alterado!");
      } else if (type === "cancel") {
        await supabase.from("subscriptions").update({ status: "canceled", canceled_at: new Date().toISOString() }).eq("id", sub.id);
        await supabase.from("subscription_events").insert({ subscription_id: sub.id, event_type: "canceled" });
        toast.success("Assinatura cancelada.");
      } else if (type === "suspend") {
        await supabase.from("subscriptions").update({ status: "suspended" }).eq("id", sub.id);
        await supabase.from("subscription_events").insert({ subscription_id: sub.id, event_type: "suspended" });
        toast.success("Assinatura suspensa.");
      } else if (type === "reactivate") {
        await supabase.from("subscriptions").update({ status: "active", canceled_at: null }).eq("id", sub.id);
        await supabase.from("subscription_events").insert({ subscription_id: sub.id, event_type: "reactivated" });
        toast.success("Assinatura reativada.");
      }
      setActionDialog(null);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Erro na ação.");
    } finally {
      setActionLoading(false);
    }
  };

  const kpiCards = kpis ? [
    { label: "MRR", value: formatCurrency(kpis.mrr), icon: DollarSign, cls: "text-green-600" },
    { label: "ARR", value: formatCurrency(kpis.arr), icon: TrendingUp, cls: "text-blue-600" },
    { label: "Pagantes", value: kpis.total_paying, icon: UserCheck, cls: "text-green-600" },
    { label: "Em Trial", value: kpis.total_trial, icon: Clock, cls: "text-yellow-600" },
    { label: "Cancelados", value: kpis.total_canceled, icon: UserX, cls: "text-red-600" },
  ] : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Assinaturas</h1>
        <p className="text-muted-foreground">Gestão de assinaturas e métricas financeiras</p>
      </div>

      {kpis && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {kpiCards.map((k, i) => (
            <motion.div key={k.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <k.icon className={`h-5 w-5 ${k.cls}`} />
                  <div>
                    <p className="text-lg font-bold text-foreground">{k.value}</p>
                    <p className="text-xs text-muted-foreground">{k.label}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <Input placeholder="Buscar empresa..." className="max-w-xs" value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} />
        <Select value={statusFilter} onValueChange={v => { setStatusFilter(v === "all" ? "" : v); setPage(0); }}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="trial">Trial</SelectItem>
            <SelectItem value="active">Ativo</SelectItem>
            <SelectItem value="past_due">Inadimplente</SelectItem>
            <SelectItem value="canceled">Cancelado</SelectItem>
            <SelectItem value="suspended">Suspenso</SelectItem>
          </SelectContent>
        </Select>
        <Select value={planFilter} onValueChange={v => { setPlanFilter(v === "all" ? "" : v); setPage(0); }}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Plano" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {plans.map(p => <SelectItem key={p.slug} value={p.slug}>{p.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ciclo</TableHead>
                  <TableHead>Período</TableHead>
                  <TableHead>Criada</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subs.map(s => (
                  <TableRow key={s.id} className="cursor-pointer" onClick={() => navigate(`/admin/customers/${s.company.id}`)}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {s.company.logo_url ? (
                          <img src={s.company.logo_url} className="h-6 w-6 rounded object-cover" alt="" />
                        ) : (
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span className="font-medium">{s.company.name}</span>
                      </div>
                    </TableCell>
                    <TableCell><Badge variant="outline">{s.plan.name}</Badge></TableCell>
                    <TableCell>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[s.status] || ""}`}>
                        {STATUS_LABELS[s.status] || s.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm capitalize">{s.billing_cycle === "monthly" ? "Mensal" : "Anual"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(s.current_period_start).toLocaleDateString("pt-BR")} → {new Date(s.current_period_end).toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{new Date(s.created_at).toLocaleDateString("pt-BR")}</TableCell>
                    <TableCell onClick={e => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => { setSelectedPlanId(""); setActionDialog({ type: "change_plan", sub: s }); }}>Mudar plano</DropdownMenuItem>
                          {s.status !== "canceled" && <DropdownMenuItem onClick={() => setActionDialog({ type: "cancel", sub: s })}>Cancelar</DropdownMenuItem>}
                          {s.status !== "suspended" && s.status !== "canceled" && <DropdownMenuItem onClick={() => setActionDialog({ type: "suspend", sub: s })}>Suspender</DropdownMenuItem>}
                          {(s.status === "canceled" || s.status === "suspended") && <DropdownMenuItem onClick={() => setActionDialog({ type: "reactivate", sub: s })}>Reativar</DropdownMenuItem>}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
                {subs.length === 0 && (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Nenhuma assinatura encontrada.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {total > 20 && (
        <div className="flex justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>Anterior</Button>
          <span className="text-sm text-muted-foreground py-2">Página {page + 1} de {Math.ceil(total / 20)}</span>
          <Button variant="outline" size="sm" disabled={(page + 1) * 20 >= total} onClick={() => setPage(p => p + 1)}>Próxima</Button>
        </div>
      )}

      <Dialog open={!!actionDialog} onOpenChange={() => setActionDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionDialog?.type === "change_plan" && "Mudar Plano"}
              {actionDialog?.type === "cancel" && "Cancelar Assinatura"}
              {actionDialog?.type === "suspend" && "Suspender Assinatura"}
              {actionDialog?.type === "reactivate" && "Reativar Assinatura"}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {actionDialog?.type === "change_plan" ? (
              <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
                <SelectTrigger><SelectValue placeholder="Selecione o novo plano" /></SelectTrigger>
                <SelectContent>
                  {plans.filter(p => p.id !== actionDialog.sub.plan.id).map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name} — {formatCurrency(p.price_monthly)}/mês</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <p className="text-muted-foreground">
                Tem certeza que deseja {actionDialog?.type === "cancel" ? "cancelar" : actionDialog?.type === "suspend" ? "suspender" : "reativar"} a assinatura de <strong>{actionDialog?.sub.company.name}</strong>?
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog(null)}>Voltar</Button>
            <Button
              variant={actionDialog?.type === "reactivate" ? "default" : "destructive"}
              onClick={handleAction}
              disabled={actionLoading || (actionDialog?.type === "change_plan" && !selectedPlanId)}
            >
              {actionLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
