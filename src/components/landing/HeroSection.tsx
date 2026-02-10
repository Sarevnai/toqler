import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Leaf, BarChart3 } from "lucide-react";
import { motion } from "framer-motion";
import heroImage from "@/assets/hero-image.jpg";

const stats = [
  { icon: Sparkles, value: "10x", label: "mais memorável" },
  { icon: Leaf, value: "0%", label: "desperdício" },
  { icon: BarChart3, value: "100%", label: "mensurável" },
];

export function HeroSection() {
  return (
    <section className="relative pt-32 pb-20 overflow-hidden">
      <div className="container">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-8"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              Networking inteligente com NFC
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-[1.1]">
              Seus cartões de visita, agora{" "}
              <span className="text-primary">digitais e mensuráveis</span>
            </h1>

            <p className="text-lg text-muted-foreground max-w-lg">
              Transforme interações presenciais em dados acionáveis. Crie perfis digitais, capture leads automaticamente e meça o ROI de cada contato.
            </p>

            <div className="flex flex-wrap gap-4">
              <Link to="/auth?tab=signup">
                <Button variant="hero" size="lg" className="gap-2">
                  Começar agora <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <a href="#how-it-works">
                <Button variant="hero-outline" size="lg">Ver como funciona</Button>
              </a>
            </div>

            <div className="flex flex-wrap gap-8 pt-4">
              {stats.map((s) => (
                <div key={s.label} className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <s.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-foreground">{s.value}</p>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative hidden lg:block"
          >
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-border/50">
              <img
                src={heroImage}
                alt="Greattings - Cartões de visita digitais NFC"
                className="w-full h-auto object-cover"
                loading="eager"
              />
            </div>
            <div className="absolute -z-10 -top-8 -right-8 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
            <div className="absolute -z-10 -bottom-8 -left-8 h-48 w-48 rounded-full bg-accent/20 blur-3xl" />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
