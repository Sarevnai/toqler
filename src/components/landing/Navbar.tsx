import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

function NavLink({ href, children, onClick }: { href: string; children: React.ReactNode; onClick?: () => void }) {
  return (
    <a
      href={href}
      onClick={onClick}
      className="story-link text-sm text-muted-foreground hover:text-foreground transition-colors"
    >
      <span>{children}</span>
    </a>
  );
}

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/20 bg-background/60 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="text-xl font-bold tracking-tight text-foreground">
          Toqler
        </Link>

        <div className="hidden md:flex items-center gap-8">
          <NavLink href="#features">Funcionalidades</NavLink>
          <NavLink href="#how-it-works">Como funciona</NavLink>
          <Link to="/auth">
            <Button variant="ghost" size="sm">Entrar</Button>
          </Link>
          <Link to="/auth?tab=signup">
            <Button variant="default" size="sm">Começar agora</Button>
          </Link>
        </div>

        <button className="md:hidden" onClick={() => setOpen(!open)}>
          {open ? <X className="h-6 w-6 text-foreground" /> : <Menu className="h-6 w-6 text-foreground" />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="md:hidden border-t border-border/20 bg-background/95 backdrop-blur-xl p-4 space-y-3"
          >
            <a href="#features" className="block text-sm text-muted-foreground" onClick={() => setOpen(false)}>Funcionalidades</a>
            <a href="#how-it-works" className="block text-sm text-muted-foreground" onClick={() => setOpen(false)}>Como funciona</a>
            <Link to="/auth" className="block"><Button variant="ghost" className="w-full">Entrar</Button></Link>
            <Link to="/auth?tab=signup" className="block"><Button variant="default" className="w-full">Começar agora</Button></Link>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
