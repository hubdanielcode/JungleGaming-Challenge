import { apiClient } from "@/lib/axios";
import type { NFT, NFTFilters, Paginated } from "@/types";

const fetchNfts = async (nftFilters: NFTFilters): Promise<Paginated<NFT>> => {
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

  const nftListResponse = await apiClient.get<Paginated<NFT>>(`/nfts?${searchParameters.toString()}`);

  return nftListResponse.data;
};

const fetchSingleNft = async (nftId: string): Promise<NFT> => {
  const nftResponse = await apiClient.get<NFT>(`/nfts/${nftId}`);

  return nftResponse.data;
};

export { fetchNfts, fetchSingleNft };
