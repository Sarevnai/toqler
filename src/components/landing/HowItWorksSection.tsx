import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import dashboardPreview from "@/assets/dashboard-preview.png";

const steps = [
  { num: "01", title: "Crie sua conta", desc: "Registre sua empresa e configure seus dados em minutos." },
  { num: "02", title: "Monte os perfis", desc: "Adicione foto, cargo, bio e CTAs para cada colaborador." },
  { num: "03", title: "Vincule os cartões", desc: "Associe tags NFC aos perfis e distribua para a equipe." },
  { num: "04", title: "Meça resultados", desc: "Acompanhe visualizações, leads e ROI em tempo real." },
];

function AnimatedLine() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.8", "end 0.5"],
  });
  const scaleY = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <div ref={ref} className="hidden lg:block absolute top-0 bottom-0 left-7 w-0.5 bg-border">
      <motion.div
        className="w-full bg-primary origin-top"
        style={{ scaleY, height: "100%" }}
      />
    </div>
  );
}

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-20">
      <div className="container space-y-12">
        <div className="text-center space-y-4">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">Como funciona</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">Em 4 passos simples, sua equipe estará pronta para networking digital.</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Dashboard image */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            <div className="rounded-2xl overflow-hidden border border-border/50 shadow-xl">
              <img
                src={dashboardPreview}
                alt="Toqler Dashboard em operação"
                className="w-full h-auto object-cover"
                loading="lazy"
              />
            </div>
            <div className="absolute -z-10 -bottom-8 -right-8 h-48 w-48 rounded-full bg-primary/10 blur-3xl animate-glow-pulse" />
          </motion.div>

          {/* Steps */}
          <div className="relative space-y-8">
            <AnimatedLine />
            {steps.map((s, i) => (
              <motion.div
                key={s.num}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="flex gap-6 relative"
              >
                <motion.div
                  className="flex-shrink-0 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground text-lg font-bold z-10"
                  whileInView={{
                    boxShadow: [
                      "0 0 0 0 hsl(var(--primary) / 0.4)",
                      "0 0 0 12px hsl(var(--primary) / 0)",
                      "0 0 0 0 hsl(var(--primary) / 0)",
                    ],
                  }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15 + 0.3, duration: 0.8 }}
                >
                  {s.num}
                </motion.div>
                <div className="pt-2 space-y-2">
                  <h3 className="text-lg font-semibold text-foreground">{s.title}</h3>
                  <p className="text-sm text-muted-foreground">{s.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
