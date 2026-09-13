import { apiClient } from "@/lib/axios";
import type { CreateOrderInput, Order } from "@/types";

/* - Criação idempotente: reenviar a mesma chave retorna o mesmo pedido em vez de duplicar a compra. - */

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

export { createOrder, fetchOrder };
