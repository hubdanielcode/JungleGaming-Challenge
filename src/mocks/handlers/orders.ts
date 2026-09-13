import { http, HttpResponse } from "msw";
import type { CreateOrderInput, Order, OrderUpdatedPayload } from "@/types";
import { mockDatabase } from "../db";
import { computeCartQuote } from "../quote";
import { getNextEventVersion, realtimeBus } from "../realtimeBus";
import { getScenarioConfig } from "../scenarios";
import { applyNetworkConditions, createApiErrorResponse, getSessionFromRequest } from "./shared";

type StoredOrder = Order & {
  cartOwnerKey: string;
  walletId: string;
  collectorName: string;
  collectorEmail: string;
};

const getStoredOrder = (orderId: string): StoredOrder | undefined => {
  return mockDatabase.state.ordersById[orderId] as StoredOrder | undefined;
};

const createOrderResponse = (storedOrder: StoredOrder): Order => {
  return {
    id: storedOrder.id,
    idempotencyKey: storedOrder.idempotencyKey,
    status: storedOrder.status,
    items: storedOrder.items,
    subtotalEth: storedOrder.subtotalEth,
    discountEth: storedOrder.discountEth,
    networkFeeEth: storedOrder.networkFeeEth,
    totalEth: storedOrder.totalEth,
    couponCode: storedOrder.couponCode,
    walletAddress: storedOrder.walletAddress,
    walletProvider: storedOrder.walletProvider,
    network: storedOrder.network,
    transactionRef: storedOrder.transactionRef,
    explorerUrl: storedOrder.explorerUrl,
    createdAt: storedOrder.createdAt,
    updatedAt: storedOrder.updatedAt,
    version: storedOrder.version,
  };
};

const resolveOrderAsynchronously = (orderId: string) => {
  const scenarioConfig = getScenarioConfig();

  if (scenarioConfig.forceOrderTimeout) {
    return;
  }

  const resolutionDelayMs = 1500 + Math.random() * 1500;

  setTimeout(() => {
    const storedOrder = getStoredOrder(orderId);

    if (!storedOrder || storedOrder.status !== "pending") {
      return;
    }

    const paymentOutcome = scenarioConfig.nextPaymentOutcome ?? (Math.random() < 0.85 ? "confirmed" : "declined");

    storedOrder.status = paymentOutcome;
    storedOrder.version = getNextEventVersion();
    storedOrder.updatedAt = new Date().toISOString();

    if (paymentOutcome === "confirmed") {
      storedOrder.transactionRef = `0xsim${Math.random().toString(16).slice(2, 10)}`;
      storedOrder.explorerUrl = `https://simulated-explorer.kurio.test/tx/${storedOrder.transactionRef}`;

      const cart = mockDatabase.getCart(storedOrder.cartOwnerKey);

      for (const purchasedItem of storedOrder.items) {
        const cartItem = cart.items.find((currentCartItem) => currentCartItem.nftId === purchasedItem.nftId);

        if (!cartItem) continue;

        cartItem.quantity -= purchasedItem.quantity;
        if (cartItem.quantity <= 0) {
          cart.items = cart.items.filter((currentCartItem) => currentCartItem.id !== cartItem.id);
        }
      }

      cart.updatedAt = new Date().toISOString();
    }

    mockDatabase.persist();

    const orderUpdatedPayload: OrderUpdatedPayload = {
      orderId: storedOrder.id,
      status: storedOrder.status,
      version: storedOrder.version,
      transactionRef: storedOrder.transactionRef,
      explorerUrl: storedOrder.explorerUrl,
    };

    realtimeBus.emit("order.updated", "order", storedOrder.id, orderUpdatedPayload, storedOrder.version);
  }, resolutionDelayMs);
};

