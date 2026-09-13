import { useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryClient";
import { getSessionToken } from "@/lib/session";
import { fetchSession, logout as logoutRequest } from "./api";

/* - Só consulta a sessão quando existe um token local; sem token, o usuário é sempre visitante. - */

const useSessionQuery = () => {
  const sessionToken = getSessionToken();
  return useQuery({
    queryKey: queryKeys.session.current(),
    queryFn: fetchSession,
    enabled: Boolean(sessionToken),
  });
};

/* - Encerra a sessão e limpa do cache tudo que é privado do usuário anterior, evitando vazamento de dados na troca de conta. - */

const useClearPrivateCaches = () => {
  const queryClient = useQueryClient();

  const clearPrivateCaches = () => {
    queryClient.removeQueries({ queryKey: queryKeys.session.current() });
    queryClient.removeQueries({ queryKey: queryKeys.profile.current() });
    queryClient.removeQueries({ queryKey: queryKeys.favorites.all() });
    queryClient.removeQueries({ queryKey: queryKeys.cart.all() });
    queryClient.removeQueries({ queryKey: queryKeys.wallets.all() });
  };

  return clearPrivateCaches;
};

const useLogout = () => {
  const clearPrivateCaches = useClearPrivateCaches();

  const logout = async () => {
    await logoutRequest();
    clearPrivateCaches();
  };

  return logout;
};

export { useSessionQuery, useClearPrivateCaches, useLogout };
