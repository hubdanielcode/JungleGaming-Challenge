import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { register } from "@/features/authentication/api";
import { validateEmailAddress, validatePassword } from "@/features/authentication/validation";
import { AuthenticationLayout } from "@/features/authentication/components/AuthenticationLayout";
import { AuthenticationSocialOptions } from "@/features/authentication/components/AuthenticationSocialOptions";
import { queryKeys } from "@/lib/queryClient";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

const RegisterPage = () => {
  const navigate = useNavigate();
  const searchParameters = useSearch({ from: "/register" });
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formError, setFormError] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);

  const registerMutation = useMutation({
    mutationFn: register,
    onSuccess: async (session) => {
      queryClient.setQueryData(queryKeys.session.current(), session);
      const redirectTarget = searchParameters.redirect;
      const safeRedirect = redirectTarget && redirectTarget.startsWith("/") && !redirectTarget.startsWith("//") ? redirectTarget : "/";
      await navigate({ to: safeRedirect as "/" });
    },

    onError: (error) => setFormError(error instanceof Error ? error.message : "Não foi possível criar o perfil."),
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError("");
    if (!validateEmailAddress(email)) {
      return setFormError("Informe um e-mail válido.");
    }

    if (username.trim().length < 3) {
      return setFormError("O nome de usuário deve ter ao menos 3 caracteres.");
    }

    if (!validatePassword(password)) {
      return setFormError("A senha deve ter ao menos 6 caracteres.");
    }

    if (password !== confirmPassword) {
      return setFormError("As senhas não coincidem.");
    }

    registerMutation.mutate({ email, username: username.trim(), password, confirmPassword });
  };

  return (
    <AuthenticationLayout
      title="Criar conta"
      subtitle="Crie seu perfil de colecionador e conecte uma carteira quando quiser."
    >
      <form
        onSubmit={handleSubmit}
        className="grid gap-2.5 md:gap-3"
      >
        <Input
          id="register-username"
          placeholder="Nome de usuário"
          aria-label="Nome de usuário"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          autoComplete="username"
          className="h-12.5 min-h-12.5 rounded-[7px] px-4 text-[13px] md:h-10 md:min-h-10 md:rounded-control md:px-3 md:text-[10px]"
        />

        <Input
          id="register-email"
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
            id="register-password"
            placeholder="Senha"
            aria-label="Senha"
            type={isPasswordVisible ? "text" : "password"}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="new-password"
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

        <div className="relative">
          <Input
            id="register-confirm-password"
            placeholder="Confirmar senha"
            aria-label="Confirmar senha"
            type={isConfirmPasswordVisible ? "text" : "password"}
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            autoComplete="new-password"
            className="h-12.5 min-h-12.5 rounded-[7px] px-4 pr-12 text-[13px] md:h-10 md:min-h-10 md:rounded-control md:px-3 md:pr-10 md:text-[10px]"
          />

          <button
            type="button"
            aria-label={isConfirmPasswordVisible ? "Ocultar senha" : "Mostrar senha"}
            onClick={() => setIsConfirmPasswordVisible((currentState) => !currentState)}
            className="absolute right-3 top-1/2 grid size-7 -translate-y-1/2 place-items-center text-muted transition-colors hover:text-foreground"
          >
            {isConfirmPasswordVisible ? <EyeOff size={16} /> : <Eye size={16} />}
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

        <Button
          type="submit"
          disabled={registerMutation.isPending}
          className="mt-6 h-15 min-h-15 rounded-[8px] text-[14px] md:mt-3 md:h-10 md:min-h-10 md:rounded-control md:text-[11px]"
        >
          {registerMutation.isPending ? "Criando..." : "Criar conta"}
        </Button>
      </form>

      <AuthenticationSocialOptions />

      <p className="mt-9 text-center font-mono text-[13px] text-muted md:mt-6 md:text-[10px]">
        Já tem uma conta?{" "}
        <Link
          to="/login"
          className="text-accent transition-colors hover:text-accent-strong"
        >
          Entrar
        </Link>
      </p>
    </AuthenticationLayout>
  );
};

const Route = createFileRoute("/register")({
  validateSearch: (searchParameters) => ({
    redirect: typeof searchParameters.redirect === "string" ? searchParameters.redirect : undefined,
  }),
  component: RegisterPage,
});

export { Route };
