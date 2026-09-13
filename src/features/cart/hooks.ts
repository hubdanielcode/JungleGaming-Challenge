import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryClient";
import type { Cart } from "@/types";
import { addCartItem, applyCoupon, fetchCart, fetchCartQuote, removeCartItem, removeCoupon, updateCartItem } from "./api";

/* - Consulta o carrinho do usuário atual (autenticado ou visitante, via cabeçalho de convidado). - */

const useCartQuery = () => {
  return useQuery({ queryKey: queryKeys.cart.all(), queryFn: fetchCart });
};

/* - A cotação depende do cupom aplicado no carrinho, por isso só é buscada depois que o carrinho carregar. - */

const useCartQuoteQuery = (cart: Cart | undefined) => {
  return useQuery({
    queryKey: queryKeys.cart.quote(cart?.couponCode ?? null),
    queryFn: fetchCartQuote,
    enabled: Boolean(cart),
  });
};

/* - Toda mutation do carrinho substitui o cache com a resposta da API e invalida a cotação, já que preço/desconto/taxa podem mudar junto com os itens. - */

const useCartMutationEffects = () => {
  const queryClient = useQueryClient();

  const applyCartMutationEffects = (updatedCart: Cart) => {
    queryClient.setQueryData(queryKeys.cart.all(), updatedCart);
    void queryClient.invalidateQueries({ queryKey: queryKeys.cart.quoteAll() });
  };

  return applyCartMutationEffects;
};

const useAddCartItemMutation = () => {
  const applyCartMutationEffects = useCartMutationEffects();

  return useMutation({ mutationFn: addCartItem, onSuccess: applyCartMutationEffects });
};

const useUpdateCartItemMutation = () => {
  const applyCartMutationEffects = useCartMutationEffects();

  return useMutation({
    mutationFn: ({ itemId, quantity }: { itemId: string; quantity: number }) => updateCartItem(itemId, { quantity }),
    onSuccess: applyCartMutationEffects,
  });
};

const useRemoveCartItemMutation = () => {
  const applyCartMutationEffects = useCartMutationEffects();

  return useMutation({ mutationFn: removeCartItem, onSuccess: applyCartMutationEffects });
};

const useApplyCouponMutation = () => {
  const applyCartMutationEffects = useCartMutationEffects();

  return useMutation({
    mutationFn: (couponCode: string) => applyCoupon({ code: couponCode }),
    onSuccess: applyCartMutationEffects,
  });
};

const useRemoveCouponMutation = () => {
  const applyCartMutationEffects = useCartMutationEffects();

  return useMutation({ mutationFn: removeCoupon, onSuccess: applyCartMutationEffects });
};

export {
  useCartQuery,
  useCartQuoteQuery,
  useAddCartItemMutation,
  useUpdateCartItemMutation,
  useRemoveCartItemMutation,
  useApplyCouponMutation,
  useRemoveCouponMutation,
};
