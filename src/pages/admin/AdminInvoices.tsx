import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Loader2, Plus, MoreHorizontal } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency, STATUS_COLORS, STATUS_LABELS } from "@/lib/billing-utils";

interface InvoiceRow {
  id: string;
  amount: number;
  status: string;
  due_date: string;
  paid_at: string | null;
  description: string | null;
  created_at: string;
  company_name: string;
  company_id: string;
}

export default function AdminInvoices() {
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Create form
  const [companies, setCompanies] = useState<{ id: string; name: string }[]>([]);
  const [selCompany, setSelCompany] = useState("");
  const [amount, setAmount] = useState("");
  const [desc, setDesc] = useState("");
  const [dueDate, setDueDate] = useState("");

  const fetchInvoices = async () => {
    setLoading(true);
    let query = supabase
      .from("invoices")
      .select("*, companies!inner(name)")
      .order("created_at", { ascending: false })
      .limit(100);

    if (statusFilter) query = query.eq("status", statusFilter);

    const { data } = await query;
    let rows = (data || []).map((d: any) => ({
      id: d.id,
      amount: d.amount,
      status: d.status,
      due_date: d.due_date,
      paid_at: d.paid_at,
      description: d.description,
      created_at: d.created_at,
      company_name: d.companies?.name || "",
      company_id: d.company_id,
    }));

    if (search) {
      rows = rows.filter(r => r.company_name.toLowerCase().includes(search.toLowerCase()));
    }
    setInvoices(rows);
    setLoading(false);
  };

  useEffect(() => { fetchInvoices(); }, [statusFilter, search]);

  const openCreate = async () => {
    const { data } = await supabase.from("companies").select("id, name").order("name");
    setCompanies(data || []);
    setSelCompany(""); setAmount(""); setDesc(""); setDueDate("");
    setCreateOpen(true);
  };

  const handleCreate = async () => {
    setSaving(true);
    try {
      const { error } = await supabase.from("invoices").insert({
        company_id: selCompany,
        amount: Math.round(parseFloat(amount.replace(",", ".")) * 100),
        description: desc || null,
        due_date: dueDate,
      });
      if (error) throw error;
      toast.success("Fatura criada!");
      setCreateOpen(false);
      fetchInvoices();
    } catch (err: any) {
      toast.error(err.message || "Erro ao criar fatura.");
    } finally {
      setSaving(false);
    }
  };

  const markPaid = async (id: string) => {
    await supabase.from("invoices").update({ status: "paid", paid_at: new Date().toISOString() }).eq("id", id);
    toast.success("Fatura marcada como paga.");
    fetchInvoices();
  };

  const cancelInvoice = async (id: string) => {
    await supabase.from("invoices").update({ status: "canceled" }).eq("id", id);
    toast.success("Fatura cancelada.");
    fetchInvoices();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Faturas</h1>
          <p className="text-muted-foreground">Gerencie faturas da plataforma</p>
        </div>
        <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" />Nova Fatura</Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <Input placeholder="Buscar empresa..." className="max-w-xs" value={search} onChange={e => setSearch(e.target.value)} />
        <Select value={statusFilter} onValueChange={v => setStatusFilter(v === "all" ? "" : v)}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="pending">Pendente</SelectItem>
            <SelectItem value="paid">Paga</SelectItem>
            <SelectItem value="failed">Falhou</SelectItem>
            <SelectItem value="refunded">Reembolsada</SelectItem>
            <SelectItem value="canceled">Cancelada</SelectItem>
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
                  <TableHead>#ID</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Pago em</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map(inv => (
                  <TableRow key={inv.id}>
                    <TableCell className="font-mono text-xs text-muted-foreground">{inv.id.slice(0, 8)}</TableCell>
                    <TableCell className="font-medium">{inv.company_name}</TableCell>
                    <TableCell>{formatCurrency(inv.amount)}</TableCell>
                    <TableCell>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[inv.status] || ""}`}>
                        {STATUS_LABELS[inv.status] || inv.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{new Date(inv.due_date).toLocaleDateString("pt-BR")}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{inv.paid_at ? new Date(inv.paid_at).toLocaleDateString("pt-BR") : "—"}</TableCell>
                    <TableCell>
                      {inv.status === "pending" && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => markPaid(inv.id)}>Marcar como paga</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => cancelInvoice(inv.id)}>Cancelar</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {invoices.length === 0 && (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Nenhuma fatura encontrada.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nova Fatura</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Empresa</Label>
              <Select value={selCompany} onValueChange={setSelCompany}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {companies.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Valor (R$)</Label><Input value={amount} onChange={e => setAmount(e.target.value)} placeholder="49,90" /></div>
            <div><Label>Descrição</Label><Input value={desc} onChange={e => setDesc(e.target.value)} /></div>
            <div><Label>Vencimento</Label><Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={saving || !selCompany || !amount || !dueDate}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Criar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
