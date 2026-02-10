import { motion } from "framer-motion";

const steps = [
  { num: "01", title: "Crie sua conta", desc: "Registre sua empresa e configure seus dados em minutos." },
  { num: "02", title: "Monte os perfis", desc: "Adicione foto, cargo, bio e CTAs para cada colaborador." },
  { num: "03", title: "Vincule os cartões", desc: "Associe tags NFC aos perfis e distribua para a equipe." },
  { num: "04", title: "Meça resultados", desc: "Acompanhe visualizações, leads e ROI em tempo real." },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-20">
      <div className="container space-y-12">
        <div className="text-center space-y-4">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">Como funciona</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">Em 4 passos simples, sua equipe estará pronta para networking digital.</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((s, i) => (
            <motion.div
              key={s.num}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="text-center space-y-4"
            >
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground text-lg font-bold">
                {s.num}
              </div>
              <h3 className="text-lg font-semibold text-foreground">{s.title}</h3>
              <p className="text-sm text-muted-foreground">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
