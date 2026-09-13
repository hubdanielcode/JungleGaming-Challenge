import { Heart, Home, ScanLine, ShoppingCart, UserRound } from "lucide-react";
import { Link, useLocation } from "@tanstack/react-router";

const MobileBottomNav = () => {
  const { pathname, search } = useLocation();

  const isFavorites = pathname === "/" && search.favorites === "true";
  const iconClass = (active: boolean) => `grid size-11 place-items-center rounded-full transition-colors ${active ? "text-accent" : "text-muted"}`;

  return (
    <nav
      aria-label="Navegação mobile"
      className="fixed inset-x-0 bottom-0 z-50 h-24 rounded-t-3xl border-t border-border bg-surface px-6 pb-4 pt-4 md:hidden"
    >
      <div className="relative mx-auto grid h-full max-w-92 grid-cols-5 items-center">
        <Link
          to="/"
          aria-label="Início"
          className={iconClass(pathname === "/" && !isFavorites)}
        >
          <Home
            size={20}
            strokeWidth={2.4}
            fill={pathname === "/" && !isFavorites ? "currentColor" : "none"}
          />
        </Link>

        <Link
          to="/"
          search={{ favorites: "true" }}
          aria-label="Favoritos"
          className={iconClass(isFavorites)}
        >
          <Heart
            size={20}
            strokeWidth={2.4}
            fill={isFavorites ? "currentColor" : "none"}
          />
        </Link>

        <a
          href="#catalogo"
          aria-label="Explorar"
          className="relative grid h-full place-items-center"
        >
          <span className="absolute -top-7 grid size-14 place-items-center rounded-full border-2 border-background bg-accent text-accent-foreground shadow-lg">
            <ScanLine
              size={24}
              strokeWidth={1.8}
            />
          </span>
        </a>

        <Link
          to="/cart"
          aria-label="Carrinho"
          className={iconClass(pathname === "/cart")}
        >
          <ShoppingCart
            size={20}
            strokeWidth={2.4}
            fill={pathname === "/cart" ? "currentColor" : "none"}
          />
        </Link>

        <Link
          to="/profile"
          aria-label="Perfil"
          className={iconClass(pathname === "/profile" || pathname === "/wallets")}
        >
          <UserRound
            size={20}
            strokeWidth={2.4}
            fill={pathname === "/profile" || pathname === "/wallets" ? "currentColor" : "none"}
          />
        </Link>
      </div>
    </nav>
  );
};

export { MobileBottomNav };
