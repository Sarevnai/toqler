import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, Wifi } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-xl font-bold tracking-tight text-foreground">
          <Wifi className="h-6 w-6 text-primary" />
          Greattings
        </Link>

        <div className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Funcionalidades</a>
          <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Como funciona</a>
          <Link to="/auth">
            <Button variant="ghost" size="sm">Entrar</Button>
          </Link>
          <Link to="/auth?tab=signup">
            <Button variant="hero" size="sm">Começar agora</Button>
          </Link>
        </div>

        <button className="md:hidden" onClick={() => setOpen(!open)}>
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="md:hidden border-t border-border bg-background p-4 space-y-3"
          >
            <a href="#features" className="block text-sm text-muted-foreground" onClick={() => setOpen(false)}>Funcionalidades</a>
            <a href="#how-it-works" className="block text-sm text-muted-foreground" onClick={() => setOpen(false)}>Como funciona</a>
            <Link to="/auth" className="block"><Button variant="ghost" className="w-full">Entrar</Button></Link>
            <Link to="/auth?tab=signup" className="block"><Button variant="hero" className="w-full">Começar agora</Button></Link>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
