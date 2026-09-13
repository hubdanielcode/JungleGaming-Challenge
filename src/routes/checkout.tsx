import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MoreVertical, WalletCards } from "lucide-react";
import { fetchCart, fetchCartQuote } from "@/features/cart/api";
import { connectWallet, fetchUserWallets } from "@/features/wallets/api";
import { fetchProfile } from "@/features/profile/api";
import { createOrder } from "@/features/orders/api";
import { queryKeys } from "@/lib/queryClient";
import { getActiveIdentityId, getSessionToken } from "@/lib/session";
import { getPendingOrder, setPendingOrder } from "@/lib/pendingOrder";
import type { Quote, WalletNetwork, WalletProvider } from "@/types";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { LoadingSkeleton } from "@/components/common/LoadingSkeleton";
import { MobileCheckoutHeader } from "@/components/common/MobileCheckoutHeader";

/* - Nome de exibição para cada provedor de carteira simulado, compartilhado entre a tela e a lista de seleção. - */

const formatProviderName = (walletProviderId: string): string =>
  walletProviderId === "walletconnect" ? "WalletConnect" : walletProviderId === "metamask" ? "MetaMask" : "Coinbase Wallet";

const CheckoutPage = () => {
  const navigate = useNavigate(),
    queryClient = useQueryClient(),
    token = getSessionToken();
  const cartQuery = useQuery({ queryKey: queryKeys.cart.all(), queryFn: fetchCart });
  const quoteQuery = useQuery({
    queryKey: queryKeys.cart.quote(cartQuery.data?.couponCode ?? null),
    queryFn: fetchCartQuote,
    enabled: Boolean(cartQuery.data),
  });

  const walletsQuery = useQuery({ queryKey: queryKeys.wallets.all(), queryFn: fetchUserWallets, enabled: Boolean(token) });
  const profileQuery = useQuery({ queryKey: queryKeys.profile.current(), queryFn: fetchProfile, enabled: Boolean(token) });
  const [nameOverride, setNameOverride] = useState<string | null>(null);
  const [emailOverride, setEmailOverride] = useState<string | null>(null);
  const name = nameOverride ?? profileQuery.data?.username ?? "";
  const email = emailOverride ?? profileQuery.data?.email ?? "";
  const [provider, setProvider] = useState<WalletProvider | "">("");
  const [network, setNetwork] = useState<WalletNetwork | "">("");
  const [selectedWalletId, setSelectedWalletId] = useState<string | null>(null);
  const [walletConnectionStatus, setWalletConnectionStatus] = useState<"idle" | "connecting" | "connected" | "rejected" | "disconnected">("idle");
  const [walletConnectionMessage, setWalletConnectionMessage] = useState("");
  const [error, setError] = useState("");
  const identityId = useMemo(() => getActiveIdentityId(), []);

  /*
   * - A chave de idempotência nasce uma única vez por tentativa de compra e é
   *   persistida imediatamente. Se a página remontar antes da resposta da API
   *   (refresh, queda de conexão), reaproveitamos a mesma chave em vez de gerar
   *   outra, evitando que um reenvio crie um segundo pedido. -
   */

  const [idempotencyKey] = useState(() => {
    const existingPendingOrder = getPendingOrder(identityId);
    if (existingPendingOrder && !existingPendingOrder.orderId) {
      return existingPendingOrder.idempotencyKey;
    }

    const generatedIdempotencyKey = crypto.randomUUID();
    setPendingOrder(identityId, { idempotencyKey: generatedIdempotencyKey, orderId: null });

    return generatedIdempotencyKey;
  });

  useEffect(() => {
    if (!token) void navigate({ to: "/login" });
  }, [navigate, token]);

  /* - Se um pedido já foi criado para esta identidade, a compra não recomeça: vamos direto para a confirmação existente. - */

  useEffect(() => {
    const existingPendingOrder = getPendingOrder(identityId);
    if (existingPendingOrder?.orderId) {
      void navigate({ to: "/confirmation/$orderId", params: { orderId: existingPendingOrder.orderId } });
    }
  }, [identityId, navigate]);

  const wallets = walletsQuery.data ?? [];
  const selectedWallet = selectedWalletId === null ? wallets[0] : wallets.find((wallet) => wallet.id === selectedWalletId);
  const effectiveProvider: WalletProvider = provider || selectedWallet?.provider || "metamask";
  const effectiveNetwork: WalletNetwork | "" = network || selectedWallet?.network || "";

  const walletConnectionMutation = useMutation({
    mutationFn: () => {
      if (!effectiveNetwork) {
        throw new Error("Selecione uma rede para conectar a carteira.");
      }

      return connectWallet(effectiveProvider, effectiveNetwork);
    },
    onMutate: () => {
      setError("");
      setWalletConnectionMessage("Aguardando confirmação da carteira...");
      setWalletConnectionStatus("connecting");
    },
    onSuccess: (wallet) => {
      setSelectedWalletId(wallet.id);
      setProvider(wallet.provider);
      setNetwork(wallet.network);
      setWalletConnectionStatus("connected");
      setWalletConnectionMessage(`${formatProviderName(wallet.provider)} conectado em ${formatNetworkName(wallet.network)}.`);
    },
    onError: (e) => {
      setWalletConnectionStatus("rejected");
      setWalletConnectionMessage(e instanceof Error ? e.message : "A conexão da carteira foi recusada.");
    },
  });

  const orderMutation = useMutation({
    mutationFn: () =>
      createOrder({
        idempotencyKey,
        walletId: selectedWallet?.id ?? "",
        collectorName: name.trim() || "Colecionador",
        collectorEmail: email.trim() || "contato@email.com",
        couponCode: cartQuery.data?.couponCode ?? null,
        network: selectedWallet?.network ?? "ethereum",
        walletProvider: selectedWallet?.provider ?? effectiveProvider,
      }),

    onSuccess: async (order) => {
      queryClient.setQueryData(queryKeys.orders.detail(order.id), order);
      setPendingOrder(identityId, { idempotencyKey, orderId: order.id });
      await navigate({ to: "/confirmation/$orderId", params: { orderId: order.id } });
    },
    onError: (e) => setError(e instanceof Error ? e.message : "Não foi possível confirmar a compra."),
  });
  if (!token) {
    return null;
  }

  if (cartQuery.isLoading || walletsQuery.isLoading) {
    return (
      <div className="mx-auto max-w-300 p-8">
        <LoadingSkeleton className="h-150" />
      </div>
    );
  }

  const items = cartQuery.data?.items ?? [];
  if (!items.length) {
    return (
      <div className="mx-auto max-w-300 p-8 text-center">
        <h1 className="font-display text-2xl font-bold">Seu carrinho está vazio</h1>
        <Link
          to="/cart"
          className="mt-4 inline-block text-accent"
        >
          Voltar ao carrinho
        </Link>
      </div>
    );
  }

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (!selectedWallet) {
      setError("Cadastre uma carteira para continuar.");

      return;
    }

    if (walletConnectionStatus !== "connected") {
      setError("Conecte a carteira e confirme a rede antes de finalizar a compra.");

      return;
    }

    orderMutation.mutate();
  };

  return (
    <div className="bg-background">
      <MobileCheckoutHeader />

      <form
        onSubmit={submit}
        className="mx-auto max-w-300 px-6 pb-20 md:px-0 md:pb-0"
      >
        <div className="hidden md:block">
          <nav className="pt-3 text-[12px]">
            <Link to="/">Início</Link>

            <span className="mx-2">/</span>

            <Link to="/">Mercado</Link>

            <span className="mx-2">/</span>

            <span>Pagamento</span>
          </nav>
        </div>

        <div className="mt-5 hidden md:grid md:grid-cols-[1fr_325px] md:gap-7">
          <section>
            <h1 className="font-display text-[17px] font-bold">Perfil do colecionador</h1>

            <div className="mt-5 grid grid-cols-2 gap-x-5 gap-y-5">
              <label className="grid gap-1.5">
                <span className="text-[14px]">
                  Nome de exibição<p className="text-accent font-semibold">*</p>
                </span>

                <Input
                  value={name}
                  onChange={(e) => setNameOverride(e.target.value)}
                  className="h-10 rounded-[3px] bg-transparent"
                />
              </label>

              <label className="grid gap-1.5">
                <span className="text-[14px]">
                  Nome de usuário<p className="text-accent font-semibold">*</p>
                </span>

                <Input
                  value={profileQuery.data?.username ?? ""}
                  readOnly
                  className="h-10 rounded-[3px] bg-transparent"
                />
              </label>

              <label className="grid gap-1.5">
                <span className="text-[14px]">
                  Rede<p className="text-accent font-semibold">*</p>
                </span>

                <select
                  value={network}
                  onChange={(event) => {
                    const nextNetwork = event.target.value as WalletNetwork;
                    setNetwork(nextNetwork);
                    const matchingWallet = wallets.find((wallet) => wallet.network === nextNetwork && wallet.provider === effectiveProvider);
                    if (matchingWallet) {
                      setSelectedWalletId(matchingWallet.id);
                      setWalletConnectionStatus("disconnected");
                      setWalletConnectionMessage("A rede mudou. Reconecte a carteira para confirmar a nova rede.");
                    } else {
                      setSelectedWalletId("");
                      setWalletConnectionStatus("disconnected");
                      setWalletConnectionMessage("Nenhuma carteira cadastrada combina com esta rede e provedor.");
                    }
                  }}
                  aria-label="Rede"
                  className="h-10 rounded-[3px] border border-border bg-transparent px-3 font-mono text-[12px] text-muted"
                >
                  <option value="">Selecione uma rede</option>
                  <option value="ethereum">Ethereum</option>
                  <option value="polygon">Polygon</option>
                  <option value="solana">Solana</option>
                </select>
              </label>

              <label className="grid gap-1.5">
                <span className="text-[14px]">
                  Nome do perfil<p className="text-accent font-semibold">*</p>
                </span>

                <Input className="h-10 rounded-[3px] bg-transparent" />
              </label>

              <label className="grid gap-1.5">
                <span className="text-[14px]">
                  Endereço da carteira<p className="text-accent font-semibold">*</p>
                </span>

                <Input
                  value={selectedWallet?.address ?? ""}
                  readOnly
                  placeholder="Endereço 0x da carteira"
                  className="h-10 rounded-[3px] bg-transparent"
                />
              </label>

              <Input
                placeholder="ENS ou carteira secundária (opcional)"
                className="mt-6 h-10 rounded-[3px] bg-transparent"
              />

              <label className="grid gap-1.5">
                <span className="text-[14px]">
                  Tipo de carteira<p className="text-accent font-semibold">*</p>
                </span>

                <select
                  value={effectiveProvider}
                  onChange={(event) => {
                    const nextProvider = event.target.value as WalletProvider;
                    setProvider(nextProvider);
                    const matchingWallet = wallets.find((wallet) => wallet.provider === nextProvider && (!network || wallet.network === network));
                    if (matchingWallet) {
                      setSelectedWalletId(matchingWallet.id);
                      setNetwork(matchingWallet.network);
                      setWalletConnectionStatus("disconnected");
                      setWalletConnectionMessage("O provedor mudou. Reconecte a carteira para continuar.");
                    } else {
                      setSelectedWalletId("");
                      setWalletConnectionStatus("disconnected");
                      setWalletConnectionMessage("Nenhuma carteira cadastrada corresponde ao provedor selecionado.");
                    }
                  }}
                  aria-label="Tipo de carteira"
                  className="h-10 rounded-[3px] border border-border bg-transparent px-3 font-mono text-[12px]"
                >
                  <option value="metamask">MetaMask</option>
                  <option value="walletconnect">WalletConnect</option>
                  <option value="coinbase">Coinbase Wallet</option>
                </select>
              </label>

              <label className="grid gap-1.5">
                <span className="text-[14px]">
                  Código de indicação<p className="text-accent font-semibold">*</p>
                </span>

                <Input className="h-10 rounded-[3px] bg-transparent" />
              </label>

              <label className="grid gap-1.5">
                <span className="text-[14px]">
                  E-mail<p className="text-accent font-semibold">*</p>
                </span>

                <Input
                  value={email}
                  onChange={(e) => setEmailOverride(e.target.value)}
                  className="h-10 rounded-[3px] bg-transparent"
                />
              </label>

              <div className="grid gap-1.5">
                <span className="text-[14px]">
                  Nome ENS <p className="text-accent font-semibold">*</p>
                </span>

                <div className="flex">
                  <select className="h-10 w-19.5 rounded-l-[3px] border border-border bg-transparent px-3">
                    <option>.eth</option>
                  </select>

                  <Input className="h-10 flex-1 rounded-l-none border-l-0 bg-transparent" />
                </div>
              </div>
            </div>

            <label className="mt-5 flex items-center gap-2 text-[13px]">
              <input
                type="radio"
                className="accent-accent"
              />{" "}
              Usar outra carteira?
            </label>

            <label className="mt-5 grid gap-1.5">
              <span className="text-[14px]">Observação do colecionador (opcional)</span>

              <textarea className="h-30 resize-none rounded-[3px] border border-border bg-transparent p-3 outline-none" />
            </label>
          </section>

          <aside>
            <h2 className="font-display text-[17px] font-bold">Seus NFTs</h2>

            <div className="mt-4 flex justify-between border-b border-border pb-2 text-[13px]">
              <span>NFTs</span>

              <span>Subtotal</span>
            </div>

            {items.map((item) => (
              <div
                key={item.id}
                className="mt-1 flex items-center gap-2 bg-surface px-1 py-2"
              >
                <img
                  src={item.nftImage}
                  className="size-14 rounded object-cover"
                  alt=""
                />

                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-bold">{item.nftName}</p>

                  <p className="text-[10px] text-muted">
                    ID do token: #{item.nftId.slice(-4)} (x {item.quantity})
                  </p>
                </div>

                <p className="whitespace-nowrap text-[14px] text-accent font-semibold">
                  {(Number(item.unitPriceEth) * item.quantity).toFixed(2)} ETH
                </p>
              </div>
            ))}

            <p className="mt-3 text-center text-[11px]">Tem um código promocional? Aplique aqui</p>

            <Summary quote={quoteQuery.data} />

            <h3 className="mt-5 text-center font-display text-[15px] font-bold">Carteira e rede</h3>

            <Providers
              provider={effectiveProvider}
              network={effectiveNetwork}
              wallets={wallets}
              onSelect={(nextProvider, wallet) => {
                setProvider(nextProvider);
                if (wallet) {
                  setSelectedWalletId(wallet.id);
                  setNetwork(wallet.network);
                }
                setWalletConnectionStatus("disconnected");
                setWalletConnectionMessage("O provedor mudou. Conecte a carteira para continuar.");
              }}
            />

            {walletConnectionMessage && (
              <p
                role={walletConnectionStatus === "rejected" || walletConnectionStatus === "disconnected" ? "alert" : "status"}
                className={`mt-3 text-xs ${walletConnectionStatus === "connected" ? "text-accent" : "text-danger"}`}
              >
                {walletConnectionMessage}
              </p>
            )}

            {error && <p role="alert" className="mt-3 text-xs text-danger">{error}</p>}

            {walletConnectionStatus === "connected" ? (
              <Button
                type="button"
                variant="secondary"
                className="mt-3 h-10 w-full"
                onClick={() => {
                  setWalletConnectionStatus("disconnected");
                  setWalletConnectionMessage("Carteira desconectada. Conecte novamente antes de finalizar.");
                }}
              >
                Desconectar carteira
              </Button>
            ) : (
              <Button
                type="button"
                className="mt-3 h-10 w-full"
                onClick={() => walletConnectionMutation.mutate()}
                disabled={walletConnectionMutation.isPending || !effectiveNetwork}
              >
                {walletConnectionMutation.isPending ? "Conectando..." : "Conectar carteira"}
              </Button>
            )}

            <Button
              type="submit"
              disabled={orderMutation.isPending}
              className="mt-5 h-10 w-full"
            >
              {orderMutation.isPending ? "Processando..." : "Confirmar compra"}
            </Button>
          </aside>
        </div>

        <div className="md:hidden">
          <h1 className="mt-4 font-display text-[18px] font-bold">
            Carteira conectada{" "}
            <button
              type="button"
              className="float-right text-[10px] font-bold text-accent"
            >
              Trocar carteira
            </button>
          </h1>

          <div className="mt-3 grid gap-2">
            {wallets.map((wallet) => (
              <button
                type="button"
                key={wallet.id}
                onClick={() => {
                  setSelectedWalletId(wallet.id);
                  setProvider(wallet.provider);
                  setNetwork(wallet.network);
                  setWalletConnectionStatus("disconnected");
                  setWalletConnectionMessage("Carteira selecionada. Conecte para confirmar a operação.");
                }}
                className={`flex items-center justify-between rounded-control bg-surface p-3 text-left ${selectedWallet?.id === wallet.id ? "border border-accent" : "border border-transparent"}`}
              >
                <span className="min-w-0">
                  <p className="block text-[12px] font-bold">{wallet.label}</p>
                  <span className="block truncate text-[9px] text-muted">{wallet.address} · {formatNetworkName(wallet.network)}</span>
                </span>
                <MoreVertical size={15} className="shrink-0 text-muted" />
              </button>
            ))}
          </div>

          <h2 className="mt-6 font-display text-[14px] font-bold">Carteira e rede</h2>

          <Providers
            provider={effectiveProvider}
            network={effectiveNetwork}
            wallets={wallets}
            onSelect={(nextProvider, wallet) => {
              setProvider(nextProvider);
              if (wallet) {
                setSelectedWalletId(wallet.id);
                setNetwork(wallet.network);
              }
              setWalletConnectionStatus("disconnected");
              setWalletConnectionMessage("O provedor mudou. Conecte a carteira para continuar.");
            }}
          />

          {walletConnectionMessage && (
            <p role={walletConnectionStatus === "rejected" || walletConnectionStatus === "disconnected" ? "alert" : "status"} className={`mt-3 text-xs ${walletConnectionStatus === "connected" ? "text-accent" : "text-danger"}`}>
              {walletConnectionMessage}
            </p>
          )}

          {walletConnectionStatus === "connected" ? (
            <Button type="button" variant="secondary" className="mt-3 h-10 w-full" onClick={() => { setWalletConnectionStatus("disconnected"); setWalletConnectionMessage("Carteira desconectada. Conecte novamente antes de finalizar."); }}>
              Desconectar carteira
            </Button>
          ) : (
            <Button type="button" className="mt-3 h-10 w-full" onClick={() => walletConnectionMutation.mutate()} disabled={walletConnectionMutation.isPending || !effectiveNetwork}>
              {walletConnectionMutation.isPending ? "Conectando..." : "Conectar carteira"}
            </Button>
          )}

          <div className="mt-5 flex items-center justify-between border-t border-border pt-4 text-[15px] font-bold">
            <span>Total:</span>

            <span className="text-accent">{quoteQuery.data?.totalEth ?? "0"} ETH</span>
          </div>

          {error && <p role="alert" className="mt-3 text-xs text-danger">{error}</p>}

          <Button
            type="submit"
            disabled={orderMutation.isPending}
            className="mt-4 h-11 w-full"
          >
            {orderMutation.isPending ? "Processando..." : "Confirmar compra"}
          </Button>
        </div>
      </form>
    </div>
  );
};

