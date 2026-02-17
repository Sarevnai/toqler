// Format cents to BRL currency string
export function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}

// Convert BRL string input to cents
export function reaisToCents(reais: string): number {
  const num = parseFloat(reais.replace(",", "."));
  return Math.round(num * 100);
}

// Convert cents to reais string for input
export function centsToReais(cents: number): string {
  return (cents / 100).toFixed(2).replace(".", ",");
}

// Map feature_key to human-readable label
export const FEATURE_LABELS: Record<string, string> = {
  max_profiles: "Perfis",
  max_cards: "Cartões NFC",
  max_leads_month: "Leads/mês",
  max_members: "Membros",
  webhooks: "Webhooks",
  hide_branding: "Ocultar marca",
  custom_colors: "Cores personalizadas",
  csv_export: "Exportar CSV",
  analytics: "Analytics",
  priority_support: "Suporte prioritário",
  custom_domain: "Domínio personalizado",
};

export function formatFeature(key: string, value: string): string {
  const label = FEATURE_LABELS[key] || key;
  if (value === "true") return `${label} ✓`;
  if (value === "false") return `${label} ✗`;
  if (value === "unlimited") return `${label}: Ilimitado`;
  if (value === "basic") return `${label}: Básico`;
  if (value === "full") return `${label}: Completo`;
  return `${label}: ${value}`;
}

export const STATUS_COLORS: Record<string, string> = {
  trial: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  active: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  past_due: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  canceled: "bg-muted text-muted-foreground",
  suspended: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  paid: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  failed: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  refunded: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
};

export const STATUS_LABELS: Record<string, string> = {
  trial: "Trial",
  active: "Ativo",
  past_due: "Inadimplente",
  canceled: "Cancelado",
  suspended: "Suspenso",
  pending: "Pendente",
  paid: "Paga",
  failed: "Falhou",
  refunded: "Reembolsada",
};
