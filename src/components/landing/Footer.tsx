

export function Footer() {
  return (
    <footer className="border-t border-border py-12">
      <div className="container flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="text-lg font-bold text-foreground">
          Toqler <span className="text-sm font-normal text-muted-foreground">by Greattings</span>
        </div>
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} Toqler by Greattings. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  );
}
