import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Leaf, BarChart3 } from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import heroImage from "@/assets/hero-image.jpg";
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
  const imageY = useTransform(scrollYProgress, [0, 1], [0, 60]);

  return (
    <section ref={sectionRef} className="relative pt-32 pb-20 overflow-hidden">
      {/* Particle background — desktop only */}
      {!isMobile && (
        <div className="absolute inset-0 -z-10">
          <ParticleCanvas />
        </div>
      )}

      <div className="container">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="space-y-8"
          >
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
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-[1.1]">
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
              className="text-lg text-muted-foreground max-w-lg"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.9 }}
            >
              Transforme interações presenciais em dados acionáveis. Crie perfis digitais, capture leads automaticamente e meça o ROI de cada contato.
            </motion.p>

            <motion.div
              className="flex flex-wrap gap-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 1.0 }}
            >
              <Link to="/auth?tab=signup">
                <Button variant="hero" size="lg" className="gap-2 relative overflow-hidden group">
                  Começar agora <ArrowRight className="h-4 w-4" />
                  {/* Shimmer effect */}
                  <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-primary-foreground/20 to-transparent animate-shimmer pointer-events-none" />
                </Button>
              </Link>
              <a href="#how-it-works">
                <Button variant="hero-outline" size="lg">Ver como funciona</Button>
              </a>
            </motion.div>

            {/* Animated counters */}
            <motion.div
              className="flex flex-wrap gap-8 pt-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 1.1 }}
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
          </motion.div>

          {/* Hero image with parallax */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            style={{ y: isMobile ? 0 : imageY }}
            className="relative hidden lg:block"
          >
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-border/50">
              <img
                src={heroImage}
                alt="Toqler - Cartões de visita digitais NFC"
                className="w-full h-auto object-cover"
                loading="eager"
              />
            </div>
            {/* Pulsing glow blobs */}
            <div className="absolute -z-10 -top-8 -right-8 h-64 w-64 rounded-full bg-primary/10 blur-3xl animate-glow-pulse" />
            <div className="absolute -z-10 -bottom-8 -left-8 h-48 w-48 rounded-full bg-accent/20 blur-3xl animate-glow-pulse [animation-delay:2s]" />
          </motion.div>
        </div>
      </div>

      <ScrollIndicator />
    </section>
  );
}
