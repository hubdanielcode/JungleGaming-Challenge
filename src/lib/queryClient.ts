import { QueryClient } from "@tanstack/react-query";
import { getActiveIdentityId } from "@/lib/session";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000,
      gcTime: 300000,
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        if (error instanceof Error && error.name === "ApiError") {
          return false;
        }

        return failureCount < 2;
      },
    },

    mutations: {
      retry: false,
    },
  },
});

/* - Chaves centralizadas mantêm consultas relacionadas ao mesmo recurso agrupadas no cache. Os recursos privados (carrinho, favoritos, perfil, carteiras, sessão) incluem a identidade ativa (token ou id de visitante) na própria chave. Isso isola os dados por usuário no nível do cache: uma troca de sessão sem logout explícito não pode reaproveitar dados da identidade anterior, porque a chave computada é outra. - */

const queryKeys = {
  nfts: {
    all: ["nfts"] as const,
    list: (filters: unknown) => ["nfts", "list", filters] as const,
    detail: (nftId: string) => ["nfts", "detail", nftId] as const,
  },

  favorites: {
    all: () => ["favorites", getActiveIdentityId()] as const,
  },

  cart: {
    all: () => ["cart", getActiveIdentityId()] as const,
    quoteAll: () => ["cart", getActiveIdentityId(), "quote"] as const,
    quote: (couponCode: string | null) => ["cart", getActiveIdentityId(), "quote", couponCode] as const,
  },

  session: {
    current: () => ["session", getActiveIdentityId()] as const,
  },

  profile: {
    current: () => ["profile", getActiveIdentityId()] as const,
  },

  wallets: {
    all: () => ["wallets", getActiveIdentityId()] as const,
  },

  orders: {
    detail: (orderId: string) => ["orders", getActiveIdentityId(), "detail", orderId] as const,
  },
} as const;

export { queryClient, queryKeys };
