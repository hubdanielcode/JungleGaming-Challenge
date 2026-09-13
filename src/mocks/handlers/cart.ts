import { http, HttpResponse } from "msw";
import type { AddCartItemInput, ApplyCouponInput, UpdateCartItemInput } from "@/types";
import { mockDatabase } from "../db";
import { couponFixtures } from "../fixtures/users";
import { computeCartQuote } from "../quote";
import { applyNetworkConditions, createApiErrorResponse, getCartOwnerKey } from "./shared";

const cartHandlers = [
  http.get("/api/cart", async ({ request }) => {
    await applyNetworkConditions();
    return HttpResponse.json(mockDatabase.getCart(getCartOwnerKey(request)));
  }),

  http.post("/api/cart/items", async ({ request }) => {
    await applyNetworkConditions();

    const addCartItemInput = (await request.json()) as AddCartItemInput;

    if (addCartItemInput.quantity < 1) {
      return createApiErrorResponse("VALIDATION_ERROR", "Quantidade mínima é 1.");
    }

    const requestedNft = mockDatabase.state.nfts.find((nft) => nft.id === addCartItemInput.nftId);

    if (!requestedNft) {
      return createApiErrorResponse("NOT_FOUND", "NFT não encontrado.");
    }

    const cart = mockDatabase.getCart(getCartOwnerKey(request));
    const existingCartItem = cart.items.find((cartItem) => cartItem.nftId === addCartItemInput.nftId);
    const nextQuantity = (existingCartItem?.quantity ?? 0) + addCartItemInput.quantity;

    if (requestedNft.edition.status === "sold_out" || requestedNft.availableQuantity < nextQuantity) {
      return createApiErrorResponse("AVAILABILITY_CONFLICT", "Quantidade indisponível para este NFT.");
    }

    if (nextQuantity > 10) {
      return createApiErrorResponse("VALIDATION_ERROR", `Limite de ${10} unidades por pedido para este NFT.`);
    }

    if (existingCartItem) {
      existingCartItem.quantity = nextQuantity;
    } else {
      cart.items.push({
        id: `item-${requestedNft.id}-${Math.random().toString(36).slice(2, 8)}`,
        nftId: requestedNft.id,
        nftName: requestedNft.name,
        nftImage: requestedNft.image,
        editionCurrent: requestedNft.edition.current,
        editionTotal: requestedNft.edition.total,
        quantity: addCartItemInput.quantity,
        unitPriceEth: requestedNft.priceEth,
        priceVersion: requestedNft.version,
        maxQuantity: 10,
        available: true,
      });
    }

    cart.updatedAt = new Date().toISOString();
    mockDatabase.persist();

    return HttpResponse.json(cart, { status: 201 });
  }),

  http.patch("/api/cart/items/:itemId", async ({ request, params }) => {
    await applyNetworkConditions();

    const updateCartItemInput = (await request.json()) as UpdateCartItemInput;
    const cart = mockDatabase.getCart(getCartOwnerKey(request));
    const cartItem = cart.items.find((item) => item.id === params.itemId);

    if (!cartItem) {
      return createApiErrorResponse("NOT_FOUND", "Item não encontrado no carrinho.");
    }

    if (updateCartItemInput.quantity < 1) {
      return createApiErrorResponse("VALIDATION_ERROR", "Quantidade mínima é 1.");
    }

    const currentNft = mockDatabase.state.nfts.find((nft) => nft.id === cartItem.nftId);

    if (
      !currentNft ||
      currentNft.edition.status === "sold_out" ||
      currentNft.availableQuantity < updateCartItemInput.quantity ||
      updateCartItemInput.quantity > 10
    ) {
      return createApiErrorResponse("AVAILABILITY_CONFLICT", "Quantidade indisponível para este NFT.");
    }

    cartItem.quantity = updateCartItemInput.quantity;
    cartItem.available = true;
    cart.updatedAt = new Date().toISOString();
    mockDatabase.persist();

    return HttpResponse.json(cart);
  }),

  http.delete("/api/cart/items/:itemId", async ({ request, params }) => {
    await applyNetworkConditions();

    const cart = mockDatabase.getCart(getCartOwnerKey(request));
    cart.items = cart.items.filter((item) => item.id !== params.itemId);
    cart.updatedAt = new Date().toISOString();
    mockDatabase.persist();

    return HttpResponse.json(cart);
  }),

  http.post("/api/cart/coupon", async ({ request }) => {
    await applyNetworkConditions();

    const applyCouponInput = (await request.json()) as ApplyCouponInput;
    const normalizedCouponCode = applyCouponInput.code.trim().toLowerCase();
    const couponFixture = couponFixtures.find((coupon) => coupon.code.toLowerCase() === normalizedCouponCode);

    if (!couponFixture) {
      return createApiErrorResponse("VALIDATION_ERROR", "Cupom inválido.", [{ field: "code", message: "Cupom inválido." }]);
    }

    if (couponFixture.status === "expired") {
      return createApiErrorResponse("VALIDATION_ERROR", "Cupom expirado.", [{ field: "code", message: "Cupom expirado." }]);
    }

    const cart = mockDatabase.getCart(getCartOwnerKey(request));
    cart.couponCode = couponFixture.code;
    cart.updatedAt = new Date().toISOString();
    mockDatabase.persist();

    return HttpResponse.json(cart);
  }),

  http.delete("/api/cart/coupon", async ({ request }) => {
    await applyNetworkConditions();

    const cart = mockDatabase.getCart(getCartOwnerKey(request));
    cart.couponCode = null;
    cart.updatedAt = new Date().toISOString();
    mockDatabase.persist();

    return HttpResponse.json(cart);
  }),

  http.get("/api/cart/quote", async ({ request }) => {
    await applyNetworkConditions();

    const cart = mockDatabase.getCart(getCartOwnerKey(request));

    return HttpResponse.json(computeCartQuote(cart));
  }),
];

export { cartHandlers };
