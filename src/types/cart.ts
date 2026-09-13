import type { DecimalString } from "./nft";

export interface AddCartItemInput {
  nftId: string;
  quantity: number;
}

export interface UpdateCartItemInput {
  quantity: number;
}

export interface ApplyCouponInput {
  code: string;
}

export interface CartItem {
  id: string;
  nftId: string;
  nftName: string;
  nftImage: string;
  editionCurrent: number;
  editionTotal: number;
  quantity: number;
  unitPriceEth: DecimalString;
  priceVersion: number;
  maxQuantity: number;
  available: boolean;
}

export interface Cart {
  id: string;
  items: CartItem[];
  couponCode: string | null;
  updatedAt: string;
}

export interface Quote {
  subtotalEth: DecimalString;
  discountEth: DecimalString;
  networkFeeEth: DecimalString;
  totalEth: DecimalString;
  couponCode: string | null;
  couponStatus: "applied" | "invalid" | "expired" | null;
  stale: boolean;
  expiresAt: string;
}
