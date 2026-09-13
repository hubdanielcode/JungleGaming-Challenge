import { apiClient } from "@/lib/axios";
import { getGuestId, setSessionToken } from "@/lib/session";
import type { LoginInput, RegisterInput, Session } from "@/types";

const login = async (loginInput: LoginInput): Promise<Session> => {
  const loginResponse = await apiClient.post<Session & { token: string }>("/auth/login", loginInput, {
    headers: { "x-guest-id": getGuestId() },
  });
  setSessionToken(loginResponse.data.token);

  return loginResponse.data;
};

const register = async (registerInput: RegisterInput): Promise<Session> => {
  const registerResponse = await apiClient.post<Session & { token: string }>("/auth/register", registerInput);
  setSessionToken(registerResponse.data.token);

  return registerResponse.data;
};

/* - Retorna null quando não há sessão válida, em vez de propagar o erro: a ausência de sessão é um estado normal (visitante), não uma falha. - */

const fetchSession = async (): Promise<Session | null> => {
  try {
    const sessionResponse = await apiClient.get<Session>("/session");

    return sessionResponse.data;
  } catch {
    return null;
  }
};

const logout = async (): Promise<void> => {
  await apiClient.post("/auth/logout").catch(() => undefined);
  setSessionToken(null);
};

export { login, register, fetchSession, logout };
