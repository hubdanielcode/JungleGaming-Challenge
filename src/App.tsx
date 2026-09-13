import { RouterProvider, createRouter } from "@tanstack/react-router";
import { QueryClientProvider } from "@tanstack/react-query";
import { routeTree } from "./routeTree.gen";
import { queryClient } from "@/lib/queryClient";
import { Toaster } from "@/components/ui/Toaster";
import { NotFoundPage } from "@/components/common/NotFoundPage";
import { ScenarioResetButton } from "@/components/dev/ScenarioResetButton";

const router = createRouter({
  routeTree,
  defaultPreload: "intent",
  defaultNotFoundComponent: NotFoundPage,
});

/* - Sem este registro, Link/navigate aceitam qualquer string em "to" sem fazer checagem de tipo contra as rotas reais. - */

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <Toaster />
      <ScenarioResetButton />
    </QueryClientProvider>
  );
};

export default App;
