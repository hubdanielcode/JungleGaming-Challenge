const defaultSocketUrl = () => {
  if (typeof window !== "undefined") {
    return `${window.location.protocol === "https:" ? "wss" : "ws"}://${window.location.host}`;
  }

  return "ws://localhost:5173";
};

export const environmentConfig = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? "/api",
  /* - Em produção, o Socket.IO simulado usa a mesma origem publicada. Isso evita que o build deployado tente abrir ws://localhost:5173. - */
  socketUrl: import.meta.env.VITE_SOCKET_URL ?? defaultSocketUrl(),
  mocksEnabled: import.meta.env.VITE_ENABLE_MOCKS !== "false",
};
