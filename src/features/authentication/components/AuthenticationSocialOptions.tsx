import { useToast } from "@/hooks/useToast";

/* - Botões de login social vistos no Figma (Google e Facebook). Autenticação social real está fora do escopo do desafio, então o clique nunca finge sucesso: apenas informa, via toast, que a opção não faz parte desta entrega — seguindo o mesmo padrão já usado no rodapé e no cabeçalho para links fora do escopo. - */

const AuthenticationSocialOptions = () => {
  const { showToast } = useToast();

  const handleUnavailableProviderClick = (providerName: string) => {
    showToast({
      title: "Login social indisponível",
      description: `A autenticação com ${providerName} não faz parte desta entrega.`,
    });
  };

  return (
    <div className="mt-7 grid gap-2.5 md:mt-5 md:gap-2">
      <div className="relative flex items-center justify-center text-[11px] text-foreground md:text-[9px]">
        <span className="absolute inset-x-0 top-1/2 h-px bg-border" />
        <span className="relative bg-surface px-3">Ou continue com</span>
      </div>

      <button
        type="button"
        onClick={() => handleUnavailableProviderClick("Google")}
        className="flex h-10 min-h-10 items-center justify-center gap-2 rounded-md border border-border bg-transparent px-3 text-[11px] text-muted transition-colors hover:border-accent hover:text-foreground md:h-9 md:min-h-9 md:rounded-[3px] md:text-[10px]"
      >
        <svg
          aria-hidden="true"
          width="16"
          height="16"
          viewBox="0 0 24 24"
        >
          <path
            fill="#4285F4"
            d="M23.49 12.27c0-.79-.07-1.54-.2-2.27H12v4.51h6.47a5.53 5.53 0 0 1-2.4 3.63v3h3.88c2.27-2.09 3.54-5.17 3.54-8.87Z"
          />

          <path
            fill="#34A853"
            d="M12 24c3.24 0 5.95-1.08 7.94-2.92l-3.88-3a7.15 7.15 0 0 1-10.62-3.76H1.45v3.09A12 12 0 0 0 12 24Z"
          />

          <path
            fill="#FBBC05"
            d="M5.44 14.32a7.2 7.2 0 0 1 0-4.64V6.59H1.45a12 12 0 0 0 0 10.82l3.99-3.09Z"
          />

          <path
            fill="#EA4335"
            d="M12 4.75c1.76 0 3.34.6 4.58 1.79l3.44-3.44C17.94 1.19 15.24 0 12 0A12 12 0 0 0 1.45 6.59l3.99 3.09A7.15 7.15 0 0 1 12 4.75Z"
          />
        </svg>
        Continuar com Google
      </button>

      <button
        type="button"
        onClick={() => handleUnavailableProviderClick("Facebook")}
        className="flex h-10 min-h-10 items-center justify-center gap-2 rounded-md border border-border bg-transparent px-3 text-[11px] text-muted transition-colors hover:border-accent hover:text-foreground md:h-9 md:min-h-9 md:rounded-[3px] md:text-[10px]"
      >
        <svg
          aria-hidden="true"
          width="16"
          height="16"
          viewBox="0 0 24 24"
        >
          <path
            fill="#1877F2"
            d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.7 4.53-4.7 1.31 0 2.69.24 2.69.24v2.97h-1.51c-1.5 0-1.96.94-1.96 1.9v2.25h3.33l-.53 3.49h-2.8V24C19.61 23.1 24 18.1 24 12.07Z"
          />
        </svg>
        Continuar com Facebook
      </button>
    </div>
  );
};

export { AuthenticationSocialOptions };
