const sessionTokenStorageKey = "kurio-session-token";
const guestIdStorageKey = "kurio-guest-id";

const getSessionToken = (): string | null => {
  return localStorage.getItem(sessionTokenStorageKey);
};

const setSessionToken = (sessionToken: string | null) => {
  if (sessionToken) {
    localStorage.setItem(sessionTokenStorageKey, sessionToken);
    return;
  }

  localStorage.removeItem(sessionTokenStorageKey);
};

/* - O identificador mantém o carrinho do visitante entre refreshes até a autenticação. - */

const getGuestId = (): string => {
  const storedGuestId = localStorage.getItem(guestIdStorageKey);
  if (storedGuestId) {
    return storedGuestId;
  }

  const generatedGuestId = `guest_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
  localStorage.setItem(guestIdStorageKey, generatedGuestId);

  return generatedGuestId;
};

/* - Identificador estável da identidade atual (token autenticado ou id de visitante). Usado para "carimbar" as chaves de cache privado: como o identificador muda a cada login/logout, dados de uma identidade nunca aparecem sob a chave de outra, mesmo que a limpeza explícita de cache falhe em algum caminho de navegação. - */

const getActiveIdentityId = (): string => {
  return getSessionToken() ?? `guest:${getGuestId()}`;
};

/* - Mesma identidade usada nas chaves de cache, porém agora para a conexão Socket.IO. Isso garante que toda a aplicação identifique a sessão em tempo real da mesma forma, evitando reconexões acidentais por uso de um identificador diferente em cada tela. -*/

const getRealtimeSessionId = (): string => getActiveIdentityId();

export { getSessionToken, setSessionToken, getGuestId, getActiveIdentityId, getRealtimeSessionId };
