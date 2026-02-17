import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Check, X, Crown, Zap, Building2, Loader2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency, FEATURE_LABELS } from "@/lib/billing-utils";
import { getStripePriceId } from "@/lib/stripe-plans";
import { motion } from "framer-motion";
import { useSearchParams } from "react-router-dom";

interface PlanWithFeatures {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price_monthly: number;
  price_yearly: number;
  trial_days: number | null;
  sort_order: number | null;
  features: Record<string, string>;
}

const PLAN_ICONS: Record<string, typeof Crown> = {
  free: Zap,
  pro: Crown,
  business: Building2,
};

const FEATURE_ORDER = [
  "max_profiles",
  "max_cards",
  "max_leads_month",
  "max_members",
  "analytics",
  "custom_colors",
  "hide_branding",
  "csv_export",
  "webhooks",
  "priority_support",
  "custom_domain",
];

export default function DashboardPlans() {
  const { companyId } = useAuth();
  const [searchParams] = useSearchParams();
  const [plans, setPlans] = useState<PlanWithFeatures[]>([]);
  const [currentPlanSlug, setCurrentPlanSlug] = useState<string | null>(null);
  const [currentStatus, setCurrentStatus] = useState<string | null>(null);
  const [yearly, setYearly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);

  // Handle checkout result from URL params
  useEffect(() => {
    const checkout = searchParams.get("checkout");
    if (checkout === "success") {
      toast.success("Assinatura realizada com sucesso! Seu plano será atualizado em instantes.");
      // Trigger subscription check to sync
      supabase.functions.invoke("check-subscription").then(() => {
        // Refetch subscription data
        fetchSubscription();
      });
    } else if (checkout === "canceled") {
      toast.info("Checkout cancelado. Você pode tentar novamente quando quiser.");
    }
  }, [searchParams]);

  const fetchSubscription = async () => {
    if (!companyId) return;
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("status, plans(slug)")
      .eq("company_id", companyId)
      .maybeSingle();
    if (sub) {
      setCurrentPlanSlug((sub.plans as any)?.slug || null);
      setCurrentStatus(sub.status);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      const [plansRes, featuresRes] = await Promise.all([
        supabase.from("plans").select("*").eq("is_active", true).order("sort_order"),
        supabase.from("plan_features").select("*"),
      ]);

      if (plansRes.data && featuresRes.data) {
        const featureMap: Record<string, Record<string, string>> = {};
        featuresRes.data.forEach((f) => {
          if (!featureMap[f.plan_id]) featureMap[f.plan_id] = {};
          featureMap[f.plan_id][f.feature_key] = f.feature_value;
        });

        setPlans(
          plansRes.data.map((p) => ({
            ...p,
            features: featureMap[p.id] || {},
          }))
        );
      }

      await fetchSubscription();
      setLoading(false);
    };

    fetchData();
  }, [companyId]);

  const formatFeatureValue = (key: string, value: string | undefined) => {
    if (!value || value === "false") return null;
    if (value === "true") return true;
    if (value === "unlimited") return "Ilimitado";
    if (value === "basic") return "Básico";
    if (value === "full") return "Completo";
    return value;
  };

  const isCurrentPlan = (slug: string) => currentPlanSlug === slug;
  const isPaidPlan = currentPlanSlug && currentPlanSlug !== "free";

  const handleSelectPlan = async (plan: PlanWithFeatures) => {
    if (isCurrentPlan(plan.slug)) return;
    if (plan.slug === "free") {
      toast.info("Para fazer downgrade para o plano Free, gerencie sua assinatura.");
      return;
    }

    const cycle = yearly ? "yearly" : "monthly";
    const priceId = getStripePriceId(plan.slug, cycle as "monthly" | "yearly");
    if (!priceId) {
      toast.error("Preço não encontrado para este plano.");
      return;
    }

    setCheckoutLoading(plan.slug);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { priceId, planSlug: plan.slug, billingCycle: cycle },
      });

      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (err: any) {
      console.error("Checkout error:", err);
      toast.error("Erro ao iniciar checkout. Tente novamente.");
    } finally {
      setCheckoutLoading(null);
    }
  };

  const handleManageSubscription = async () => {
    setPortalLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      } else {
        throw new Error("No portal URL returned");
      }
    } catch (err: any) {
      console.error("Portal error:", err);
      toast.error("Erro ao abrir portal de gerenciamento. Verifique se você possui uma assinatura ativa.");
    } finally {
      setPortalLoading(false);
    }
  };

  const yearlySavings = (plan: PlanWithFeatures) => {
    if (plan.price_monthly === 0) return 0;
    return plan.price_monthly * 12 - plan.price_yearly;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Escolha seu plano</h1>
        <p className="text-muted-foreground max-w-lg mx-auto">
          Selecione o plano ideal para sua empresa. Todos incluem acesso à plataforma Toqler.
        </p>
      </div>

      {/* Billing toggle */}
      <div className="flex items-center justify-center gap-3">
        <Label htmlFor="billing-toggle" className={`text-sm font-medium ${!yearly ? "text-foreground" : "text-muted-foreground"}`}>
          Mensal
        </Label>
        <Switch id="billing-toggle" checked={yearly} onCheckedChange={setYearly} />
        <Label htmlFor="billing-toggle" className={`text-sm font-medium ${yearly ? "text-foreground" : "text-muted-foreground"}`}>
          Anual
        </Label>
        {yearly && (
          <Badge variant="secondary" className="ml-1 text-xs">
            Economize até 20%
          </Badge>
        )}
      </div>

      {/* Manage subscription button for paid users */}
      {isPaidPlan && (
        <div className="text-center">
          <Button variant="outline" onClick={handleManageSubscription} disabled={portalLoading}>
            {portalLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ExternalLink className="h-4 w-4 mr-2" />}
            Gerenciar assinatura
          </Button>
        </div>
      )}

      {/* Plan cards */}
      <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {plans.map((plan, i) => {
          const Icon = PLAN_ICONS[plan.slug] || Zap;
          const isCurrent = isCurrentPlan(plan.slug);
          const price = yearly ? plan.price_yearly : plan.price_monthly;
          const savings = yearlySavings(plan);
          const isPopular = plan.slug === "pro";
          const isCheckingOut = checkoutLoading === plan.slug;

          return (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className={`relative h-full flex flex-col ${isPopular ? "border-primary shadow-lg" : ""} ${isCurrent ? "ring-2 ring-primary" : ""}`}>
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground">Mais popular</Badge>
                  </div>
                )}
                {isCurrent && (
                  <div className="absolute -top-3 right-4">
                    <Badge variant="outline" className="bg-background">Plano atual</Badge>
                  </div>
                )}

                <CardHeader className="text-center pb-2 pt-6">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold text-card-foreground">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground">{plan.description}</p>
                </CardHeader>

                <CardContent className="flex-1 flex flex-col">
                  <div className="text-center mb-6">
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-4xl font-bold text-card-foreground">
                        {price === 0 ? "Grátis" : formatCurrency(yearly ? Math.round(price / 12) : price)}
                      </span>
                      {price > 0 && <span className="text-muted-foreground text-sm">/mês</span>}
                    </div>
                    {yearly && price > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatCurrency(price)}/ano
                        {savings > 0 && (
                          <span className="text-primary font-medium"> — economize {formatCurrency(savings)}</span>
                        )}
                      </p>
                    )}
                    {!yearly && plan.trial_days && plan.trial_days > 0 && price > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {plan.trial_days} dias grátis para testar
                      </p>
                    )}
                  </div>

                  <ul className="space-y-3 flex-1 mb-6">
                    {FEATURE_ORDER.map((key) => {
                      const value = plan.features[key];
                      const formatted = formatFeatureValue(key, value);
                      const label = FEATURE_LABELS[key] || key;
                      const isIncluded = formatted !== null;

                      return (
                        <li key={key} className="flex items-start gap-2 text-sm">
                          {isIncluded ? (
                            <Check className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                          ) : (
                            <X className="h-4 w-4 mt-0.5 text-muted-foreground/40 shrink-0" />
                          )}
                          <span className={isIncluded ? "text-card-foreground" : "text-muted-foreground/50"}>
                            {typeof formatted === "string" ? `${label}: ${formatted}` : label}
                          </span>
                        </li>
                      );
                    })}
                  </ul>

                  <Button
                    className="w-full"
                    variant={isCurrent ? "outline" : isPopular ? "default" : "outline"}
                    disabled={isCurrent || isCheckingOut || !!checkoutLoading}
                    onClick={() => handleSelectPlan(plan)}
                  >
                    {isCheckingOut ? (
                      <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Processando...</>
                    ) : isCurrent ? (
                      currentStatus === "trial" ? "Em trial" : "Plano atual"
                    ) : plan.price_monthly === 0 ? (
                      "Começar grátis"
                    ) : (
                      "Assinar agora"
                    )}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <div className="text-center text-sm text-muted-foreground max-w-lg mx-auto space-y-1">
        <p>Precisa de um plano personalizado? <button className="text-primary underline" onClick={() => toast.info("Entre em contato pelo suporte!")}>Fale conosco</button></p>
        <p>Você pode mudar ou cancelar seu plano a qualquer momento.</p>
      </div>
    </div>
  );
}
