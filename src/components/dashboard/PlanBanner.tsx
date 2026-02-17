import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { differenceInDays } from "date-fns";

interface SubInfo {
  status: string;
  plan_name: string;
  plan_slug: string;
  trial_end: string | null;
  current_period_end: string;
}

export default function PlanBanner() {
  const { companyId } = useAuth();
  const [sub, setSub] = useState<SubInfo | null>(null);

  useEffect(() => {
    if (!companyId) return;
    supabase
      .from("subscriptions")
      .select("status, trial_end, current_period_end, plans(name, slug)")
      .eq("company_id", companyId)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setSub({
            status: data.status,
            plan_name: (data.plans as any)?.name || "",
            plan_slug: (data.plans as any)?.slug || "",
            trial_end: data.trial_end,
            current_period_end: data.current_period_end,
          });
        }
      });
  }, [companyId]);

  if (!sub) return null;

  const { status, plan_name, plan_slug, trial_end } = sub;

  let bgClass = "";
  let text = "";
  let actionLabel = "";
  let actionFn = () => toast.info("Em breve!");

  if (plan_slug === "free" && status === "active") {
    bgClass = "bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800";
    text = "Você está no plano Free. Atualize para desbloquear mais recursos.";
    actionLabel = "Ver planos";
  } else if (status === "trial") {
    const daysLeft = trial_end ? differenceInDays(new Date(trial_end), new Date()) : 0;
    bgClass = "bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800";
    text = `Seu trial do plano ${plan_name} expira em ${Math.max(daysLeft, 0)} dias.`;
    actionLabel = "Assinar agora";
  } else if (status === "active" && plan_slug !== "free") {
    bgClass = "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800";
    text = `Plano ${plan_name}`;
    actionLabel = "";
  } else if (status === "past_due") {
    bgClass = "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800";
    text = "Seu pagamento está pendente. Regularize para evitar suspensão.";
    actionLabel = "Regularizar";
  } else if (status === "canceled" || status === "suspended") {
    bgClass = "bg-red-50 border-red-300 dark:bg-red-900/30 dark:border-red-800";
    text = `Sua assinatura foi ${status === "canceled" ? "cancelada" : "suspensa"}. Entre em contato.`;
    actionLabel = "Falar com suporte";
  } else {
    return null;
  }

  return (
    <div className={`flex items-center justify-between gap-4 rounded-lg border px-4 py-3 ${bgClass}`}>
      <p className="text-sm font-medium text-foreground">{text}</p>
      {actionLabel && (
        <Button variant="outline" size="sm" onClick={actionFn} className="shrink-0">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
