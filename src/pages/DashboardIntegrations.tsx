import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search } from "lucide-react";
import { motion } from "framer-motion";

const integrations = [
  { name: "Salesforce", cat: "CRM", desc: "Sincronize leads automaticamente" },
  { name: "HubSpot", cat: "CRM", desc: "Integração nativa com HubSpot CRM" },
  { name: "Pipedrive", cat: "CRM", desc: "Envie leads direto para o Pipedrive" },
  { name: "RD Station", cat: "CRM", desc: "Conecte com RD Station Marketing" },
  { name: "Google Sheets", cat: "Exportação", desc: "Exporte leads para planilhas" },
  { name: "Webhook", cat: "Exportação", desc: "Envie dados via webhook customizado" },
  { name: "Zapier", cat: "Automação", desc: "Conecte com milhares de apps" },
  { name: "Make", cat: "Automação", desc: "Automações avançadas com Make" },
  { name: "Slack", cat: "Notificações", desc: "Notificações em tempo real" },
  { name: "Mailchimp", cat: "Email", desc: "Adicione leads às suas listas" },
  { name: "Outlook", cat: "Email", desc: "Integração com Microsoft 365" },
  { name: "Google Calendar", cat: "Calendário", desc: "Agende reuniões automaticamente" },
];

const categories = ["Todos", "CRM", "Exportação", "Automação", "Notificações", "Email", "Calendário"];

export default function DashboardIntegrations() {
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("Todos");

  const filtered = integrations.filter((i) => {
    const matchSearch = i.name.toLowerCase().includes(search.toLowerCase());
    const matchTab = tab === "Todos" || i.cat === tab;
    return matchSearch && matchTab;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Integrações</h1>
        <p className="text-muted-foreground">Conecte com suas ferramentas favoritas</p>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Buscar integração..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex flex-wrap h-auto gap-1">
          {categories.map((c) => <TabsTrigger key={c} value={c} className="text-xs">{c}</TabsTrigger>)}
        </TabsList>
      </Tabs>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((i, idx) => (
          <motion.div key={i.name} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}>
            <Card className="h-full">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-card-foreground">{i.name}</h3>
                  <Badge variant="secondary" className="text-xs">Em breve</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{i.desc}</p>
                <p className="text-xs text-muted-foreground/60">{i.cat}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
