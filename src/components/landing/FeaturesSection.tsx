import { Card, CardContent } from "@/components/ui/card";
import { CreditCard, User, BarChart3, Building2, Webhook, Shield } from "lucide-react";
import { motion } from "framer-motion";

const features = [
  { icon: CreditCard, title: "Gestão de Cartões", desc: "Vincule e gerencie cartões NFC para cada colaborador da empresa." },
  { icon: User, title: "Perfis Digitais", desc: "Crie perfis personalizados com foto, bio, CTAs e links sociais." },
  { icon: BarChart3, title: "Dashboards", desc: "Acompanhe visualizações, cliques e leads em tempo real." },
  { icon: Building2, title: "Multi-empresa", desc: "Gerencie múltiplas equipes com isolamento completo de dados." },
  { icon: Webhook, title: "Webhooks", desc: "Integre com seu CRM e ferramentas via webhooks e APIs." },
  { icon: Shield, title: "LGPD Compliant", desc: "Coleta de leads com consentimento explícito e dados protegidos." },
];

export function FeaturesSection() {
  return (
    <section id="features" className="py-20 bg-muted/30">
      <div className="container space-y-12">
        <div className="text-center space-y-4">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">Tudo que você precisa</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Uma plataforma completa para transformar networking presencial em resultados mensuráveis.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="h-full hover:shadow-md transition-shadow bg-card">
                <CardContent className="p-6 space-y-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                    <f.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-card-foreground">{f.title}</h3>
                  <p className="text-sm text-muted-foreground">{f.desc}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
