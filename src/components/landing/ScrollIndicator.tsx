import { ChevronDown } from "lucide-react";

export function ScrollIndicator() {
  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 animate-scroll-bounce">
      <a href="#features" aria-label="Rolar para baixo">
        <ChevronDown className="h-6 w-6 text-muted-foreground" />
      </a>
    </div>
  );
}
