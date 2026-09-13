import { Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { Heart, LogIn, Menu, Search, ShoppingCart, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { registerSessionExpiredHandler } from "@/lib/axios";
import { queryKeys } from "@/lib/queryClient";
import { getActiveIdentityId, getSessionToken, setSessionToken } from "@/lib/session";
import { realtimeClient } from "@/lib/socket";
import { useClearPrivateCaches, useLogout, useSessionQuery } from "@/features/authentication/hooks";
import { useCartQuery } from "@/features/cart/hooks";
import { Button } from "@/components/ui/Button";
import { AppFooter } from "@/components/layout/AppFooter";
import type { Cart, NFTUpdatedPayload } from "@/types";

interface PrimaryNavigationItem {
  label: string;
  href: string;
}

const primaryNavigationItems: PrimaryNavigationItem[] = [
  { label: "Início", href: "/" },
  { label: "Mercado", href: "/#catalogo" },
  { label: "Criadores", href: "/#criadores" },
  { label: "Aprenda", href: "/#aprenda" },
];

const AppShell = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const queryClient = useQueryClient();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const sessionToken = getSessionToken();
  const activeIdentityId = getActiveIdentityId();
  const sessionQuery = useSessionQuery();
  const cartQuery = useCartQuery();
  const clearPrivateCaches = useClearPrivateCaches();
  const logout = useLogout();

  useEffect(() => {
    registerSessionExpiredHandler(() => {
      setSessionToken(null);
      clearPrivateCaches();
      void navigate({ to: "/login", search: { redirect: `${window.location.pathname}${window.location.search}` } });
    });
  }, [clearPrivateCaches, navigate]);

  useEffect(() => {
    const realtimeSessionId = activeIdentityId;
    realtimeClient.connect(realtimeSessionId);

    const removeNftListener = realtimeClient.onResourceEvent<NFTUpdatedPayload>("nft.updated", (eventEnvelope) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.nfts.all });
      queryClient.setQueryData<Cart | undefined>(queryKeys.cart.all(), (currentCart) => {
        if (!currentCart) return currentCart;

        return {
          ...currentCart,
          items: currentCart.items.map((item) =>
            item.nftId === eventEnvelope.resourceId
              ? {
                  ...item,
                  unitPriceEth: eventEnvelope.payload.priceEth ?? item.unitPriceEth,
                  available: eventEnvelope.payload.availableQuantity === undefined
                    ? item.available
                    : eventEnvelope.payload.availableQuantity >= item.quantity,
                  maxQuantity: eventEnvelope.payload.availableQuantity === undefined
                    ? item.maxQuantity
                    : Math.min(10, eventEnvelope.payload.availableQuantity),
                }
              : item,
          ),
          updatedAt: new Date().toISOString(),
        };
      });
      void queryClient.invalidateQueries({ queryKey: queryKeys.cart.quoteAll() });
    });

    const removeReconnectListener = realtimeClient.onReconnect(() => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.nfts.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.cart.all() });
      void queryClient.invalidateQueries({ queryKey: ["orders"] });
    });

    return () => {
      removeNftListener();
      removeReconnectListener();
    };
  }, [activeIdentityId, queryClient]);

  useEffect(() => {
    if (!sessionQuery.data && sessionToken && sessionQuery.isFetched) {
      setSessionToken(null);
    }
  }, [sessionQuery.data, sessionQuery.isFetched, sessionToken]);

  const handleLogout = async () => {
    await logout();
    await navigate({ to: "/" });
    setIsMobileMenuOpen(false);
  };

  const authenticatedUser = sessionQuery.data?.user;
  const cartItemCount = cartQuery.data?.items.reduce((totalItemCount, cartItem) => totalItemCount + cartItem.quantity, 0) ?? 0;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-control focus:bg-accent focus:px-4 focus:py-2 focus:text-sm focus:text-accent-foreground"
      >
        Pular para o conteúdo
      </a>

      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur md:hidden">
        <div className="flex h-14 items-center justify-between px-5">
          <Link to="/" className="font-display text-lg font-bold tracking-[0.2em]" aria-label="KURIO">KURIO</Link>
          <button
            type="button"
            aria-label={isMobileMenuOpen ? "Fechar menu" : "Abrir menu"}
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-primary-menu"
            onClick={() => setIsMobileMenuOpen((currentState) => !currentState)}
            className="grid size-9 place-items-center rounded-control border border-border"
          >
            {isMobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
        {isMobileMenuOpen ? (
          <nav id="mobile-primary-menu" aria-label="Menu principal" className="border-t border-border bg-surface px-4 py-3">
            <div className="grid gap-1">
              {primaryNavigationItems.map((navigationItem) => (
                <a key={navigationItem.label} href={navigationItem.href} className="rounded-control p-3 hover:bg-surface-2" onClick={() => setIsMobileMenuOpen(false)}>
                  {navigationItem.label}
                </a>
              ))}
              <Link to="/profile" className="rounded-control p-3 hover:bg-surface-2" onClick={() => setIsMobileMenuOpen(false)}>Perfil</Link>
              {authenticatedUser ? (
                <button type="button" className="rounded-control p-3 text-left hover:bg-surface-2" onClick={() => void handleLogout()}>Sair</button>
              ) : (
                <Link to="/login" className="rounded-control p-3 hover:bg-surface-2" onClick={() => setIsMobileMenuOpen(false)}>Entrar</Link>
              )}
            </div>
          </nav>
        ) : null}
      </header>

      <header className="sticky top-0 z-30 hidden border-b border-border bg-background/95 backdrop-blur md:block">
        <div className="mx-auto flex h-16 max-w-300 items-center gap-8 px-4 md:px-6">
          <Link
            to="/"
            className="font-display text-xl font-bold tracking-[0.22em] text-foreground"
          >
            KURIO
          </Link>

          <nav className="hidden items-center gap-6 text-sm text-muted md:flex">
            {primaryNavigationItems.map((navigationItem) => (
              <a
                key={navigationItem.label}
                href={navigationItem.href}
                className={`border-b-2 border-transparent py-6 transition-colors hover:text-foreground ${(navigationItem.label === "Início" && pathname === "/") || (navigationItem.label === "Mercado" && (pathname === "/cart" || pathname === "/checkout" || pathname.startsWith("/nfts/"))) ? "border-accent text-accent" : ""}`}
              >
                {navigationItem.label}
              </a>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-3">
            <button
              type="button"
              aria-label="Buscar NFTs"
              className="grid size-9 place-items-center rounded-control text-muted transition-colors hover:text-foreground"
              onClick={() => void navigate({ to: "/" })}
            >
              <Search size={17} />
            </button>

            <Link
              to="/"
              search={{ favorites: "true" }}
              className="relative grid size-9 place-items-center text-muted transition-colors hover:text-foreground"
              aria-label="Favoritos"
            >
              <Heart size={17} />
            </Link>

            <Link
              to="/cart"
              className="relative grid size-9 place-items-center text-muted transition-colors hover:text-foreground"
              aria-label="Carrinho de NFTs"
            >
              <ShoppingCart size={17} />

              <span className="absolute right-0 top-0.5 grid min-w-4 place-items-center rounded-full bg-accent px-1 text-[9px] font-bold text-accent-foreground">
                {cartItemCount}
              </span>
            </Link>

            {authenticatedUser ? (
              <Button
                variant="ghost"
                className="hidden sm:inline-flex"
                onClick={() => void handleLogout()}
              >
                Sair
              </Button>
            ) : (
              <Link
                to="/login"
                className="hidden items-center gap-2 rounded-control bg-accent px-4 py-2 text-xs font-bold text-accent-foreground transition-colors hover:bg-accent-strong sm:inline-flex"
              >
                <LogIn size={14} />
                Entrar
              </Link>
            )}

          </div>
        </div>

      </header>

      <main
        id="main-content"
        tabIndex={-1}
        className="flex-1"
      >
        <Outlet />
      </main>

      {/* - O footer é renderizado uma única vez pelo shell para manter a mesma estrutura visual em todas as páginas desktop. As rotas não devem duplicar este bloco. - */}

      <div className="hidden w-full md:block">
        <AppFooter />
      </div>
    </div>
  );
};

export { AppShell };
