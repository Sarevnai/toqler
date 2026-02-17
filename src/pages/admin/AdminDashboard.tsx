import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Building2, User, CreditCard, Users, TrendingUp, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface KPIs {
  total_companies: number;
  total_profiles: number;
  total_cards: number;
  total_leads: number;
  total_leads_today: number;
  total_leads_month: number;
  active_cards: number;
  published_profiles: number;
  new_companies_month: number;
  new_companies_week: number;
}

interface GrowthPoint {
  month: string;
  companies: number;
  leads: number;
}

interface RecentCompany {
  id: string;
  name: string;
  created_at: string;
  leads_count: number;
}

export default function AdminDashboard() {
  const [kpis, setKpis] = useState<KPIs | null>(null);
  const [chart, setChart] = useState<GrowthPoint[]>([]);
  const [recentCompanies, setRecentCompanies] = useState<RecentCompany[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [kpiRes, chartRes, companiesRes] = await Promise.all([
          supabase.rpc("get_admin_kpis"),
          supabase.rpc("get_admin_growth_chart"),
          supabase.rpc("get_admin_companies", { _search: "", _limit: 5, _offset: 0 }),
        ]);

        if (kpiRes.error) throw kpiRes.error;
        if (chartRes.error) throw chartRes.error;
        if (companiesRes.error) throw companiesRes.error;

        setKpis(kpiRes.data as unknown as KPIs);
        setChart((chartRes.data as unknown as GrowthPoint[]) || []);
        const compData = companiesRes.data as unknown as { data: RecentCompany[] };
        setRecentCompanies(compData?.data || []);
      } catch (err) {
        console.error("Admin dashboard error:", err);
        toast.error("Erro ao carregar dados do painel admin.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const kpiCards = [
    { label: "Total de Empresas", value: kpis?.total_companies ?? 0, icon: Building2, color: "text-blue-500" },
    { label: "Perfis Publicados", value: kpis?.published_profiles ?? 0, icon: User, color: "text-green-500" },
    { label: "Cartões Ativos", value: kpis?.active_cards ?? 0, icon: CreditCard, color: "text-purple-500" },
    { label: "Leads do Mês", value: kpis?.total_leads_month ?? 0, icon: Users, color: "text-orange-500" },
    { label: "Novos esta Semana", value: kpis?.new_companies_week ?? 0, icon: TrendingUp, color: "text-teal-500" },
    { label: "Total de Leads", value: kpis?.total_leads ?? 0, icon: BarChart3, color: "text-pink-500" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
        <p className="text-muted-foreground">Visão geral da plataforma Toqler</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {kpiCards.map((kpi, i) => (
          <motion.div key={kpi.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <kpi.icon className={`h-8 w-8 ${kpi.color}`} />
                <div>
                  <p className="text-2xl font-bold text-foreground">{kpi.value}</p>
                  <p className="text-xs text-muted-foreground">{kpi.label}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Crescimento da Plataforma (6 meses)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chart}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="companies" name="Empresas" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="leads" name="Leads" fill="#22c55e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Empresas recentes</CardTitle>
            <Link to="/admin/customers" className="text-sm text-primary hover:underline">Ver todas →</Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentCompanies.map((c) => (
                <div key={c.id} className="flex items-center justify-between text-sm">
                  <div>
                    <p className="font-medium text-foreground">{c.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(c.created_at).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <span className="text-muted-foreground">{c.leads_count} leads</span>
                </div>
              ))}
              {recentCompanies.length === 0 && (
                <p className="text-sm text-muted-foreground">Nenhuma empresa encontrada.</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Resumo rápido</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="text-muted-foreground">
              <span className="font-medium text-foreground">{kpis?.total_leads_today ?? 0}</span> leads capturados hoje
            </p>
            <p className="text-muted-foreground">
              <span className="font-medium text-foreground">{kpis?.new_companies_month ?? 0}</span> novas empresas este mês
            </p>
            <p className="text-muted-foreground">
              <span className="font-medium text-foreground">{kpis?.total_cards ?? 0}</span> cartões NFC cadastrados
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
