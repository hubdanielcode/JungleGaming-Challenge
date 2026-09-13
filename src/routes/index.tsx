import { useMemo, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { ArrowRight, Search, SlidersHorizontal } from "lucide-react";
import type { NFT, NFTFilters, NFTSortOption } from "@/types";
import { fetchNfts, fetchSingleNft } from "@/features/catalog/api";
import { addCartItem } from "@/features/cart/api";
import { addFavoriteNft, fetchFavoriteNftIds, removeFavoriteNft } from "@/features/favorites/api";
import { queryKeys } from "@/lib/queryClient";
import { getSessionToken } from "@/lib/session";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Slider } from "@/components/ui/Slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { LoadingSkeleton } from "@/components/common/LoadingSkeleton";
import { NftCard } from "@/components/common/NftCard";
import { MobileHomeToolbar } from "@/components/common/MobileHomeToolbar";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";

interface HomeSearchParameters {
  search?: string;
  collectionId?: string;
  minPrice?: string;
  maxPrice?: string;
  sort?: NFTSortOption;
  page?: number;
  favorites?: string;
  highlight?: "novo" | "em-alta";
}

/*
 * - Faixa de preço absoluta usada para posicionar o slider visual do Figma ("Preço: 0,02 - 12,30 ETH").
 *   Os limites batem com o menor e o maior preço das fixtures do catálogo mockado. -
 */

const CATALOG_MINIMUM_PRICE_IN_ETH = 0.02;
const CATALOG_MAXIMUM_PRICE_IN_ETH = 12.3;

/*
 * - O Figma desenha uma taxonomia de categorias e de redes mais ampla do que o catálogo mockado
 *   modela hoje (duas coleções: Kurio Apes e Kurio Editions, sem dimensão de rede por NFT). Nesta
 *   fase (fidelidade visual) reproduzimos a composição exatamente como desenhada, mas apenas os
 *   itens marcados com "collectionId" filtram o catálogo de verdade; os demais mantêm apenas o
 *   estado de marcação local, aguardando a decisão da Fase 2 sobre expandir o modelo de dados ou
 *   simplificar a taxonomia (ver ARCHITECTURE.md). -
 */

interface CatalogSidebarCollectionItem {
  label: string;
  count: number;
  collectionId?: string;
}

const catalogSidebarCollections: CatalogSidebarCollectionItem[] = [
  { label: "Arte digital", count: 33, collectionId: "kurio-editions" },
  { label: "Fotografia", count: 12 },
  { label: "Música", count: 65 },
  { label: "Arte 3D", count: 39 },
  { label: "Colecionáveis", count: 23, collectionId: "kurio-apes" },
  { label: "Generativa", count: 17 },
  { label: "Jogos", count: 19 },
  { label: "Assinaturas", count: 13 },
  { label: "Utilidade", count: 18 },
];

const catalogSidebarNetworks = [
  { label: "Ethereum", count: 119 },
  { label: "Polygon", count: 78 },
  { label: "Solana", count: 86 },
];

const catalogPromoBanners = [
  {
    title: "Lançamentos gênesis de edição limitada",
    description: "Colecione edições escassas diretamente dos criadores antes da revelação pública.",
    image: "/images/nfts/emerald-ape-042.png",
  },
  {
    title: "Arte digital selecionada e muito mais",
    description: "Explore novos artistas, coleções verificadas e obras digitais que definem a cultura.",
    image: "/images/nfts/neon-vessel-552.png",
  },
];

