import { ArrowLeft } from "lucide-react";
import { Link } from "@tanstack/react-router";

const MobileCheckoutHeader = () => (
  <header className="flex h-14 items-center justify-center border-b border-border px-6 md:hidden">
    <Link
      to="/cart"
      aria-label="Voltar ao carrinho"
      className="absolute left-5 grid size-9 place-items-center rounded-full text-foreground"
    >
      <ArrowLeft size={18} />
    </Link>

    <h1 className="font-mono text-[14px] font-bold">Pagamento com carteira</h1>
  </header>
);

export { MobileCheckoutHeader };