const Summary = ({ quote }: { quote: Quote | undefined }) => (
  <div className="mt-4 grid gap-2 text-[13px]">
    <div className="flex justify-between">
      <span>Subtotal</span>

      <span>{quote?.subtotalEth ?? "0"} ETH</span>
    </div>

    <div className="flex justify-between">
      <span>Desconto do lançamento</span>

      <span>(-) {quote?.discountEth ?? "00.00"}</span>
    </div>

    <div className="flex justify-between">
      <span>Taxa de rede</span>

      <span>{quote?.networkFeeEth ?? "0.016"} ETH</span>
    </div>

    <span className="text-right text-[9px] text-accent">Taxa estimada</span>

    <div className="flex justify-between border-t border-border pt-3 text-[15px] font-bold">
      <span>Total</span>

      <span className="text-accent">{quote?.totalEth ?? "0"} ETH</span>
    </div>
  </div>
);

const formatNetworkName = (walletNetwork: WalletNetwork): string =>
  walletNetwork === "ethereum" ? "Ethereum" : walletNetwork === "polygon" ? "Polygon" : "Solana";

const Providers = ({
  provider,
  network,
  wallets,
  onSelect,
}: {
  provider: WalletProvider;
  network: WalletNetwork | "";
  wallets: Array<{ id: string; provider: WalletProvider; network: WalletNetwork }>;
  onSelect: (provider: WalletProvider, wallet?: { id: string; provider: WalletProvider; network: WalletNetwork }) => void;
}) => (
  <div className="mt-3 grid gap-2">
    {(["walletconnect", "metamask", "coinbase"] as WalletProvider[]).map((walletProvider) => {
      const matchingWallet = wallets.find((wallet) => wallet.provider === walletProvider && (!network || wallet.network === network));
      const isSelected = provider === walletProvider;

      return (
        <button
          type="button"
          key={walletProvider}
          onClick={() => onSelect(walletProvider, matchingWallet)}
          className={`flex h-10 items-center justify-between rounded-control border px-3 text-[11px] ${isSelected ? "border-accent" : "border-border"}`}
          aria-pressed={isSelected}
        >
          <span className="flex items-center gap-2">
            <span className={`grid size-3 place-items-center rounded-full border border-accent ${isSelected ? "after:size-1 after:rounded-full after:bg-accent after:content-['']" : ""}`} />
            {formatProviderName(walletProvider)}
          </span>
          <span className="flex items-center gap-2">
            {!matchingWallet ? <span className="text-[9px] text-muted-2">não cadastrada</span> : null}
            <WalletCards size={14} className="text-accent" />
          </span>
        </button>
      );
    })}
  </div>
);

const Route = createFileRoute("/checkout")({ component: CheckoutPage });

export { Route };
