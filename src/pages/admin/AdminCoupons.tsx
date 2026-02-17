import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Loader2, Plus, MoreHorizontal } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/dashboard/ConfirmDialog";
import type { Coupon } from "@/types/entities";

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Form
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [discountType, setDiscountType] = useState("percent");
  const [discountValue, setDiscountValue] = useState("");
  const [maxUses, setMaxUses] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [isActive, setIsActive] = useState(true);

  const fetchCoupons = async () => {
    const { data } = await supabase.from("coupons").select("*").order("created_at", { ascending: false });
    setCoupons((data || []) as unknown as Coupon[]);
    setLoading(false);
  };

  useEffect(() => { fetchCoupons(); }, []);

  const openCreate = () => {
    setEditing(null);
    setCode(""); setDescription(""); setDiscountType("percent");
    setDiscountValue(""); setMaxUses(""); setValidUntil(""); setIsActive(true);
    setDialogOpen(true);
  };

  const openEdit = (c: Coupon) => {
    setEditing(c);
    setCode(c.code);
    setDescription(c.description || "");
    setDiscountType(c.discount_type);
    setDiscountValue(String(c.discount_value));
    setMaxUses(c.max_uses ? String(c.max_uses) : "");
    setValidUntil(c.valid_until ? c.valid_until.split("T")[0] : "");
    setIsActive(c.is_active ?? true);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const data: any = {
        code: code.toUpperCase(),
        description: description || null,
        discount_type: discountType,
        discount_value: parseInt(discountValue),
        max_uses: maxUses ? parseInt(maxUses) : null,
        valid_until: validUntil ? new Date(validUntil).toISOString() : null,
        is_active: isActive,
      };

      if (editing) {
        await supabase.from("coupons").update(data).eq("id", editing.id);
      } else {
        await supabase.from("coupons").insert(data);
      }
      toast.success(editing ? "Cupom atualizado!" : "Cupom criado!");
      setDialogOpen(false);
      fetchCoupons();
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar cupom.");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (c: Coupon) => {
    await supabase.from("coupons").update({ is_active: !c.is_active }).eq("id", c.id);
    toast.success(c.is_active ? "Cupom desativado." : "Cupom ativado.");
    fetchCoupons();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await supabase.from("coupons").delete().eq("id", deleteId);
    toast.success("Cupom excluído.");
    setDeleteId(null);
    fetchCoupons();
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Cupons</h1>
          <p className="text-muted-foreground">Gerencie cupons de desconto</p>
        </div>
        <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" />Novo Cupom</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Usos</TableHead>
                <TableHead>Válido até</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {coupons.map(c => (
                <TableRow key={c.id}>
                  <TableCell className="font-mono font-bold">{c.code}</TableCell>
                  <TableCell>{c.discount_type === "percent" ? "%" : "R$"}</TableCell>
                  <TableCell>{c.discount_type === "percent" ? `${c.discount_value}%` : `R$ ${(c.discount_value / 100).toFixed(2)}`}</TableCell>
                  <TableCell className="text-muted-foreground">{c.uses_count}{c.max_uses ? `/${c.max_uses}` : ""}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{c.valid_until ? new Date(c.valid_until).toLocaleDateString("pt-BR") : "—"}</TableCell>
                  <TableCell>
                    <Badge variant={c.is_active ? "default" : "secondary"}>
                      {c.is_active ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(c)}>Editar</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => toggleActive(c)}>{c.is_active ? "Desativar" : "Ativar"}</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => setDeleteId(c.id)}>Excluir</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {coupons.length === 0 && (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Nenhum cupom cadastrado.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Editar Cupom" : "Novo Cupom"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Código</Label><Input value={code} onChange={e => setCode(e.target.value.toUpperCase())} /></div>
            <div><Label>Descrição</Label><Input value={description} onChange={e => setDescription(e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tipo</Label>
                <Select value={discountType} onValueChange={setDiscountType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percent">Percentual (%)</SelectItem>
                    <SelectItem value="fixed">Valor fixo (R$)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Valor</Label><Input value={discountValue} onChange={e => setDiscountValue(e.target.value)} placeholder={discountType === "percent" ? "10" : "1000"} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Máx. usos (opcional)</Label><Input type="number" value={maxUses} onChange={e => setMaxUses(e.target.value)} /></div>
              <div><Label>Válido até (opcional)</Label><Input type="date" value={validUntil} onChange={e => setValidUntil(e.target.value)} /></div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={isActive} onCheckedChange={setIsActive} />
              <Label>Ativo</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving || !code || !discountValue}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Excluir cupom"
        description="Tem certeza que deseja excluir este cupom? Esta ação é irreversível."
        onConfirm={handleDelete}
      />
    </div>
  );
}
