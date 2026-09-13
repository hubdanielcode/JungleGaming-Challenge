import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { environmentConfig } from "@/lib/env";
import App from "./App";

/* - Pesos de fonte auto-hospedados via @fontsource, sem dependência de CDN externo em runtime. - */
import "./index.css";

const enableMockServer = async () => {
  if (!environmentConfig.mocksEnabled) {
    return;
  }

  const { worker } = await import("@/mocks/browser");

  await worker.start({
    onUnhandledRequest: "bypass",
    serviceWorker: { url: "/mockServiceWorker.js" },
  });
};

const bootstrapApplication = async () => {
  await enableMockServer();

  const applicationRoot = document.getElementById("root");

  if (!applicationRoot) {
    throw new Error("Elemento raiz da aplicação não foi encontrado.");
  }

  createRoot(applicationRoot).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
};

void bootstrapApplication();
