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
    /* - Remove por recurso, sem depender da identidade já ter mudado no localStorage. Isso evita que logout/expiração apaguem apenas o cache do visitante e deixem dados da sessão anterior vivos. - */
    queryClient.removeQueries({ queryKey: ["session"] });
    queryClient.removeQueries({ queryKey: ["profile"] });
    queryClient.removeQueries({ queryKey: ["favorites"] });
    queryClient.removeQueries({ queryKey: ["cart"] });
    queryClient.removeQueries({ queryKey: ["wallets"] });
    queryClient.removeQueries({ queryKey: ["orders"] });
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
