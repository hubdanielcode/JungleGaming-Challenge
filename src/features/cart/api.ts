import { apiClient } from "@/lib/axios";
import { getGuestId } from "@/lib/session";
import type { AddCartItemInput, ApplyCouponInput, Cart, Quote, UpdateCartItemInput } from "@/types";

const getCartHeaders = () => {
  return { "x-guest-id": getGuestId() };
};

const fetchCart = async (): Promise<Cart> => {
  const cartResponse = await apiClient.get<Cart>("/cart", { headers: getCartHeaders() });

  return cartResponse.data;
};

const addCartItem = async (addCartItemInput: AddCartItemInput): Promise<Cart> => {
  const cartResponse = await apiClient.post<Cart>("/cart/items", addCartItemInput, { headers: getCartHeaders() });

  return cartResponse.data;
};

const updateCartItem = async (itemId: string, updateCartItemInput: UpdateCartItemInput): Promise<Cart> => {
  const cartResponse = await apiClient.patch<Cart>(`/cart/items/${itemId}`, updateCartItemInput, { headers: getCartHeaders() });

  return cartResponse.data;
};

const removeCartItem = async (itemId: string): Promise<Cart> => {
  const cartResponse = await apiClient.delete<Cart>(`/cart/items/${itemId}`, { headers: getCartHeaders() });

  return cartResponse.data;
};

const applyCoupon = async (applyCouponInput: ApplyCouponInput): Promise<Cart> => {
  const cartResponse = await apiClient.post<Cart>("/cart/coupon", applyCouponInput, { headers: getCartHeaders() });

  return cartResponse.data;
};

const removeCoupon = async (): Promise<Cart> => {
  const cartResponse = await apiClient.delete<Cart>("/cart/coupon", { headers: getCartHeaders() });

  return cartResponse.data;
};

const fetchCartQuote = async (): Promise<Quote> => {
  const quoteResponse = await apiClient.get<Quote>("/cart/quote", { headers: getCartHeaders() });

  return quoteResponse.data;
};

export { fetchCart, addCartItem, updateCartItem, removeCartItem, applyCoupon, removeCoupon, fetchCartQuote };
