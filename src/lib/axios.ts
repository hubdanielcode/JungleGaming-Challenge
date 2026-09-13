import axios, { type AxiosError } from "axios";
import { ApiError, type ApiErrorBody } from "@/types";
import { getSessionToken } from "@/lib/session";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "/api",
  withCredentials: true,
  timeout: 15000,
});

/* - O callback permite que a sessão reaja a respostas 401 sem acoplar o cliente HTTP ao estado da interface. - */

let handleSessionExpired: (() => void) | null = null;

const registerSessionExpiredHandler = (handler: () => void) => {
  handleSessionExpired = handler;
};

apiClient.interceptors.request.use((requestConfig) => {
  const sessionToken = getSessionToken();

  if (sessionToken) {
    requestConfig.headers.Authorization = `Bearer ${sessionToken}`;
  }

  return requestConfig;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorBody>) => {
    if (!error.response) {
      return Promise.reject(
        new ApiError(0, {
          error: {
            code: "TRANSIENT_FAILURE",
            message: "Falha de conexão. Tente novamente.",
          },
        }),
      );
    }

    const apiErrorBody = error.response.data;
    const apiError = new ApiError(error.response.status, apiErrorBody);

    if (apiError.status === 401 || apiError.code === "SESSION_EXPIRED") {
      handleSessionExpired?.();
    }

    return Promise.reject(apiError);
  },
);

export { apiClient, registerSessionExpiredHandler };
