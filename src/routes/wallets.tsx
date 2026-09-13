import type { ReactNode } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, Plus } from "lucide-react";
import { createWallet, fetchUserWallets, updateWallet } from "@/features/wallets/api";
import { getSessionToken } from "@/lib/session";
import { queryKeys } from "@/lib/queryClient";
import type { WalletKind, WalletNetwork, WalletProvider } from "@/types";
import { AccountSidebar } from "@/components/common/AccountSidebar";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

const SelectField = ({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
}) => (
  <label className="grid gap-1.5">
    <span className="text-[15px]">
      {label}
      <b className="text-accent">*</b>
    </span>

    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 w-full appearance-none rounded-[3px] border border-border bg-transparent px-3 font-mono text-[13px] text-muted"
      >
        <option value="">Selecione uma opção</option>
        {children}
      </select>

      <ChevronDown
        size={16}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted"
      />
    </div>
  </label>
);

const WalletsPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const token = getSessionToken();

  const walletsQuery = useQuery({
    queryKey: queryKeys.wallets.all(),
    queryFn: fetchUserWallets,
    enabled: Boolean(token),
  });

  const [displayName, setDisplayName] = useState("");
  const [nickname, setNickname] = useState("");
  const [network, setNetwork] = useState("");
  const [profileName, setProfileName] = useState("");
  const [address, setAddress] = useState("");
  const [ens, setEns] = useState("");
  const [kind, setKind] = useState<WalletKind>("primary");
  const [provider, setProvider] = useState<WalletProvider>("metamask");
  const [referral, setReferral] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  /* - Guarda o identificador da carteira que está sendo editada. Quando existe um identificador, o mesmo formulário passa a atualizar uma carteira existente em vez de criar uma nova. - */

  const [editingWalletId, setEditingWalletId] = useState<string | null>(null);

  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!token) {
      void navigate({ to: "/login" });
    }
  }, [navigate, token]);

  const mutation = useMutation({
    /* - Usa o mesmo formulário tanto para criação quanto para edição. A presença de editingWalletId determina se a operação será feita através do endpoint de atualização ou de criação. - */

    mutationFn: () => {
      const walletInput = {
        kind,
        address: address.trim(),
        network: (network || "ethereum") as WalletNetwork,
        provider,
        label: nickname.trim() || displayName.trim() || "Carteira principal",
      };

      if (editingWalletId) {
        return updateWallet(editingWalletId, walletInput);
      }

      return createWallet(walletInput);
    },

    /* - Depois de salvar a carteira, encerra o modo de edição e invalida a query para buscar novamente os dados persistidos pelo backend. - */

    onSuccess: async () => {
      setError("");
      setEditingWalletId(null);
      await queryClient.invalidateQueries({ queryKey: queryKeys.wallets.all() });
    },

    onError: (e) => setError(e instanceof Error ? e.message : "Não foi possível salvar a carteira."),
  });

  if (!token) {
    return null;
  }

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!address.trim()) {
      return setError("Informe o endereço da carteira.");
    }

    mutation.mutate();
  };

  /* - Identifica as carteiras existentes para exibir as ações de edição somente quando houver uma carteira correspondente. - */

  const primary = walletsQuery.data?.find((wallet) => wallet.kind === "primary");
  const secondary = walletsQuery.data?.find((wallet) => wallet.kind === "secondary");

  /* - Preenche o formulário com os dados da carteira selecionada e ativa o modo de edição. O formulário continua sendo o mesmo utilizado para criação. - */

  const startEditingWallet = (wallet: NonNullable<typeof walletsQuery.data>[number]) => {
    setEditingWalletId(wallet.id);
    setKind(wallet.kind);
    setAddress(wallet.address);
    setNetwork(wallet.network);
    setProvider(wallet.provider);
    setNickname(wallet.label);
    setError("");
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="mx-auto max-w-300 px-0 pb-20 pt-8">
      <div className="grid lg:grid-cols-[310px_minmax(0,1fr)] lg:gap-7">
        <AccountSidebar active="wallets" />

        <main className="px-6 lg:px-0">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="font-display text-[18px] font-bold">Carteira principal</h1>

              <p className="mt-1 text-[13px] text-muted">Estas carteiras ficam disponíveis no pagamento e para receber NFTs comprados.</p>

              {/* - Exibe a ação de edição somente quando já existe uma carteira principal cadastrada. - */}

              {primary && (
                <button
                  type="button"
                  onClick={() => startEditingWallet(primary)}
                  className="mt-2 text-[13px] font-bold text-accent"
                >
                  Editar carteira principal
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                setError("");
                formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                formRef.current?.querySelector<HTMLInputElement>("input")?.focus();
              }}
              className="text-[15px] font-bold text-accent"
            >
              Adicionar
            </button>
          </div>

          <form
            ref={formRef}
            onSubmit={submit}
            className="mt-9 grid gap-x-7 gap-y-7 md:grid-cols-2"
          >
            <label className="grid gap-1.5">
              <span className="text-[15px]">
                Nome de exibição<b className="text-accent">*</b>
              </span>

              <Input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="h-10 rounded-[3px] bg-transparent"
              />
            </label>

            <label className="grid gap-1.5">
              <span className="text-[15px]">
                Apelido da carteira<b className="text-accent">*</b>
              </span>

              <Input
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="h-10 rounded-[3px] bg-transparent"
              />
            </label>

            <SelectField
              label="Rede"
              value={network}
              onChange={setNetwork}
            >
              <option value="ethereum">Ethereum</option>

              <option value="polygon">Polygon</option>
            </SelectField>

            <SelectField
              label="Provedor da carteira"
              value={provider}
              onChange={(value) => setProvider(value as WalletProvider)}
            >
              <option value="metamask">MetaMask</option>

              <option value="walletconnect">WalletConnect</option>

              <option value="coinbase">Coinbase Wallet</option>
            </SelectField>

            <label className="grid gap-1.5">
              <span className="text-[15px]">
                Nome do perfil<b className="text-accent">*</b>
              </span>

              <Input
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                className="h-10 rounded-[3px] bg-transparent"
              />
            </label>

            <label className="grid gap-1.5">
              <span className="text-[15px]">
                Endereço da carteira<b className="text-accent">*</b>
              </span>

              <Input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Endereço 0x da carteira"
                className="h-10 rounded-[3px] bg-transparent placeholder:text-muted-2"
              />
            </label>

            <SelectField
              label="Tipo de carteira"
              value={kind}
              onChange={(value) => setKind(value as WalletKind)}
            >
              <option value="primary">Principal</option>

              <option value="secondary">Secundária</option>
            </SelectField>

            <label className="grid gap-1.5">
              <span className="text-[15px]">
                Código de indicação<b className="text-accent">*</b>
              </span>

              <Input
                value={referral}
                onChange={(e) => setReferral(e.target.value)}
                className="h-10 rounded-[3px] bg-transparent"
              />
            </label>

            <label className="grid gap-1.5">
              <span className="text-[15px]">
                E-mail<b className="text-accent">*</b>
              </span>

              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-10 rounded-[3px] bg-transparent"
              />
            </label>

            <div className="grid gap-1.5">
              <span className="text-[15px]">
                Nome ENS <b className="text-accent">*</b>
              </span>

              <div className="flex">
                <select className="h-10 w-19.5 rounded-l-[3px] border border-border bg-transparent px-3">
                  <option>.eth</option>
                </select>

                <Input
                  value={ens}
                  onChange={(e) => setEns(e.target.value)}
                  className="h-10 flex-1 rounded-l-none border-l-0 bg-transparent"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              {error && <p className="text-xs text-danger">{error}</p>}

              <Button
                type="submit"
                disabled={mutation.isPending}
                className="mt-0 h-10 px-3"
              >
                {mutation.isPending ? "Salvando..." : editingWalletId ? "Atualizar carteira" : "Salvar carteira"}
              </Button>

              {/* - Permite abandonar o modo de edição e voltar o formulário para o comportamento de criação de uma nova carteira. - */}

              {editingWalletId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingWalletId(null);
                    setError("");
                  }}
                  className="ml-3 text-[13px] font-bold text-foreground"
                >
                  Cancelar edição
                </button>
              )}
            </div>
          </form>

          <section className="mt-9">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display text-[18px] font-bold">Carteira secundária</h2>

                <p className="mt-1 text-[13px] text-muted">{secondary ? secondary.label : "Você ainda não adicionou uma carteira secundária."}</p>

                {/*
                 * - Exibe a ação de edição somente quando existe uma carteira secundária cadastrada. -
                 */}
                {secondary && (
                  <button
                    type="button"
                    onClick={() => startEditingWallet(secondary)}
                    className="mt-2 text-[13px] font-bold text-accent"
                  >
                    Editar carteira secundária
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 text-[13px] text-foreground">
                <span className="grid size-4 place-items-center rounded-full border border-accent">
                  <span className="size-2 rounded-full bg-transparent" />
                </span>{" "}
                Igual à carteira principal{" "}
                <button
                  type="button"
                  onClick={() => {
                    setKind("secondary");
                    setError("");
                    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                    formRef.current?.querySelector<HTMLInputElement>("input")?.focus();
                  }}
                  className="font-bold text-accent"
                >
                  <Plus
                    size={15}
                    className="inline"
                  />{" "}
                  Adicionar
                </button>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

const Route = createFileRoute("/wallets")({ component: WalletsPage });

export { Route };
