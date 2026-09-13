import type { ReactNode } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, Plus } from "lucide-react";
import { createWallet, fetchUserWallets } from "@/features/wallets/api";
import { getSessionToken } from "@/lib/session";
import { queryKeys } from "@/lib/queryClient";
import type { WalletKind, WalletNetwork, WalletProvider } from "@/types";
import { AccountSidebar } from "@/components/common/AccountSidebar";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

const SelectField = ({ label, value, onChange, children }: { label: string; value: string; onChange: (v: string) => void; children: ReactNode }) => (
  <label className="grid gap-1.5">
    <span className="text-[15px]">
      {label}
      <p className="text-accent font-semibold">*</p>
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
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!token) {
      void navigate({ to: "/login" });
    }
  }, [navigate, token]);

  const mutation = useMutation({
    mutationFn: () =>
      createWallet({
        kind,
        address: address.trim(),
        network: (network || "ethereum") as WalletNetwork,
        provider,
        label: nickname.trim() || displayName.trim() || "Carteira principal",
      }),

    onSuccess: async () => {
      setError("");
      await queryClient.invalidateQueries({ queryKey: queryKeys.wallets.all() });
    },

    onError: (error) => setError(error instanceof Error ? error.message : "Não foi possível salvar a carteira."),
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

  const secondary = walletsQuery.data?.find((wallet) => wallet.kind === "secondary");

  return (
    <div className="mx-auto max-w-300 px-0 pb-20 pt-8">
      <div className="grid lg:grid-cols-[310px_minmax(0,1fr)] lg:gap-7">
        <AccountSidebar active="wallets" />

        <main className="px-6 lg:px-0">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="font-display text-[18px] font-bold">Carteira principal</h1>

              <p className="mt-1 text-[13px] text-muted">Estas carteiras ficam disponíveis no pagamento e para receber NFTs comprados.</p>
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
                Nome de exibição<p className="text-accent font-semibold">*</p>
              </span>

              <Input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="h-10 rounded-[3px] bg-transparent"
              />
            </label>

            <label className="grid gap-1.5">
              <span className="text-[15px]">
                Apelido da carteira<p className="text-accent font-semibold">*</p>
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
                Nome do perfil<p className="text-accent font-semibold">*</p>
              </span>

              <Input
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                className="h-10 rounded-[3px] bg-transparent"
              />
            </label>

            <label className="grid gap-1.5">
              <span className="text-[15px]">
                Endereço da carteira<p className="text-accent font-semibold">*</p>
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
                Código de indicação<p className="text-accent font-semibold">*</p>
              </span>

              <Input
                value={referral}
                onChange={(e) => setReferral(e.target.value)}
                className="h-10 rounded-[3px] bg-transparent"
              />
            </label>

            <label className="grid gap-1.5">
              <span className="text-[15px]">
                E-mail<p className="text-accent font-semibold">*</p>
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
                Nome ENS <p className="text-accent font-semibold">*</p>
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
                {mutation.isPending ? "Salvando..." : "Salvar carteira"}
              </Button>
            </div>
          </form>

          <section className="mt-9">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display text-[18px] font-bold">Carteira secundária</h2>

                <p className="mt-1 text-[13px] text-muted">{secondary ? secondary.label : "Você ainda não adicionou uma carteira secundária."}</p>
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
