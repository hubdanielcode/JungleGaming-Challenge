import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Eye, EyeOff } from "lucide-react";
import { login } from "@/features/authentication/api";
import { validateEmailAddress, validatePassword } from "@/features/authentication/validation";
import { AuthenticationLayout } from "@/features/authentication/components/AuthenticationLayout";
import { AuthenticationSocialOptions } from "@/features/authentication/components/AuthenticationSocialOptions";
import { queryKeys } from "@/lib/queryClient";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

const LoginPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: async (session) => {
      queryClient.setQueryData(queryKeys.session.current(), session);
      await navigate({ to: "/" });
    },

    onError: (error) => setFormError(error instanceof Error ? error.message : "Não foi possível entrar."),
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError("");

    if (!validateEmailAddress(email)) {
      return setFormError("Informe um e-mail válido.");
    }

    if (!validatePassword(password)) {
      return setFormError("A senha deve ter ao menos 6 caracteres.");
    }

    loginMutation.mutate({ email, password });
  };

  return (
    <AuthenticationLayout
      title="Entrar"
      subtitle="Entre para gerenciar sua carteira, coleção e perfil de criador."
    >
      <form
        onSubmit={handleSubmit}
        className="grid gap-2.5 md:gap-3"
      >
        <Input
          id="login-email"
          placeholder="contato@email.com"
          aria-label="E-mail"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="email"
          className="h-12.5 min-h-12.5 rounded-[7px] px-4 text-[13px] md:h-10 md:min-h-10 md:rounded-control md:px-3 md:text-[10px]"
        />

        <div className="relative">
          <Input
            id="login-password"
            placeholder="Senha"
            aria-label="Senha"
            type={isPasswordVisible ? "text" : "password"}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            className="h-12.5 min-h-12.5 rounded-[7px] px-4 pr-12 text-[13px] md:h-10 md:min-h-10 md:rounded-control md:px-3 md:pr-10 md:text-[10px]"
          />

          <button
            type="button"
            aria-label={isPasswordVisible ? "Ocultar senha" : "Mostrar senha"}
            onClick={() => setIsPasswordVisible((currentState) => !currentState)}
            className="absolute right-3 top-1/2 grid size-7 -translate-y-1/2 place-items-center text-muted transition-colors hover:text-foreground"
          >
            {isPasswordVisible ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>

        {formError ? (
          <p
            className="text-[10px] leading-4 text-danger"
            role="alert"
          >
            {formError}
          </p>
        ) : null}

        <div className="text-right">
          <button
            type="button"
            className="text-[12px] text-accent transition-colors hover:text-accent-strong md:text-[10px]"
          >
            Esqueceu a senha?
          </button>
        </div>

        <Button
          type="submit"
          disabled={loginMutation.isPending}
          className="mt-6 h-15 min-h-15 rounded-[8px] text-[14px] md:mt-3 md:h-10 md:min-h-10 md:rounded-control md:text-[11px]"
        >
          {loginMutation.isPending ? "Entrando..." : "Entrar"}
        </Button>
      </form>

      <AuthenticationSocialOptions />

      <p className="mt-9 text-center font-mono text-[13px] text-muted md:mt-6 md:text-[10px]">
        Novo na Kurio?{" "}
        <Link
          to="/register"
          className="text-accent transition-colors hover:text-accent-strong"
        >
          Crie uma conta
        </Link>
      </p>
    </AuthenticationLayout>
  );
};

const Route = createFileRoute("/login")({
  component: LoginPage,
});

export { Route };
