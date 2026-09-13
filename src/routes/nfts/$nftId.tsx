import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Heart, Minus, Plus, Search } from "lucide-react";
import { useState } from "react";
import { fetchNfts, fetchSingleNft } from "@/features/catalog/api";
import { addFavoriteNft, fetchFavoriteNftIds, removeFavoriteNft } from "@/features/favorites/api";
import { addCartItem } from "@/features/cart/api";
import { queryKeys } from "@/lib/queryClient";
import { getSessionToken } from "@/lib/session";
import { Button } from "@/components/ui/Button";
import { LoadingSkeleton } from "@/components/common/LoadingSkeleton";
import { MobilePageHeader } from "@/components/common/MobilePageHeader";

const NftDetailPage = () => {
  const navigate = useNavigate();
  const { nftId } = Route.useParams();
  const queryClient = useQueryClient();
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState("details");
  const [cartError, setCartError] = useState("");

  const nftQuery = useQuery({
    queryKey: queryKeys.nfts.detail(nftId),
    queryFn: ({ signal }) => fetchSingleNft(nftId, signal),
  });

  const favorites = useQuery({
    queryKey: queryKeys.favorites.all(),
    queryFn: fetchFavoriteNftIds,
    enabled: Boolean(getSessionToken()),
  });

  const collectionQuery = useQuery({
    queryKey: [...queryKeys.nfts.all, "related", nftId],
    queryFn: () => fetchNfts({ collectionId: nftQuery.data?.collectionId, page: 1, pageSize: 5, sort: "relevance" }),
    enabled: Boolean(nftQuery.data),
  });

  const favMutation = useMutation({
    mutationFn: () => (favorites.data?.includes(nftId) ? removeFavoriteNft(nftId) : addFavoriteNft(nftId)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.favorites.all() }),
    onError: (error) => {
      if (error instanceof Error && /login|autentic|sessão/i.test(error.message)) {
        void navigate({ to: "/login", search: { redirect: `/nfts/${nftId}` } });
      }
    },
  });

  const cartMutation = useMutation({
    mutationFn: () => addCartItem({ nftId, quantity: quantity }),
    onSuccess: async (cart) => {
      setCartError("");
      queryClient.setQueryData(queryKeys.cart.all(), cart);
      await navigate({ to: "/cart" });
    },
    onError: (error) => setCartError(error instanceof Error ? error.message : "Não foi possível adicionar ao carrinho."),
  });

  if (nftQuery.isLoading) {
    return (
      <div className="mx-auto max-w-300 p-8">
        <LoadingSkeleton className="h-150" />
      </div>
    );
  }

  if (!nftQuery.data) {
    return (
      <div className="mx-auto max-w-300 p-12 text-center">
        <h1 className="font-display text-2xl">NFT não encontrado</h1>

        <Link
          to="/"
          className="mt-4 inline-block text-accent"
        >
          Voltar para o catálogo
        </Link>
      </div>
    );
  }

  const nft = nftQuery.data;
  const favorite = favorites.data?.includes(nft.id) ?? false;
  const max = Math.max(1, Math.min(nft.availableQuantity, nft.maxQuantityPerOrder));
  const related = (collectionQuery.data?.items ?? []).filter((x) => x.id !== nft.id).slice(0, 5);

  return (
    <div className="bg-background">
      <div className="mx-auto max-w-300 px-0 pb-20 pt-0">
        <MobilePageHeader
          title=""
          backTo="/"
          showFavorite
          favoriteActive={favorite}
          onToggleFavorite={() => {
            if (!getSessionToken()) {
              void navigate({ to: "/login", search: { redirect: `/nfts/${nftId}` } });
              return;
            }

            favMutation.mutate();
          }}
        />

        <div className="px-6 md:px-0">
          <nav className="hidden pt-0 text-[12px] md:block">
            <Link to="/">Início</Link>

            <span className="mx-2">/</span>

            <span>Mercado</span>
          </nav>

          <div className="mt-4 grid gap-6 lg:grid-cols-[72px_390px_minmax(0,1fr)]">
            <div className="hidden lg:grid lg:gap-3">
              {nft.gallery.slice(0, 4).map((im, i) => (
                <img
                  key={im + i}
                  src={im}
                  alt=""
                  className="size-17 rounded-control object-cover"
                />
              ))}
            </div>

            <div className="relative overflow-hidden rounded-control bg-surface p-3 md:p-0">
              <img
                src={nft.image}
                alt={nft.name}
                className="aspect-square w-full rounded-card object-cover"
              />

              <button
                type="button"
                aria-label="Ampliar imagem"
                className="absolute right-5 top-5 grid size-8 place-items-center rounded-full bg-surface/80 text-foreground"
              >
                <Search size={16} />
              </button>
            </div>

            <section className="rounded-t-[25px] bg-surface px-6 pb-5 pt-5 md:rounded-none md:bg-transparent md:px-0 md:pt-0">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="font-display text-[24px] font-bold leading-tight md:text-[25px]">{nft.name}</h1>

                  <div className="mt-2 flex items-center gap-2">
                    <span className="font-display text-[20px] font-bold text-accent">{nft.priceEth} ETH</span>

                    <span className="text-accent">★★★★★</span>

                    <span className="text-[11px] text-foreground">{nft.reviewCount} avaliações de colecionadores</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (!getSessionToken()) {
                      void navigate({ to: "/login", search: { redirect: `/nfts/${nftId}` } });
                      return;
                    }
                    favMutation.mutate();
                  }}
                  aria-label={favorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                  className="hidden size-8 place-items-center rounded-control border border-accent text-accent md:grid"
                >
                  <Heart
                    size={16}
                    fill={favorite ? "currentColor" : "none"}
                  />
                </button>
              </div>

              <div className="mt-4 border-t border-border pt-4">
                <h2 className="font-display text-[14px] font-bold">Sobre este NFT:</h2>

                <p className="mt-2 text-[11px] leading-5 text-muted">
                  Um colecionável digital finalizado à mão da coleção Kurio Editions, verificado na Ethereum, com arte desbloqueável e acesso para
                  colecionadores.
                </p>

                <p className="mt-2 text-[11px]">Edição:</p>
                <div className="mt-1 flex gap-1.5">
                  <span className="rounded-full border border-border-strong px-2 py-1 text-[9px]">1/1</span>

                  <span className="rounded-full border border-border-strong px-2 py-1 text-[9px]">1/10</span>

                  <span className="rounded-full border border-accent px-2 py-1 text-[9px] text-accent">1/50</span>

                  <span className="rounded-full border border-border-strong px-2 py-1 text-[9px]">ABERTA</span>
                </div>

                <div className="mt-4 flex items-center gap-2">
                  <button
                    type="button"
                    aria-label="Diminuir quantidade"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                    className="grid size-9 place-items-center rounded-control bg-accent text-accent-foreground disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Minus size={15} />
                  </button>

                  <span>{quantity}</span>

                  <button
                    type="button"
                    aria-label="Aumentar quantidade"
                    onClick={() => setQuantity(Math.min(max, quantity + 1))}
                    disabled={quantity >= max}
                    className="grid size-9 place-items-center rounded-control bg-accent text-accent-foreground disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Plus size={15} />
                  </button>

                  <Button
                    type="button"
                    onClick={() => cartMutation.mutate()}
                    disabled={cartMutation.isPending || nft.edition.status === "sold_out"}
                    className="ml-auto h-9 px-7"
                  >
                    {nft.edition.status === "sold_out" ? "Esgotado" : "COMPRAR"}
                  </Button>

                  <button
                    type="button"
                    onClick={() => {
                      if (!getSessionToken()) {
                        void navigate({ to: "/login", search: { redirect: `/nfts/${nftId}` } });
                        return;
                      }
                      favMutation.mutate();
                    }}
                    aria-label={favorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                    className="hidden h-9 rounded-control border border-accent px-4 text-[10px] md:block"
                  >
                    <Heart
                      size={13}
                      className="mr-1 inline"
                    />{" "}
                    Favoritar
                  </button>
                </div>

                {cartError && (
                  <p
                    role="alert"
                    className="mt-3 text-[11px] leading-4 text-danger"
                  >
                    {cartError}
                  </p>
                )}

                <div className="mt-5 grid gap-2 text-[11px] text-muted">
                  <p>ID do token: #{nft.id.slice(-4)}</p>

                  <p>Coleção: {nft.collection}</p>

                  <p>Atributos: Óculos, Esmeralda, Raro</p>

                  <p className="text-foreground">Compartilhar este NFT: in ✉ ♥</p>
                </div>
              </div>
            </section>
          </div>

          <section className="mt-12">
            <div className="flex gap-7 border-b border-border text-[12px] font-bold">
              <button
                type="button"
                onClick={() => setActiveTab("details")}
                className={`pb-3 ${activeTab === "details" ? "border-b-2 border-accent text-accent" : "text-foreground"}`}
              >
                Detalhes do NFT
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("reviews")}
                className={`pb-3 ${activeTab === "reviews" ? "text-accent" : "text-foreground"}`}
              >
                Avaliações de colecionadores ({nft.reviewCount})
              </button>
            </div>

            <div className="py-5 text-[11px] leading-6 text-muted">
              <p>
                {nft.name} é uma obra digital {nft.edition.current}/{nft.edition.total} finalizada à mão da coleção Kurio Editions. Cada atributo fica
                armazenado nos metadados do token e verificado na Ethereum. A obra explora identidade, movimento e luz em um mundo digital sem
                fronteiras.
              </p>

              <p className="mt-4">
                A propriedade inclui a arte em alta resolução, lançamentos exclusivos para colecionadores e um registro permanente de procedência
                registrada na rede.
              </p>

              <p className="mt-4">
                <b className="text-foreground">Rede:</b>
                Cunhado na Ethereum com procedência imutável e metadados armazenados no IPFS.
              </p>

              <p className="mt-3">
                <b className="text-foreground">Contrato:</b>
                Direitos autorais do criador: 5% nas vendas secundárias, pagos automaticamente pelos mercados compatíveis.
              </p>

              <p className="mt-3">
                <b className="text-foreground">Direitos autorais:</b>
                0x7A42...19E8 · Contrato inteligente ERC-721 verificado.
              </p>
            </div>
          </section>

          <section className="mt-9">
            <div className="flex items-end justify-between border-b border-border pb-2">
              <h2 className="font-display text-[14px] font-bold text-accent">Mais desta coleção</h2>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-5">
              {related.map((item) => (
                <Link
                  key={item.id}
                  to="/nfts/$nftId"
                  params={{ nftId: item.id }}
                  className="min-w-0"
                >
                  <div className="overflow-hidden rounded-control bg-surface p-3">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="aspect-square w-full rounded-control object-cover"
                    />
                  </div>

                  <p className="mt-2 truncate text-[11px]">{item.name}</p>

                  <p className="text-[11px] font-bold text-accent">{item.priceEth} ETH</p>
                </Link>
              ))}
            </div>

            <div className="mt-4 flex justify-center gap-1.5">
              <span className="size-2 rounded-full border border-accent" />

              <span className="size-2 rounded-full bg-accent" />

              <span className="size-2 rounded-full border border-accent" />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
const Route = createFileRoute("/nfts/$nftId")({ component: NftDetailPage });

export { Route };
