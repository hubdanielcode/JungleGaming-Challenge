export const environmentConfig = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? "/api",
  socketUrl: import.meta.env.VITE_SOCKET_URL ?? "ws://localhost:5173",
  mocksEnabled: import.meta.env.VITE_ENABLE_MOCKS !== "false",
};