const catalogJournalPosts = [
  {
    publishedAtLabel: "12 de setembro",
    readingTimeLabel: "Leitura de 6 min",
    title: "Como funciona a propriedade de NFTs",
    excerpt: "Aprenda a colecionar, negociar e verificar ativos digitais.",
    image: "/images/nfts/neon-vessel-552.png",
  },
  {
    publishedAtLabel: "13 de setembro",
    readingTimeLabel: "Leitura de 2 min",
    title: "10 artistas digitais para acompanhar",
    excerpt: "Conheça criadores que moldam a cultura digital.",
    image: "/images/nfts/emerald-ape-042.png",
  },
  {
    publishedAtLabel: "15 de setembro",
    readingTimeLabel: "Leitura de 3 min",
    title: "Raridade, atributos e procedência",
    excerpt: "Entenda raridade, procedência, direitos autorais e utilidade.",
    image: "/images/nfts/sage-nomad-009.png",
  },
  {
    publishedAtLabel: "15 de setembro",
    readingTimeLabel: "Leitura de 2 min",
    title: "Como proteger sua carteira",
    excerpt: "Proteja sua carteira, seus ativos e sua identidade.",
    image: "/images/nfts/golden-beat-207.png",
  },
];

const catalogSortOptionLabels: Record<NFTSortOption, string> = {
  relevance: "Listados recentemente",
  recent: "Mais recentes",
  price_asc: "Menor preço",
  price_desc: "Maior preço",
  rating_desc: "Melhor avaliação",
};

/* - Página editorial/auxiliar fora do escopo da entrega: avisa o colecionador em vez de simular uma navegação inexistente. */

