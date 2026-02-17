import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, Pencil, X } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { formatCurrency, formatFeature, FEATURE_LABELS } from "@/lib/billing-utils";
import type { Plan, PlanFeature } from "@/types/entities";

interface PlanWithFeatures extends Plan {
  features: PlanFeature[];
}

interface FeatureRow {
  feature_key: string;
  feature_value: string;
}

export default function AdminPlans() {
  const [plans, setPlans] = useState<PlanWithFeatures[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingPlan, setEditingPlan] = useState<PlanWithFeatures | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [priceMonthly, setPriceMonthly] = useState("");
  const [priceYearly, setPriceYearly] = useState("");
  const [trialDays, setTrialDays] = useState("14");
  const [isActive, setIsActive] = useState(true);
  const [sortOrder, setSortOrder] = useState("0");
  const [features, setFeatures] = useState<FeatureRow[]>([]);

  const fetchPlans = async () => {
    const { data: plansData } = await supabase
      .from("plans")
      .select("*")
      .order("sort_order");
    const { data: featuresData } = await supabase
      .from("plan_features")
      .select("*");

    if (plansData) {
      const mapped = plansData.map((p: any) => ({
        ...p,
        features: (featuresData || []).filter((f: any) => f.plan_id === p.id),
      }));
      setPlans(mapped);
    }
    setLoading(false);
  };

  useEffect(() => { fetchPlans(); }, []);

  const openCreate = () => {
    setEditingPlan(null);
    setName(""); setSlug(""); setDescription("");
    setPriceMonthly("0"); setPriceYearly("0");
    setTrialDays("14"); setIsActive(true); setSortOrder("0");
    setFeatures([]);
    setDialogOpen(true);
  };

  const openEdit = (plan: PlanWithFeatures) => {
    setEditingPlan(plan);
    setName(plan.name);
    setSlug(plan.slug);
    setDescription(plan.description || "");
    setPriceMonthly((plan.price_monthly / 100).toFixed(2));
    setPriceYearly((plan.price_yearly / 100).toFixed(2));
    setTrialDays(String(plan.trial_days ?? 14));
    setIsActive(plan.is_active ?? true);
    setSortOrder(String(plan.sort_order ?? 0));
    setFeatures(plan.features.map(f => ({ feature_key: f.feature_key, feature_value: f.feature_value })));
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const planData = {
        name,
        slug,
        description: description || null,
        price_monthly: Math.round(parseFloat(priceMonthly.replace(",", ".")) * 100),
        price_yearly: Math.round(parseFloat(priceYearly.replace(",", ".")) * 100),
        trial_days: parseInt(trialDays),
        is_active: isActive,
        sort_order: parseInt(sortOrder),
      };

      let planId: string;
      if (editingPlan) {
        const { error } = await supabase.from("plans").update(planData).eq("id", editingPlan.id);
        if (error) throw error;
        planId = editingPlan.id;
      } else {
        const { data, error } = await supabase.from("plans").insert(planData).select("id").single();
        if (error) throw error;
        planId = data.id;
      }

      // Upsert features: delete all then insert
      await supabase.from("plan_features").delete().eq("plan_id", planId);
      if (features.length > 0) {
        const { error } = await supabase.from("plan_features").insert(
          features.map(f => ({ plan_id: planId, feature_key: f.feature_key, feature_value: f.feature_value }))
        );
        if (error) throw error;
      }

      toast.success(editingPlan ? "Plano atualizado!" : "Plano criado!");
      setDialogOpen(false);
      fetchPlans();
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar plano.");
    } finally {
      setSaving(false);
    }
  };

  const addFeature = () => setFeatures([...features, { feature_key: "", feature_value: "" }]);
  const removeFeature = (i: number) => setFeatures(features.filter((_, idx) => idx !== i));
  const updateFeature = (i: number, field: "feature_key" | "feature_value", val: string) => {
    const updated = [...features];
    updated[i][field] = val;
    setFeatures(updated);
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Planos</h1>
          <p className="text-muted-foreground">Gerencie os planos disponíveis na plataforma</p>
        </div>
        <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" />Novo Plano</Button>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {plans.map((plan, i) => (
          <motion.div key={plan.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="h-full flex flex-col">
              <CardContent className="p-6 flex-1 flex flex-col">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-xl font-bold text-foreground">{plan.name}</h3>
                  <div className="flex gap-1">
                    {plan.is_default && <Badge variant="outline">Padrão</Badge>}
                    <Badge variant={plan.is_active ? "default" : "secondary"}>
                      {plan.is_active ? "Ativo" : "Inativo"}
                    </Badge>
                  </div>
                </div>
                <div className="mb-4">
                  <p className="text-2xl font-bold text-foreground">{formatCurrency(plan.price_monthly)}<span className="text-sm font-normal text-muted-foreground">/mês</span></p>
                  <p className="text-sm text-muted-foreground">{formatCurrency(plan.price_yearly)}/ano</p>
                </div>
                {plan.description && <p className="text-sm text-muted-foreground mb-4">{plan.description}</p>}
                <div className="flex-1 space-y-1 mb-4">
                  {plan.features.map(f => (
                    <p key={f.id} className="text-sm text-foreground">{formatFeature(f.feature_key, f.feature_value)}</p>
                  ))}
                </div>
                <Button variant="outline" size="sm" onClick={() => openEdit(plan)}>
                  <Pencil className="h-3.5 w-3.5 mr-1.5" />Editar
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPlan ? "Editar Plano" : "Novo Plano"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Nome</Label><Input value={name} onChange={e => setName(e.target.value)} /></div>
              <div><Label>Slug</Label><Input value={slug} onChange={e => setSlug(e.target.value)} disabled={!!editingPlan} /></div>
            </div>
            <div><Label>Descrição</Label><Textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Preço mensal (R$)</Label><Input value={priceMonthly} onChange={e => setPriceMonthly(e.target.value)} /></div>
              <div><Label>Preço anual (R$)</Label><Input value={priceYearly} onChange={e => setPriceYearly(e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Dias de trial</Label><Input type="number" value={trialDays} onChange={e => setTrialDays(e.target.value)} /></div>
              <div><Label>Ordem</Label><Input type="number" value={sortOrder} onChange={e => setSortOrder(e.target.value)} /></div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={isActive} onCheckedChange={setIsActive} />
              <Label>Ativo</Label>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Features</Label>
                <Button variant="ghost" size="sm" onClick={addFeature}><Plus className="h-3.5 w-3.5 mr-1" />Adicionar</Button>
              </div>
              {features.map((f, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <Select value={f.feature_key} onValueChange={v => updateFeature(i, "feature_key", v)}>
                    <SelectTrigger className="flex-1"><SelectValue placeholder="Feature" /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(FEATURE_LABELS).map(([k, l]) => (
                        <SelectItem key={k} value={k}>{l}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input className="flex-1" value={f.feature_value} onChange={e => updateFeature(i, "feature_value", e.target.value)} placeholder="Valor" />
                  <Button variant="ghost" size="icon" onClick={() => removeFeature(i)}><X className="h-4 w-4" /></Button>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving || !name || !slug}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
