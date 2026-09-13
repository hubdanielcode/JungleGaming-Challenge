import { apiClient } from "@/lib/axios";
import type { CreateOrderInput, Order, Wallet } from "@/types";

const fetchWallets = async (): Promise<Wallet[]> => {
  const walletsResponse = await apiClient.get<{ items: Wallet[] }>("/wallets");

  return walletsResponse.data.items;
};

const createOrder = async (createOrderInput: CreateOrderInput): Promise<Order> => {
  const orderResponse = await apiClient.post<Order>("/orders", createOrderInput, {
    headers: { "Idempotency-Key": createOrderInput.idempotencyKey },
  });

  return orderResponse.data;
};

const fetchOrder = async (orderId: string): Promise<Order> => {
  const orderResponse = await apiClient.get<Order>(`/orders/${orderId}`);

  return orderResponse.data;
};

export { fetchWallets, createOrder, fetchOrder };
