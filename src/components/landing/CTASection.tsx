import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export function CTASection() {
  return (
    <section className="py-20 relative overflow-hidden">
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />
      
      <div className="container text-center space-y-6 relative z-10">
        <motion.h2
          className="text-3xl md:text-4xl font-bold text-foreground"
          initial={{ opacity: 0, filter: "blur(8px)" }}
          whileInView={{ opacity: 1, filter: "blur(0px)" }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          Pronto para transformar seu networking?
        </motion.h2>
        <motion.p
          className="text-muted-foreground max-w-xl mx-auto"
          initial={{ opacity: 0, filter: "blur(6px)" }}
          whileInView={{ opacity: 1, filter: "blur(0px)" }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.15 }}
        >
          Comece gratuitamente e veja como cartões digitais NFC podem gerar mais leads para sua equipe.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Link to="/auth?tab=signup">
            <Button variant="hero" size="lg" className="gap-2 relative overflow-hidden">
              Criar conta grátis <ArrowRight className="h-4 w-4" />
              <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-primary-foreground/20 to-transparent animate-shimmer pointer-events-none" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
