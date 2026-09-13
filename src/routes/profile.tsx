import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { EyeOff, Image as ImageIcon } from "lucide-react";
import { fetchProfile, updateAvatar, updatePassword, updateProfile } from "@/features/profile/api";
import { getSessionToken } from "@/lib/session";
import { queryKeys } from "@/lib/queryClient";
import { AccountSidebar } from "@/components/common/AccountSidebar";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { LoadingSkeleton } from "@/components/common/LoadingSkeleton";

const Field = ({
  label,
  value,
  onChange,
  placeholder = "",
}: {
  label: string;
  value: string;
  onChange?: (value: string) => void;
  placeholder?: string;
}) => (
  <label className="grid gap-1.5">
    <span className="text-[15px]">
      {label}
      <p className="text-accent font-semibold">*</p>
    </span>

    <input
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      placeholder={placeholder}
      className="h-10 rounded-[3px] border border-border bg-transparent px-3 font-mono text-[13px] text-foreground placeholder:text-muted-2 focus:border-accent focus:outline-none"
    />
  </label>
);

const ProfilePage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const sessionToken = getSessionToken();

  const profileQuery = useQuery({
    queryKey: queryKeys.profile.current(),
    queryFn: fetchProfile,
    enabled: Boolean(sessionToken),
  });

  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [walletNickname, setWalletNickname] = useState("");
  const [ens, setEns] = useState("");
  const [avatar, setAvatar] = useState<string | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const [synced, setSynced] = useState(false);

  if (profileQuery.data && !synced) {
    setSynced(true);
    setUsername(profileQuery.data.username);
    setEmail(profileQuery.data.email);
    setDisplayName(profileQuery.data.username);
    setAvatar(profileQuery.data.avatar);
  }

  useEffect(() => {
    if (!sessionToken) {
      void navigate({ to: "/login" });
    }
  }, [navigate, sessionToken]);

  const profileMutation = useMutation({
    mutationFn: () => updateProfile({ username: username.trim(), email: email.trim() }),
    onSuccess: (updateProfileResult) => {
      queryClient.setQueryData(queryKeys.profile.current(), updateProfileResult);
      setMessage("Perfil salvo.");
      setError("");
    },

    onError: (error) => {
      setError(error instanceof Error ? error.message : "Não foi possível salvar.");
      setMessage("");
    },
  });

  const avatarMutation = useMutation({
    mutationFn: (data: string | null) => updateAvatar({ avatarDataUrl: data }),
    onSuccess: (avatarMutationResult) => {
      queryClient.setQueryData(queryKeys.profile.current(), avatarMutationResult);
      setAvatar(avatarMutationResult.avatar);
      setMessage("Avatar atualizado.");
    },
  });

  const passwordMutation = useMutation({
    mutationFn: () => updatePassword({ currentPassword, newPassword }),
    onSuccess: () => {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setMessage("Senha atualizada.");
      setError("");
    },
    onError: (error) => setError(error instanceof Error ? error.message : "Não foi possível alterar a senha."),
  });

  if (!sessionToken) {
    return null;
  }

  if (profileQuery.isLoading) {
    return (
      <div className="mx-auto max-w-300 p-10">
        <LoadingSkeleton className="h-125" />
      </div>
    );
  }

  const save = (e: FormEvent) => {
    e.preventDefault();
    setError("");
    profileMutation.mutate();

    if (newPassword) {
      if (newPassword.length < 6) {
        return setError("A nova senha deve ter ao menos 6 caracteres.");
      }

      if (newPassword !== confirmPassword) {
        return setError("As senhas não coincidem.");
      }

      passwordMutation.mutate();
    }
  };

  return (
    <div className="mx-auto max-w-300 px-0 pb-20 pt-8 md:pt-8">
      <div className="grid lg:grid-cols-[310px_minmax(0,1fr)] lg:gap-7">
        <AccountSidebar active="profile" />

        <main className="px-6 lg:px-0">
          <h1 className="font-display text-[18px] font-bold">Perfil do colecionador</h1>

          <form
            onSubmit={save}
            className="mt-8 grid gap-x-7 gap-y-7 md:grid-cols-2"
          >
            <Field
              label="Nome de exibição"
              value={displayName}
              onChange={setDisplayName}
            />

            <Field
              label="Nome de usuário"
              value={username}
              onChange={setUsername}
            />

            <Field
              label="E-mail"
              value={email}
              onChange={setEmail}
            />

            <div className="grid gap-1.5">
              <span className="text-[15px]">
                Nome ENS <p className="text-accent font-semibold">*</p>
              </span>

              <div className="flex">
                <select className="h-10 w-[19.5] rounded-l-[3px] border border-border bg-transparent px-3 font-mono text-[13px]">
                  <option>.eth</option>
                </select>

                <input
                  value={ens}
                  onChange={(e) => setEns(e.target.value)}
                  className="h-10 min-w-0 flex-1 rounded-r-[3px] border border-l-0 border-border bg-transparent px-3 font-mono text-[13px]"
                />
              </div>
            </div>

            <Field
              label="Apelido da carteira"
              value={walletNickname}
              onChange={setWalletNickname}
            />

            <div className="grid gap-1.5">
              <span className="text-[15px]">Avatar</span>

              <div className="flex items-center gap-3">
                <span className="grid size-12 place-items-center overflow-hidden rounded-full bg-surface text-accent">
                  {avatar ? (
                    <img
                      src={avatar}
                      className="h-full w-full object-cover"
                      alt=""
                    />
                  ) : (
                    <ImageIcon size={22} />
                  )}
                </span>

                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];

                    if (!file) {
                      return;
                    }

                    const reader = new FileReader();
                    reader.onload = () => typeof reader.result === "string" && avatarMutation.mutate(reader.result);
                    reader.readAsDataURL(file);
                  }}
                />

                <Button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="h-10 px-5"
                >
                  Alterar
                </Button>

                <button
                  type="button"
                  className="text-sm text-foreground"
                  onClick={() => avatarMutation.mutate(null)}
                >
                  Remover
                </button>
              </div>
            </div>

            <div className="md:col-span-2 mt-0">
              <h2 className="font-display text-[18px] font-bold">Alterar senha</h2>
            </div>

            <label className="grid gap-1.5 md:max-w-130">
              <span className="text-[15px]">Senha atual</span>

              <div className="relative">
                <Input
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  type="password"
                  className="h-10 rounded-[3px] bg-transparent pr-10"
                />

                <EyeOff
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted"
                  size={16}
                />
              </div>
            </label>
            <div />

            <label className="grid gap-1.5 md:max-w-130">
              <span className="text-[15px]">Nova senha</span>

              <div className="relative">
                <Input
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  type="password"
                  className="h-10 rounded-[3px] bg-transparent pr-10"
                />

                <EyeOff
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted"
                  size={16}
                />
              </div>
            </label>
            <div />

            <label className="grid gap-1.5 md:max-w-[130]">
              <span className="text-[15px]">Confirmar nova senha</span>

              <div className="relative">
                <Input
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  type="password"
                  className="h-10 rounded-[3px] bg-transparent pr-10"
                />

                <EyeOff
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted"
                  size={16}
                />
              </div>
            </label>
            <div />

            <Button
              type="submit"
              disabled={profileMutation.isPending || passwordMutation.isPending}
              className="h-10 w-33"
            >
              {profileMutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </form>

          {message && <p className="mt-4 text-xs text-success">{message}</p>}

          {error && <p className="mt-4 text-xs text-danger">{error}</p>}
        </main>
      </div>
    </div>
  );
};

const Route = createFileRoute("/profile")({ component: ProfilePage });

export { Route };
