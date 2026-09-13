import { createFileRoute, Link } from "@tanstack/react-router";

const NotFoundPage = () => {
  return (
    <div className="mx-auto grid min-h-[70vh] max-w-175 place-items-center px-4 text-center">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-accent">Kurio</p>

        <h1 className="mt-3 font-display text-5xl font-bold">Página não encontrada</h1>

        <p className="mt-3 text-sm text-muted">O endereço acessado não corresponde a uma tela disponível.</p>

        <Link
          to="/"
          className="mt-6 inline-block rounded-control bg-accent px-5 py-3 text-xs font-bold text-accent-foreground"
        >
          Voltar ao início
        </Link>
      </div>
    </div>
  );
};

const Route = createFileRoute("/$")({ component: NotFoundPage });

export { Route };