const orderHandlers = [
  http.post("/api/orders", async ({ request }) => {
    await applyNetworkConditions();

    const storedSession = getSessionFromRequest(request);

    if (!storedSession) {
      return createApiErrorResponse("UNAUTHENTICATED", "Faça login para concluir a compra.");
    }

    const createOrderInput = (await request.json()) as CreateOrderInput;

    if (!createOrderInput.idempotencyKey) {
      return createApiErrorResponse("VALIDATION_ERROR", "Chave de idempotência ausente.");
    }

    const existingOrderId = mockDatabase.state.orderIdByIdempotencyKey[createOrderInput.idempotencyKey];

    if (existingOrderId) {
      const existingOrder = getStoredOrder(existingOrderId);

      if (!existingOrder) {
        return createApiErrorResponse("INTERNAL_ERROR", "Pedido idempotente não encontrado.");
      }

      const requestUsesSameOrderData =
        existingOrder.walletId === createOrderInput.walletId &&
        existingOrder.collectorName === createOrderInput.collectorName &&
        existingOrder.collectorEmail === createOrderInput.collectorEmail &&
        existingOrder.couponCode === createOrderInput.couponCode;

      if (!requestUsesSameOrderData) {
        return createApiErrorResponse("IDEMPOTENCY_CONFLICT", "Chave de idempotência já usada com outros dados.");
      }

      return HttpResponse.json(createOrderResponse(existingOrder));
    }

    const userWallets = mockDatabase.state.walletsByUser[storedSession.userId] ?? [];
    const selectedWallet = userWallets.find((wallet) => wallet.id === createOrderInput.walletId);

    if (!selectedWallet) {
      return createApiErrorResponse("VALIDATION_ERROR", "Carteira selecionada é inválida.");
    }

    const cart = mockDatabase.getCart(storedSession.userId);

    if (cart.items.length === 0) {
      return createApiErrorResponse("VALIDATION_ERROR", "Carrinho vazio.");
    }

    const cartQuote = computeCartQuote(cart);

    if (cartQuote.stale) {
      return createApiErrorResponse("AVAILABILITY_CONFLICT", "Preço ou disponibilidade mudaram. Atualize a cotação antes de confirmar.");
    }

    if (createOrderInput.couponCode !== cart.couponCode) {
      return createApiErrorResponse("AVAILABILITY_CONFLICT", "Cupom aplicado mudou. Revise o pedido.");
    }

    const orderId = `order-${Math.random().toString(36).slice(2, 10)}`;
    const currentTimestamp = new Date().toISOString();
    const storedOrder: StoredOrder = {
      id: orderId,
      idempotencyKey: createOrderInput.idempotencyKey,
      status: "pending",
      items: cart.items.map((cartItem) => ({
        nftId: cartItem.nftId,
        nftName: cartItem.nftName,
        nftImage: cartItem.nftImage,
        edition: `${cartItem.editionCurrent}/${cartItem.editionTotal}`,
        quantity: cartItem.quantity,
        unitPriceEth: cartItem.unitPriceEth,
      })),
      subtotalEth: cartQuote.subtotalEth,
      discountEth: cartQuote.discountEth,
      networkFeeEth: cartQuote.networkFeeEth,
      totalEth: cartQuote.totalEth,
      couponCode: cartQuote.couponCode,
      walletAddress: selectedWallet.address,
      walletProvider: selectedWallet.provider,
      network: selectedWallet.network,
      transactionRef: null,
      explorerUrl: null,
      createdAt: currentTimestamp,
      updatedAt: currentTimestamp,
      version: getNextEventVersion(),
      cartOwnerKey: storedSession.userId,
      walletId: selectedWallet.id,
      collectorName: createOrderInput.collectorName,
      collectorEmail: createOrderInput.collectorEmail,
    };

    mockDatabase.state.ordersById[orderId] = storedOrder;
    mockDatabase.state.orderIdByIdempotencyKey[createOrderInput.idempotencyKey] = orderId;
    mockDatabase.persist();

    resolveOrderAsynchronously(orderId);

    return HttpResponse.json(createOrderResponse(storedOrder), { status: 201 });
  }),

  http.get("/api/orders/:id", async ({ request, params }) => {
    await applyNetworkConditions();

    const storedSession = getSessionFromRequest(request);

    if (!storedSession) {
      return createApiErrorResponse("UNAUTHENTICATED", "Faça login para ver o pedido.");
    }

    const storedOrder = getStoredOrder(String(params.id));

    if (!storedOrder) {
      return createApiErrorResponse("NOT_FOUND", "Pedido não encontrado.");
    }

    if (storedOrder.cartOwnerKey !== storedSession.userId) {
      return createApiErrorResponse("FORBIDDEN", "Você não pode acessar este pedido.");
    }

    return HttpResponse.json(createOrderResponse(storedOrder));
  }),
];

export { orderHandlers };
