

export function Footer() {
  return (
    <footer className="border-t border-border py-12">
      <div className="container flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="text-lg font-bold text-foreground">
          Greattings
        </div>
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} Greattings. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  );
}
