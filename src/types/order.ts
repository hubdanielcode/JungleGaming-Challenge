import type { DecimalString } from "./nft";
import type { WalletNetwork, WalletProvider } from "./user";

export type OrderStatus = "pending" | "confirmed" | "declined";

export interface OrderItemSnapshot {
  nftId: string;
  nftName: string;
  nftImage: string;
  edition: string;
  quantity: number;
  unitPriceEth: DecimalString;
}

export interface Order {
  id: string;
  idempotencyKey: string;
  status: OrderStatus;
  items: OrderItemSnapshot[];
  subtotalEth: DecimalString;
  discountEth: DecimalString;
  networkFeeEth: DecimalString;
  totalEth: DecimalString;
  couponCode: string | null;
  walletAddress: string;
  walletProvider: WalletProvider;
  network: WalletNetwork;
  transactionRef: string | null;
  explorerUrl: string | null;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface CreateOrderInput {
  idempotencyKey: string;
  walletId: string;
  network: WalletNetwork;
  walletProvider: WalletProvider;
  collectorName: string;
  collectorEmail: string;
  couponCode: string | null;
}

export interface OrderUpdatedPayload {
  orderId: string;
  status: OrderStatus;
  version: number;
  transactionRef?: string | null;
  explorerUrl?: string | null;
}
