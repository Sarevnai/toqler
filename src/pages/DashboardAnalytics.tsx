import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { Loader2 } from "lucide-react";

const COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

export default function DashboardAnalytics() {
  const { companyId } = useAuth();
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [ctaData, setCtaData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!companyId) return;
    const fetch = async () => {
      setLoading(true);
      const { data: events } = await supabase.from("events").select("*").eq("company_id", companyId);
      const allEvents = events ?? [];

      // Monthly data (last 6 months)
      const months: any[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const m = d.toISOString().slice(0, 7);
        months.push({
          month: d.toLocaleDateString("pt-BR", { month: "short" }),
          views: allEvents.filter((e) => e.event_type === "profile_view" && e.created_at?.startsWith(m)).length,
          leads: allEvents.filter((e) => e.event_type === "lead_submit" && e.created_at?.startsWith(m)).length,
        });
      }
      setMonthlyData(months);

      // CTA distribution
      const ctaClicks = allEvents.filter((e) => e.event_type === "cta_click");
      const ctaMap: Record<string, number> = {};
      ctaClicks.forEach((e) => {
        const type = e.cta_type || "outro";
        ctaMap[type] = (ctaMap[type] || 0) + 1;
      });
      const labelMap: Record<string, string> = { whatsapp: "WhatsApp", instagram: "Instagram", linkedin: "LinkedIn", website: "Website", save_contact: "Salvar Contato" };
      setCtaData(Object.entries(ctaMap).map(([k, v]) => ({ name: labelMap[k] || k, value: v })));
      setLoading(false);
    };
    fetch();
  }, [companyId]);

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
        <p className="text-muted-foreground">Métricas de desempenho da sua empresa</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-card-foreground mb-4">Visualizações e Leads (6 meses)</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip />
                  <Bar dataKey="views" fill="hsl(var(--chart-1))" name="Visualizações" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="leads" fill="hsl(var(--chart-3))" name="Leads" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-card-foreground mb-4">Distribuição de CTAs</h3>
            <div className="h-64">
              {ctaData.length === 0 ? (
                <p className="text-center text-muted-foreground py-16">Nenhum dado de CTA ainda</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={ctaData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {ctaData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Legend />
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
