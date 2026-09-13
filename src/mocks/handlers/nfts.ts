import { http, HttpResponse } from "msw";
import { decimal } from "@/lib/decimal";
import type { NFT, NFTSortOption } from "@/types";
import { mockDatabase } from "../db";
import { applyNetworkConditions, createApiErrorResponse } from "./shared";

const sortNftList = (nftList: NFT[], sortOption: NFTSortOption) => {
  const sortedNftList = [...nftList];

  switch (sortOption) {
    case "price_asc":
      return sortedNftList.sort((firstNft, secondNft) => decimal.compare(firstNft.priceEth, secondNft.priceEth));

    case "price_desc":
      return sortedNftList.sort((firstNft, secondNft) => decimal.compare(secondNft.priceEth, firstNft.priceEth));

    case "recent":
      return sortedNftList.sort((firstNft, secondNft) => new Date(secondNft.createdAt).getTime() - new Date(firstNft.createdAt).getTime());

    case "rating_desc":
      return sortedNftList.sort((firstNft, secondNft) => secondNft.rating - firstNft.rating);

    default:
      return sortedNftList;
  }
};

const nftHandlers = [
  http.get("/api/nfts", async ({ request }) => {
    await applyNetworkConditions();

    const searchParameters = new URL(request.url).searchParams;
    const searchTerm = searchParameters.get("search")?.trim().toLowerCase();
    const collectionId = searchParameters.get("collectionId");
    const minimumPriceEth = searchParameters.get("minPrice");
    const maximumPriceEth = searchParameters.get("maxPrice");
    const selectedTags = searchParameters.getAll("tags") as NFT["tags"];
    const sortOption = (searchParameters.get("sort") as NFTSortOption | null) ?? "relevance";
    const requestedPage = Number(searchParameters.get("page") ?? "1");
    const requestedPageSize = Number(searchParameters.get("pageSize") ?? "12");
    const currentPage = Math.max(1, Number.isFinite(requestedPage) ? requestedPage : 1);
    const pageSize = Math.min(48, Math.max(1, Number.isFinite(requestedPageSize) ? requestedPageSize : 12));

    let filteredNftList = mockDatabase.state.nfts;

    if (searchTerm) {
      filteredNftList = filteredNftList.filter(
        (nft) => nft.name.toLowerCase().includes(searchTerm) || nft.collection.toLowerCase().includes(searchTerm),
      );
    }

    if (collectionId) {
      filteredNftList = filteredNftList.filter((nft) => nft.collectionId === collectionId);
    }

    if (minimumPriceEth) {
      filteredNftList = filteredNftList.filter((nft) => decimal.compare(nft.priceEth, minimumPriceEth) >= 0);
    }

    if (maximumPriceEth) {
      filteredNftList = filteredNftList.filter((nft) => decimal.compare(nft.priceEth, maximumPriceEth) <= 0);
    }

    if (selectedTags.length > 0) {
      filteredNftList = filteredNftList.filter((nft) => selectedTags.every((selectedTag) => nft.tags.includes(selectedTag)));
    }

    const sortedNftList = sortNftList(filteredNftList, sortOption);
    const totalNftCount = sortedNftList.length;
    const totalPageCount = Math.max(1, Math.ceil(totalNftCount / pageSize));
    const safePage = Math.min(currentPage, totalPageCount);
    const pageStartIndex = (safePage - 1) * pageSize;
    const pageNftList = sortedNftList.slice(pageStartIndex, pageStartIndex + pageSize);

    return HttpResponse.json({
      items: pageNftList,
      page: safePage,
      pageSize,
      total: totalNftCount,
      totalPages: totalPageCount,
    });
  }),

  http.get("/api/nfts/:id", async ({ params }) => {
    await applyNetworkConditions();

    const requestedNft = mockDatabase.state.nfts.find((nft) => nft.id === params.id);

    if (!requestedNft) {
      return createApiErrorResponse("NOT_FOUND", "NFT não encontrado.");
    }

    return HttpResponse.json(requestedNft);
  }),
];

export { nftHandlers };
