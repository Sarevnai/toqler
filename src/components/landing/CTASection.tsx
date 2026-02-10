import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export function CTASection() {
  return (
    <section className="py-20 bg-primary/5">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="container text-center space-y-6"
      >
        <h2 className="text-3xl md:text-4xl font-bold text-foreground">
          Pronto para transformar seu networking?
        </h2>
        <p className="text-muted-foreground max-w-xl mx-auto">
          Comece gratuitamente e veja como cartões digitais NFC podem gerar mais leads para sua equipe.
        </p>
        <Link to="/auth?tab=signup">
          <Button variant="hero" size="lg" className="gap-2">
            Criar conta grátis <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </motion.div>
    </section>
  );
}
