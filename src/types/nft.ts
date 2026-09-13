export type DecimalString = string;

export type NFTSortOption = "relevance" | "price_asc" | "price_desc" | "recent" | "rating_desc";

export interface NFTAttribute {
  trait: string;
  value: string;
}

export interface NFTEdition {
  current: number;
  total: number;
  status: "available" | "sold_out";
}

export interface NFT {
  id: string;
  slug: string;
  name: string;
  collection: string;
  collectionId: string;
  image: string;
  gallery: string[];
  description: string;
  priceEth: DecimalString;
  originalPriceEth?: DecimalString;
  edition: NFTEdition;
  attributes: NFTAttribute[];
  rating: number;
  reviewCount: number;
  tags: Array<"novo" | "em-alta" | "raro">;
  creator: {
    id: string;
    name: string;
    avatar: string;
  };
  version: number;
  availableQuantity: number;
  maxQuantityPerOrder: number;
  createdAt: string;
}

export interface NFTFilters {
  search?: string;
  collectionId?: string;
  minPrice?: string;
  maxPrice?: string;
  tags?: NFT["tags"];
  sort?: NFTSortOption;
  page?: number;
  pageSize?: number;
}

export interface NFTUpdatedPayload {
  nftId: string;
  priceEth?: DecimalString;
  edition?: NFTEdition;
  availableQuantity?: number;
  version: number;
}
