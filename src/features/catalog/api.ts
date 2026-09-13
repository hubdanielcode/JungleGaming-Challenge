import { apiClient } from "@/lib/axios";
import type { NFT, NFTFilters, Paginated } from "@/types";

/* - O `signal` é repassado pelo TanStack Query a cada `queryFn` e cancela a requisição em andamento quando a query key muda antes da resposta anterior chegar (ex.: o usuário digita rápido na busca ou alterna filtros em sequência) — evita que uma resposta obsoleta sobrescreva um estado mais recente. - */

const fetchNfts = async (nftFilters: NFTFilters, signal?: AbortSignal): Promise<Paginated<NFT>> => {
  const searchParameters = new URLSearchParams();

  if (nftFilters.search) {
    searchParameters.set("search", nftFilters.search);
  }

  if (nftFilters.collectionId) {
    searchParameters.set("collectionId", nftFilters.collectionId);
  }

  if (nftFilters.minPrice) {
    searchParameters.set("minPrice", nftFilters.minPrice);
  }

  if (nftFilters.maxPrice) {
    searchParameters.set("maxPrice", nftFilters.maxPrice);
  }

  nftFilters.tags?.forEach((tag) => searchParameters.append("tags", tag));
  searchParameters.set("sort", nftFilters.sort ?? "relevance");
  searchParameters.set("page", String(nftFilters.page ?? 1));
  searchParameters.set("pageSize", String(nftFilters.pageSize ?? 12));

  const nftListResponse = await apiClient.get<Paginated<NFT>>(`/nfts?${searchParameters.toString()}`, { signal });

  return nftListResponse.data;
};

const fetchSingleNft = async (nftId: string, signal?: AbortSignal): Promise<NFT> => {
  const nftResponse = await apiClient.get<NFT>(`/nfts/${nftId}`, { signal });

  return nftResponse.data;
};

export { fetchNfts, fetchSingleNft };
