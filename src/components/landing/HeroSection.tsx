import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Leaf, BarChart3 } from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import dashboardPreview from "@/assets/dashboard-preview.png";
import { useIsMobile } from "@/hooks/use-mobile";
import { ParticleCanvas } from "./ParticleCanvas";
import { AnimatedCounter } from "./AnimatedCounter";
import { ScrollIndicator } from "./ScrollIndicator";

const stats = [
  { icon: Sparkles, value: "10x", label: "mais memorável" },
  { icon: Leaf, value: "0%", label: "desperdício" },
  { icon: BarChart3, value: "100%", label: "mensurável" },
];

const titleWords = ["Seus", "cartões", "de", "visita,", "agora"];
const highlightWords = ["digitais", "e", "mensuráveis"];

export function HeroSection() {
  const isMobile = useIsMobile();
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });
  const mockupY = useTransform(scrollYProgress, [0, 1], [0, 80]);

  return (
    <section ref={sectionRef} className="relative pt-32 pb-20 overflow-hidden">
      {/* Particle background */}
      {!isMobile && (
        <div className="absolute inset-0 -z-10 opacity-60">
          <ParticleCanvas />
        </div>
      )}

      <div className="container">
        <div className="flex flex-col items-center text-center space-y-8 max-w-4xl mx-auto">
          {/* Floating badge */}
          <motion.div
            className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm text-primary animate-float"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Sparkles className="h-3.5 w-3.5" />
            Networking inteligente com NFC
          </motion.div>

          {/* Staggered title */}
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-foreground leading-[1.1]">
            {titleWords.map((word, i) => (
              <motion.span
                key={i}
                className="inline-block mr-[0.3em]"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 + i * 0.08 }}
              >
                {word}
              </motion.span>
            ))}{" "}
            <span className="text-primary">
              {highlightWords.map((word, i) => (
                <motion.span
                  key={i}
                  className="inline-block mr-[0.3em]"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.3 + (titleWords.length + i) * 0.08 }}
                >
                  {word}
                </motion.span>
              ))}
            </span>
          </h1>

          <motion.p
            className="text-lg md:text-xl text-muted-foreground max-w-2xl"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.9 }}
          >
            Transforme interações presenciais em dados acionáveis. Crie perfis digitais, capture leads automaticamente e meça o ROI de cada contato.
          </motion.p>

          {/* CTA buttons */}
          <motion.div
            className="flex flex-wrap justify-center gap-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 1.0 }}
          >
            <Link to="/auth?tab=signup">
              <Button variant="default" size="lg" className="gap-2 relative overflow-hidden group">
                Começar agora <ArrowRight className="h-4 w-4" />
                <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-primary-foreground/20 to-transparent animate-shimmer pointer-events-none" />
              </Button>
            </Link>
            <a href="#how-it-works">
              <Button variant="outline" size="lg">Ver como funciona</Button>
            </a>
          </motion.div>
        </div>

        {/* Dashboard mockup with 3D perspective */}
        <motion.div
          className="mt-16 max-w-5xl mx-auto"
          initial={{ opacity: 0, scale: 0.9, rotateX: 8 }}
          animate={{ opacity: 1, scale: 1, rotateX: 0 }}
          transition={{ duration: 0.8, delay: 1.1, ease: "easeOut" }}
          style={{ 
            y: isMobile ? 0 : mockupY,
            perspective: "1200px",
          }}
        >
          <div 
            className="relative rounded-2xl overflow-hidden border border-border/50 shadow-2xl"
            style={{ transformStyle: "preserve-3d" }}
          >
            <img
              src={dashboardPreview}
              alt="Toqler Dashboard - Gestão de cartões digitais NFC"
              className="w-full h-auto object-cover"
              loading="eager"
            />
            {/* Gradient overlay at bottom */}
            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background to-transparent" />
          </div>
          {/* Glow blobs */}
          <div className="absolute -z-10 -top-12 left-1/2 -translate-x-1/2 h-72 w-72 rounded-full bg-primary/10 blur-3xl animate-glow-pulse" />
          <div className="absolute -z-10 -bottom-12 left-1/4 h-48 w-48 rounded-full bg-accent/20 blur-3xl animate-glow-pulse [animation-delay:2s]" />
        </motion.div>

        {/* Animated counters */}
        <motion.div
          className="flex flex-wrap justify-center gap-8 md:gap-12 pt-12 max-w-3xl mx-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 1.3 }}
        >
          {stats.map((s) => (
            <div key={s.label} className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <s.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xl font-bold text-foreground">
                  <AnimatedCounter value={s.value} />
                </p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </div>
          ))}
        </motion.div>
      </div>

      <ScrollIndicator />
    </section>
  );
}
