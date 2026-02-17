import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreditCard, User, Eye, MousePointerClick, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { toast } from "sonner";
import type { Profile, DashboardKpis, DailyChartPoint } from "@/types/entities";

export default function DashboardOverview() {
  const { companyId } = useAuth();
  const [kpis, setKpis] = useState<DashboardKpis>({ cards: 0, profiles: 0, views: 0, clicks: 0 });
  const [chartData, setChartData] = useState<DailyChartPoint[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);

  useEffect(() => {
    if (!companyId) return;

    const fetchData = async () => {
      try {
        const [kpiRes, chartRes, profilesRes] = await Promise.all([
          supabase.rpc("get_dashboard_kpis", { _company_id: companyId }),
          supabase.rpc("get_daily_chart", { _company_id: companyId }),
          supabase.from("profiles").select("*").eq("company_id", companyId),
        ]);

        if (kpiRes.error || chartRes.error) {
          console.error("Dashboard KPI/chart error:", kpiRes.error, chartRes.error);
          toast.error("Erro ao carregar dashboard. Tente novamente.");
        }

        if (kpiRes.data) setKpis(kpiRes.data as unknown as DashboardKpis);
        if (chartRes.data) setChartData(chartRes.data as unknown as DailyChartPoint[]);
        setProfiles(profilesRes.data ?? []);
      } catch (err) {
        console.error("Dashboard fetch error:", err);
        toast.error("Erro ao carregar dashboard. Tente novamente.");
      }
    };

    fetchData();
  }, [companyId]);

  const kpiCards = [
    { label: "Cartões Ativos", value: kpis.cards, icon: CreditCard, color: "text-primary" },
    { label: "Perfis Publicados", value: kpis.profiles, icon: User, color: "text-chart-2" },
    { label: "Visualizações", value: kpis.views, icon: Eye, color: "text-chart-3" },
    { label: "Cliques em CTAs", value: kpis.clicks, icon: MousePointerClick, color: "text-chart-4" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Visão geral da sua empresa</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((k, i) => (
          <motion.div key={k.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <Card>
              <CardContent className="p-5 flex items-center gap-4">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10`}>
                  <k.icon className={`h-5 w-5 ${k.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-card-foreground">{k.value}</p>
                  <p className="text-xs text-muted-foreground">{k.label}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Chart */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-card-foreground mb-4">Últimos 7 dias</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip />
                <Area type="monotone" dataKey="views" stackId="1" stroke="hsl(var(--chart-1))" fill="hsl(var(--chart-1))" fillOpacity={0.3} name="Visualizações" />
                <Area type="monotone" dataKey="clicks" stackId="2" stroke="hsl(var(--chart-3))" fill="hsl(var(--chart-3))" fillOpacity={0.3} name="Cliques" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Profiles grid */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">Meus Perfis</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {profiles.map((p) => (
            <Card key={p.id} className="overflow-hidden">
              <div className="aspect-[3/2] bg-muted flex items-center justify-center">
                {p.photo_url ? (
                  <img src={p.photo_url} alt={p.name} className="w-full h-full object-cover" />
                ) : (
                  <User className="h-12 w-12 text-muted-foreground" />
                )}
              </div>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-card-foreground">{p.name}</p>
                    {p.role_title && <p className="text-xs text-muted-foreground">{p.role_title}</p>}
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${p.published ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                    {p.published ? "Publicado" : "Rascunho"}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Link to={`/dashboard/profiles`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full">Editar</Button>
                  </Link>
                  {p.published && (
                    <a href={`/p/${p.id}`} target="_blank" rel="noopener noreferrer" className="flex-1">
                      <Button variant="secondary" size="sm" className="w-full">Ver</Button>
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
          <Link to="/dashboard/profiles">
            <Card className="h-full flex items-center justify-center min-h-[200px] border-dashed hover:border-primary/50 transition-colors cursor-pointer">
              <div className="text-center space-y-2 p-4">
                <Plus className="h-8 w-8 mx-auto text-muted-foreground" />
                <p className="text-sm font-medium text-muted-foreground">Criar Novo Perfil</p>
              </div>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
