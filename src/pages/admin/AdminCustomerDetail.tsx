import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, ArrowLeft, Users, Eye, MousePointerClick, UserPlus, Building2 } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

interface CompanyDetail {
  company: any;
  profiles: any[];
  cards: any[];
  members: any[];
  integrations: any[];
  stats: {
    total_leads: number;
    total_views: number;
    total_clicks: number;
    leads_this_month: number;
  };
}

export default function AdminCustomerDetail() {
  const { companyId } = useParams();
  const [data, setData] = useState<CompanyDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!companyId) return;
    const fetchDetail = async () => {
      try {
        const { data: result, error } = await supabase.rpc("get_admin_company_detail", {
          _company_id: companyId,
        });
        if (error) throw error;
        setData(result as unknown as CompanyDetail);
      } catch (err) {
        console.error("Error fetching company detail:", err);
        toast.error("Erro ao carregar detalhes da empresa.");
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [companyId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!data?.company) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Empresa não encontrada.</p>
        <Button asChild variant="outline" className="mt-4">
          <Link to="/admin/customers">← Voltar</Link>
        </Button>
      </div>
    );
  }

  const { company, profiles, cards, members, integrations, stats } = data;

  const statCards = [
    { label: "Total de Leads", value: stats.total_leads, icon: Users },
    { label: "Views de Perfil", value: stats.total_views, icon: Eye },
    { label: "Cliques em CTAs", value: stats.total_clicks, icon: MousePointerClick },
    { label: "Leads este Mês", value: stats.leads_this_month, icon: UserPlus },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <Button asChild variant="ghost" size="sm">
          <Link to="/admin/customers">
            <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
          </Link>
        </Button>
        <div className="flex items-center gap-4 flex-1">
          {company.logo_url ? (
            <img src={company.logo_url} alt="" className="h-12 w-12 rounded object-cover" />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded bg-muted">
              <Building2 className="h-6 w-6 text-muted-foreground" />
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold text-foreground">{company.name}</h1>
            {company.slug && <p className="text-sm text-muted-foreground">/{company.slug}</p>}
          </div>
          <Badge variant="secondary" className="ml-2">
            Criada em {new Date(company.created_at).toLocaleDateString("pt-BR")}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <s.icon className="h-6 w-6 text-primary" />
                <div>
                  <p className="text-xl font-bold text-foreground">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Tabs defaultValue="profiles">
        <TabsList>
          <TabsTrigger value="profiles">Perfis ({profiles.length})</TabsTrigger>
          <TabsTrigger value="cards">Cartões NFC ({cards.length})</TabsTrigger>
          <TabsTrigger value="members">Membros ({members.length})</TabsTrigger>
          <TabsTrigger value="integrations">Integrações ({integrations.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="profiles">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Cargo</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {profiles.map((p: any) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.name}</TableCell>
                      <TableCell className="text-muted-foreground">{p.role_title || "—"}</TableCell>
                      <TableCell>
                        <Badge variant={p.published ? "default" : "secondary"}>
                          {p.published ? "Publicado" : "Rascunho"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {profiles.length === 0 && (
                    <TableRow><TableCell colSpan={3} className="text-center py-6 text-muted-foreground">Nenhum perfil.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cards">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Label</TableHead>
                    <TableHead>UID</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cards.map((c: any) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.label}</TableCell>
                      <TableCell className="text-muted-foreground font-mono text-xs">{c.tag_uid}</TableCell>
                      <TableCell className="text-muted-foreground">{c.slug || "—"}</TableCell>
                      <TableCell>
                        <Badge variant={c.status === "active" ? "default" : "secondary"}>
                          {c.status === "active" ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {cards.length === 0 && (
                    <TableRow><TableCell colSpan={4} className="text-center py-6 text-muted-foreground">Nenhum cartão.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="members">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User ID</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Desde</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((m: any) => (
                    <TableRow key={m.id}>
                      <TableCell className="font-mono text-xs text-muted-foreground">{m.user_id}</TableCell>
                      <TableCell>
                        <Badge variant={m.role === "admin" ? "default" : "secondary"}>{m.role}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(m.created_at).toLocaleDateString("pt-BR")}
                      </TableCell>
                    </TableRow>
                  ))}
                  {members.length === 0 && (
                    <TableRow><TableCell colSpan={3} className="text-center py-6 text-muted-foreground">Nenhum membro.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>URL</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {integrations.map((ig: any) => (
                    <TableRow key={ig.id}>
                      <TableCell className="font-medium">{ig.type}</TableCell>
                      <TableCell>
                        <Badge variant={ig.active ? "default" : "secondary"}>
                          {ig.active ? "Ativa" : "Inativa"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground truncate max-w-[200px]">
                        {(ig.config as any)?.url || "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                  {integrations.length === 0 && (
                    <TableRow><TableCell colSpan={3} className="text-center py-6 text-muted-foreground">Nenhuma integração.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