const HomePage = () => {
  const navigate = useNavigate();
  const searchParameters = useSearch({ from: "/" });
  const queryClient = useQueryClient();
  const [searchInput, setSearchInput] = useState(searchParameters.search ?? "");
  const [isFilterPanelOpenOnMobile, setIsFilterPanelOpenOnMobile] = useState(false);
  const [priceRangeDraft, setPriceRangeDraft] = useState<[number, number]>([
    Number(searchParameters.minPrice ?? CATALOG_MINIMUM_PRICE_IN_ETH),
    Number(searchParameters.maxPrice ?? CATALOG_MAXIMUM_PRICE_IN_ETH),
  ]);

  /* - Marcações puramente visuais das categorias que ainda não têm correspondência real no catálogo mockado (ver comentário acima). - */
  const [unwiredCategoryLabels, setUnwiredCategoryLabels] = useState<string[]>([]);
  const [unwiredNetworkLabels, setUnwiredNetworkLabels] = useState<string[]>([]);

  /* - Reajusta o campo de busca quando o parâmetro da URL muda por fora (navegação pelo histórico, limpar filtros etc.), sem depender de um efeito. O valor anterior do parâmetro é comparado DURANTE A PRÓPRIA RENDERIZAÇÃO, seguindo o padrão recomendado para "ajustar estado quando uma prop muda". - */

  const [lastSyncedSearchParameter, setLastSyncedSearchParameter] = useState(searchParameters.search);
  if (searchParameters.search !== lastSyncedSearchParameter) {
    setLastSyncedSearchParameter(searchParameters.search);
    setSearchInput(searchParameters.search ?? "");
  }

  const nftFilters = useMemo<NFTFilters>(
    () => ({
      search: searchParameters.search,
      collectionId: searchParameters.collectionId,
      minPrice: searchParameters.minPrice,
      maxPrice: searchParameters.maxPrice,
      tags: searchParameters.highlight ? [searchParameters.highlight] : undefined,
      sort: searchParameters.sort ?? "relevance",
      page: searchParameters.page ?? 1,
      pageSize: 9,
    }),

    [
      searchParameters.collectionId,
      searchParameters.highlight,
      searchParameters.maxPrice,
      searchParameters.minPrice,
      searchParameters.page,
      searchParameters.search,
      searchParameters.sort,
    ],
  );

  const nftListQuery = useQuery({
    queryKey: queryKeys.nfts.list(nftFilters),
    queryFn: () => fetchNfts(nftFilters),
  });

  const featuredNftQuery = useQuery({
    queryKey: queryKeys.nfts.detail("sage-nomad-009"),
    queryFn: () => fetchSingleNft("sage-nomad-009"),
  });

  const favoriteNftIdsQuery = useQuery({
    queryKey: queryKeys.favorites.all(),
    queryFn: fetchFavoriteNftIds,
    enabled: Boolean(getSessionToken()),
  });

  const favoriteMutation = useMutation({
    mutationFn: async (nftId: string) => {
      const isFavorite = favoriteNftIdsQuery.data?.includes(nftId) ?? false;
      return isFavorite ? removeFavoriteNft(nftId) : addFavoriteNft(nftId);
    },

    onMutate: async (nftId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.favorites.all() });
      const previousFavoriteNftIds = queryClient.getQueryData<string[]>(queryKeys.favorites.all()) ?? [];
      const isFavorite = previousFavoriteNftIds.includes(nftId);

      const optimisticFavoriteNftIds = isFavorite
        ? previousFavoriteNftIds.filter((favoriteNftId) => favoriteNftId !== nftId)
        : [...previousFavoriteNftIds, nftId];
      queryClient.setQueryData(queryKeys.favorites.all(), optimisticFavoriteNftIds);

      return { previousFavoriteNftIds };
    },

    onError: (_error, _nftId, context) => {
      if (context) {
        queryClient.setQueryData(queryKeys.favorites.all(), context.previousFavoriteNftIds);
      }
    },

    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.favorites.all() }),
  });

  const cartMutation = useMutation({
    mutationFn: (nftId: string) => addCartItem({ nftId, quantity: 1 }),
    onSuccess: async (cart) => {
      queryClient.setQueryData(queryKeys.cart.all(), cart);
      await navigate({ to: "/cart" });
    },
  });

  const updateSearch = (nextSearch: Partial<HomeSearchParameters>) => {
    void navigate({
      to: "/",
      search: {
        ...searchParameters,
        ...nextSearch,
        page: 1,
      },
    });
  };

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    updateSearch({ search: searchInput.trim() || undefined });
  };

  const handleToggleSidebarCategory = (categoryItem: CatalogSidebarCollectionItem) => {
    if (categoryItem.collectionId) {
      updateSearch({ collectionId: searchParameters.collectionId === categoryItem.collectionId ? undefined : categoryItem.collectionId });
      return;
    }

    setUnwiredCategoryLabels((currentLabels) =>
      currentLabels.includes(categoryItem.label)
        ? currentLabels.filter((label) => label !== categoryItem.label)
        : [...currentLabels, categoryItem.label],
    );
  };

  const handleToggleSidebarNetwork = (networkLabel: string) => {
    setUnwiredNetworkLabels((currentLabels) =>
      currentLabels.includes(networkLabel) ? currentLabels.filter((label) => label !== networkLabel) : [...currentLabels, networkLabel],
    );
  };

  const handleApplyPriceRange = () => {
    updateSearch({
      minPrice: priceRangeDraft[0] > CATALOG_MINIMUM_PRICE_IN_ETH ? priceRangeDraft[0].toFixed(2) : undefined,
      maxPrice: priceRangeDraft[1] < CATALOG_MAXIMUM_PRICE_IN_ETH ? priceRangeDraft[1].toFixed(2) : undefined,
    });
  };

  const activeContentTab = searchParameters.highlight ?? "all";

  const visibleNftList: NFT[] =
    searchParameters.favorites === "true"
      ? (nftListQuery.data?.items.filter((nft) => favoriteNftIdsQuery.data?.includes(nft.id)) ?? [])
      : (nftListQuery.data?.items ?? []);

  const catalogSidebarContent = (
    <div className="grid gap-8">
      <div>
        <h3 className="font-display text-lg font-bold text-foreground">Coleções</h3>

        <ul className="mt-4 grid gap-3">
          {catalogSidebarCollections.map((categoryItem) => {
            const isChecked = categoryItem.collectionId
              ? searchParameters.collectionId === categoryItem.collectionId
              : unwiredCategoryLabels.includes(categoryItem.label);

            return (
              <li key={categoryItem.label}>
                <label className="flex cursor-pointer items-center justify-between gap-3 text-sm text-muted transition-colors hover:text-foreground">
                  <span className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleToggleSidebarCategory(categoryItem)}
                      className="size-4 accent-accent"
                    />

                    <span className={isChecked ? "text-accent" : undefined}>{categoryItem.label}</span>
                  </span>

                  <span className="text-xs text-muted-2">({categoryItem.count})</span>
                </label>
              </li>
            );
          })}
        </ul>
      </div>

      <div>
        <h3 className="font-display text-lg font-bold text-foreground">Faixa de preço</h3>

        <div className="mt-5 px-1">
          <Slider
            min={CATALOG_MINIMUM_PRICE_IN_ETH}
            max={CATALOG_MAXIMUM_PRICE_IN_ETH}
            step={0.01}
            value={priceRangeDraft}
            onValueChange={(nextValue) => setPriceRangeDraft(nextValue as [number, number])}
            aria-label="Faixa de preço em ETH"
          />
        </div>

        <p className="mt-2 font-mono text-sm text-foreground">
          Preço: {priceRangeDraft[0].toFixed(2).replace(".", ",")} - {priceRangeDraft[1].toFixed(2).replace(".", ",")} ETH
        </p>

        <Button
          variant="secondary"
          className="mt-3 w-full"
          onClick={handleApplyPriceRange}
        >
          Aplicar
        </Button>
      </div>

      <div>
        <h3 className="font-display text-lg font-bold text-foreground">Rede</h3>

        <ul className="mt-4 grid gap-3">
          {catalogSidebarNetworks.map((networkItem) => (
            <li key={networkItem.label}>
              <label className="flex cursor-pointer items-center justify-between gap-3 text-sm text-muted transition-colors hover:text-foreground">
                <span className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={unwiredNetworkLabels.includes(networkItem.label)}
                    onChange={() => handleToggleSidebarNetwork(networkItem.label)}
                    className="size-4 accent-accent"
                  />

                  <span className={unwiredNetworkLabels.includes(networkItem.label) ? "text-accent" : undefined}>{networkItem.label}</span>
                </span>

                <span className="text-xs text-muted-2">({networkItem.count})</span>
              </label>
            </li>
          ))}
        </ul>
      </div>

      <div className="overflow-hidden rounded-card border border-border bg-background">
        <div className="p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">NFT em destaque</p>

          <p className="mt-1 font-display text-lg font-bold text-accent">Oferta limitada</p>
        </div>

        {featuredNftQuery.data ? (
          <Link
            to="/nfts/$nftId"
            params={{ nftId: featuredNftQuery.data.id }}
            className="block"
          >
            <img
              src={featuredNftQuery.data.image}
              alt={featuredNftQuery.data.name}
              className="aspect-square w-full object-cover"
            />
          </Link>
        ) : (
          <LoadingSkeleton className="aspect-square w-full rounded-none" />
        )}
      </div>
    </div>
  );

  return (
    <div className="mx-auto w-full max-w-300 px-6 pb-40 pt-10 md:px-0 md:pb-24 md:pt-10">
      <MobileHomeToolbar
        value={searchInput}
        onChange={setSearchInput}
        onSubmit={handleSearchSubmit}
        onOpenFilters={() => setIsFilterPanelOpenOnMobile(true)}
      />

      <section className="relative md:grid md:min-h-112.5 md:grid-cols-[minmax(0,1fr)_450px] md:items-center md:gap-10">
        <div className="relative z-10 min-h-47.5 overflow-hidden rounded-[26px] bg-surface-2 px-4 py-4 md:min-h-0 md:overflow-visible md:rounded-none md:bg-transparent md:px-0 md:py-0">
          <div className="max-w-150 md:pl-10">
            <p className="text-[10px] tracking-[0.08em] text-foreground md:text-xs">Bem-vindo à Kurio</p>

            <h1 className="mt-3 max-w-140 font-display text-[25px] font-bold uppercase leading-[1.08] text-foreground md:mt-4 md:text-[43px]">
              <span className="md:hidden">Seja dono da cultura digital</span>

              <span className="hidden md:inline">Seja dono do futuro da arte digital</span>
            </h1>

            <p className="mt-3 max-w-120 text-[10px] leading-4 text-muted md:mt-5 md:text-[11px] md:leading-5">
              Descubra NFTs selecionados de criadores emergentes e consagrados. Colecione arte digital rara, apoie artistas e tenha uma parte da
              cultura da internet.
            </p>

            <a
              href="#catalogo"
              className="mt-3 inline-flex items-center rounded-control bg-accent px-4 py-2 text-[9px] font-bold uppercase text-accent-foreground md:mt-6 md:px-5 md:py-3 md:text-[10px]"
            >
              Explorar{" "}
              <ArrowRight
                size={12}
                className="ml-1"
              />
            </a>
          </div>

          <div className="pointer-events-none absolute bottom-0 right-0 top-0 w-1/2 overflow-hidden rounded-r-[26px] md:hidden">
            <img
              src="/images/nfts/emerald-ape-042.png"
              alt="Emerald Ape #042"
              className="absolute right-4 top-3 size-36 rounded-[14px] object-cover object-center"
            />

            <img
              src="/images/nfts/sage-nomad-009.png"
              alt="Sage Nomad #009"
              className="absolute bottom-4 left-1 size-16 rounded-card object-cover shadow-lg"
            />
          </div>
        </div>

        <div className="hidden overflow-hidden rounded-[20px] bg-surface-2 md:block">
          <img
            src="/images/nfts/kurio-hero.png"
            alt="Emerald Ape"
            className="block aspect-square w-full object-cover"
          />
        </div>

        <div className="absolute bottom-1 left-0 right-0 z-20 flex justify-center gap-2 md:bottom-7">
          <span className="size-1.5 rounded-full bg-accent" />

          <span className="size-1.5 rounded-full bg-muted-2" />

          <span className="size-1.5 rounded-full bg-muted-2" />
        </div>
      </section>

      <section
        id="catalogo"
        className="mt-24 grid gap-12 lg:grid-cols-[310px_minmax(0,1fr)]"
      >
        <aside className="hidden lg:block">{catalogSidebarContent}</aside>

        <div>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <Tabs
              value={activeContentTab}
              onValueChange={(nextTab) => updateSearch({ highlight: nextTab === "all" ? undefined : (nextTab as "novo" | "em-alta") })}
            >
              <TabsList
                variant="underline"
                className="max-w-full gap-5 overflow-x-auto"
              >
                <TabsTrigger value="all">Todos os NFTs</TabsTrigger>
                <TabsTrigger value="novo">Novos lançamentos</TabsTrigger>
                <TabsTrigger value="em-alta">Em alta</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex items-center gap-2">
              <span className="hidden text-xs text-muted sm:inline">Ordenar por:</span>

              <Select
                value={searchParameters.sort ?? "relevance"}
                onValueChange={(nextSort) => updateSearch({ sort: nextSort as NFTSortOption })}
              >
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  {Object.entries(catalogSortOptionLabels).map(([sortValue, sortLabel]) => (
                    <SelectItem
                      key={sortValue}
                      value={sortValue}
                    >
                      {sortLabel}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                type="button"
                variant="secondary"
                className="shrink-0 px-3 lg:hidden"
                onClick={() => setIsFilterPanelOpenOnMobile((currentState) => !currentState)}
                aria-label="Mostrar filtros"
                aria-expanded={isFilterPanelOpenOnMobile}
              >
                <SlidersHorizontal size={16} />
              </Button>
            </div>
          </div>

          <form
            onSubmit={handleSearchSubmit}
            className="mt-4 hidden gap-2 md:flex"
          >
            <Input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Buscar NFTs ou coleções"
              aria-label="Buscar NFTs ou coleções"
            />

            <Button
              type="submit"
              className="shrink-0 px-4"
              aria-label="Buscar"
            >
              <Search size={16} />
            </Button>
          </form>

          {isFilterPanelOpenOnMobile ? (
            <div className="mt-4 rounded-card border border-border bg-surface p-4 lg:hidden">{catalogSidebarContent}</div>
          ) : null}

          {nftListQuery.isLoading ? (
            <div className="mt-7 grid grid-cols-2 gap-4 lg:grid-cols-3 lg:gap-x-8 lg:gap-y-8">
              {Array.from({ length: 9 }, (_, skeletonIndex) => (
                <LoadingSkeleton
                  key={skeletonIndex}
                  className="aspect-[0.78]"
                />
              ))}
            </div>
          ) : nftListQuery.isError ? (
            <div className="mt-6 rounded-card border border-danger/40 bg-surface p-8 text-center">
              <p className="font-semibold">Não foi possível carregar os NFTs.</p>

              <p className="mt-2 text-sm text-muted">Tente novamente em alguns instantes.</p>

              <Button
                className="mt-5"
                onClick={() => void nftListQuery.refetch()}
              >
                Tentar novamente
              </Button>
            </div>
          ) : visibleNftList.length === 0 ? (
            <div className="mt-6 rounded-card border border-border bg-surface p-12 text-center">
              <p className="font-semibold">Nenhum NFT encontrado.</p>

              <p className="mt-2 text-sm text-muted">Ajuste a busca ou os filtros para continuar explorando.</p>
            </div>
          ) : (
            <div className="mt-7 grid grid-cols-2 gap-4 lg:grid-cols-3 lg:gap-x-8 lg:gap-y-8">
              {visibleNftList.map((nft) => (
                <NftCard
                  key={nft.id}
                  nft={nft}
                  isFavorite={favoriteNftIdsQuery.data?.includes(nft.id) ?? false}
                  isFavoritePending={favoriteMutation.isPending}
                  onToggleFavorite={(nftId) => {
                    if (!getSessionToken()) {
                      void navigate({ to: "/login" });
                      return;
                    }
                    favoriteMutation.mutate(nftId);
                  }}
                  onAddToCart={(nftId) => {
                    if (!getSessionToken()) {
                      void navigate({ to: "/login" });
                      return;
                    }
                    cartMutation.mutate(nftId);
                  }}
                />
              ))}
            </div>
          )}

          {nftListQuery.data && searchParameters.favorites !== "true" && nftListQuery.data.totalPages > 1 ? (
            <nav
              aria-label="Paginação do catálogo"
              className="mt-7 flex items-center justify-end gap-2"
            >
              {Array.from({ length: nftListQuery.data.totalPages }, (_, pageIndex) => pageIndex + 1).map((pageNumber) => (
                <button
                  key={pageNumber}
                  type="button"
                  aria-current={nftListQuery.data.page === pageNumber ? "page" : undefined}
                  onClick={() => updateSearch({ page: pageNumber })}
                  className={`grid size-8 place-items-center rounded-[3px] border border-border text-[11px] font-normal transition-colors ${
                    nftListQuery.data.page === pageNumber
                      ? "bg-accent text-accent-foreground border-accent"
                      : "bg-transparent text-muted hover:text-foreground"
                  }`}
                >
                  {pageNumber}
                </button>
              ))}
              <button
                type="button"
                aria-label="Próxima página"
                disabled={nftListQuery.data.page >= nftListQuery.data.totalPages}
                onClick={() => updateSearch({ page: Math.min(nftListQuery.data.totalPages, nftListQuery.data.page + 1) })}
                className="grid size-8 place-items-center rounded-[3px] border border-border text-[12px] text-muted transition-colors enabled:hover:text-foreground disabled:opacity-40"
              >
                ›
              </button>
            </nav>
          ) : null}
        </div>
      </section>

      <section
        id="criadores"
        className="mt-14 grid gap-8 md:grid-cols-2"
      >
        {catalogPromoBanners.map((banner) => (
          <article
            key={banner.title}
            className="group grid min-h-62.5 overflow-hidden rounded-control bg-surface md:grid-cols-[1fr_1fr] md:h-62.5"
          >
            <img
              src={banner.image}
              alt=""
              className="block h-full min-h-37.5 w-full object-cover"
            />
            <div className="flex flex-col justify-center px-5 py-5 text-center md:px-6">
              <h3 className="font-display text-[14px] font-bold leading-[1.35] text-foreground md:text-[15px]">{banner.title}</h3>
              <p className="mt-3 font-mono text-[9px] leading-4 text-muted md:text-[10px]">{banner.description}</p>
              <a
                href="#catalogo"
                className="mx-auto mt-4 inline-flex items-center gap-1 rounded-control bg-accent px-4 py-2 font-mono text-[9px] font-bold uppercase text-accent-foreground"
              >
                Explorar <ArrowRight size={12} />
              </a>
            </div>
          </article>
        ))}
      </section>

      <section
        id="aprenda"
        className="mt-24"
      >
        <h2 className="text-center font-display text-[24px] font-bold text-foreground md:text-[28px]">Diário da Cunhagem</h2>

        <p className="mx-auto mt-2 max-w-160 text-center font-mono text-[9px] leading-4 text-muted md:text-[10px]">
          Histórias, guias e insights para colecionadores sobre o universo da propriedade digital.
        </p>

        <div className="mt-7 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {catalogJournalPosts.map((journalPost) => (
            <article
              key={journalPost.title}
              className="overflow-hidden rounded-control bg-surface"
            >
              <img
                src={journalPost.image}
                alt=""
                className="block aspect-[1.22] w-full object-cover md:aspect-auto md:h-57"
              />

              <div className="px-4 pb-4 pt-3">
                <p className="font-mono text-[8px] leading-3 text-muted md:text-[9px]">
                  {journalPost.publishedAtLabel} · {journalPost.readingTimeLabel}
                </p>

                <h3 className="mt-3 font-display text-[11px] font-bold leading-tight text-foreground md:text-[12px]">{journalPost.title}</h3>

                <p className="mt-2 font-mono text-[8px] leading-3.5 text-muted md:text-[9px] md:leading-4">{journalPost.excerpt}</p>

                <a
                  href="#catalogo"
                  className="mt-3 inline-flex items-center gap-1 font-mono text-[8px] font-bold uppercase tracking-wide text-accent md:text-[9px]"
                >
                  Ler mais <ArrowRight size={11} />
                </a>
              </div>
            </article>
          ))}
        </div>
      </section>

      <MobileBottomNav />
    </div>
  );
};

const Route = createFileRoute("/")({
  validateSearch: (searchParameters): HomeSearchParameters => ({
    search: typeof searchParameters.search === "string" ? searchParameters.search : undefined,
    collectionId: typeof searchParameters.collectionId === "string" ? searchParameters.collectionId : undefined,
    minPrice: typeof searchParameters.minPrice === "string" ? searchParameters.minPrice : undefined,
    maxPrice: typeof searchParameters.maxPrice === "string" ? searchParameters.maxPrice : undefined,
    sort: typeof searchParameters.sort === "string" ? (searchParameters.sort as NFTSortOption) : undefined,
    page: typeof searchParameters.page === "number" ? searchParameters.page : Number(searchParameters.page ?? 1),
    favorites: typeof searchParameters.favorites === "string" ? searchParameters.favorites : undefined,
    highlight: searchParameters.highlight === "novo" || searchParameters.highlight === "em-alta" ? searchParameters.highlight : undefined,
  }),

  component: HomePage,
});

export { Route };
