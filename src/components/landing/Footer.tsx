export function Footer() {
  return (
    <footer className="bg-[hsl(50,15%,4%)] py-12">
      <div className="container flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="text-lg font-bold text-[hsl(50,20%,98%)]">
          Toqler <span className="text-sm font-normal text-[hsl(50,20%,98%)]/60">by Greattings</span>
        </div>
        <p className="text-sm text-[hsl(50,20%,98%)]/60">
          © {new Date().getFullYear()} Toqler by Greattings. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  );
}
