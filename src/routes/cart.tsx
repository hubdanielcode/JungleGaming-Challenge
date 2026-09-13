import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { CartItemRow } from "@/features/cart/components/CartItemRow";
import { CartSummary } from "@/features/cart/components/CartSummary";
import {
  useApplyCouponMutation,
  useCartQuery,
  useCartQuoteQuery,
  useRemoveCartItemMutation,
  useRemoveCouponMutation,
  useUpdateCartItemMutation,
} from "@/features/cart/hooks";
import { LoadingSkeleton } from "@/components/common/LoadingSkeleton";
import { Button } from "@/components/ui/Button";
import { MobilePageHeader } from "@/components/common/MobilePageHeader";
import { fetchNfts } from "@/features/catalog/api";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryClient";

const CartPage = () => {
  const navigate = useNavigate();
  const [couponInput, setCouponInput] = useState("");

  const cartQuery = useCartQuery();
  const relatedQuery = useQuery({
    queryKey: [...queryKeys.nfts.all, "cart-related"],
    queryFn: () => fetchNfts({ page: 1, pageSize: 5, sort: "relevance" }),
  });
  const quoteQuery = useCartQuoteQuery(cartQuery.data);
  const updateQuantityMutation = useUpdateCartItemMutation();
  const removeItemMutation = useRemoveCartItemMutation();
  const applyCouponMutation = useApplyCouponMutation();
  const removeCouponMutation = useRemoveCouponMutation();

  if (cartQuery.isLoading) {
    return (
      <div className="mx-auto max-w-295 p-6">
        <LoadingSkeleton className="h-125" />
      </div>
    );
  }

  const cartItems = cartQuery.data?.items ?? [];

  const handleApplyCoupon = () => {
    applyCouponMutation.mutate(couponInput, { onSuccess: () => setCouponInput("") });
  };

  return (
    <div className="mx-auto max-w-300 px-6 pb-28 pt-0 md:px-0 md:py-10">
      <MobilePageHeader
        title="Carrinho de NFTs"
        backTo="/"
      />

      <nav
        aria-label="Trilha de navegação"
        className="hidden text-xs text-muted md:block"
      >
        <Link
          to="/"
          className="hover:text-accent"
        >
          Início
        </Link>

        <span className="mx-1.5">/</span>

        <span className="text-foreground">Carrinho</span>
      </nav>

      <h1 className="mt-3 hidden font-display text-3xl font-bold tracking-wide md:block">Carrinho de NFTs</h1>

      {cartItems.length === 0 ? (
        <div className="mt-10 rounded-card border border-border bg-surface p-12 text-center">
          <p className="text-lg font-semibold">Seu carrinho está vazio.</p>

          <p className="mt-2 text-sm text-muted">Encontre um NFT para começar sua coleção.</p>

          <Link
            to="/"
            className="mt-6 inline-block"
          >
            <Button>Explorar NFTs</Button>
          </Link>
        </div>
      ) : (
        <>
          <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_330px] md:mt-8">
            <div className="min-w-0">
              <div className="hidden rounded-card bg-surface p-5 md:block">
                <table className="w-full border-collapse text-left">
                  <caption className="sr-only">Itens no seu carrinho de NFTs</caption>

                  <thead>
                    <tr className="border-b border-border-strong text-xs uppercase tracking-wide text-muted">
                      <th
                        scope="col"
                        className="pb-3 font-semibold"
                      >
                        NFT
                      </th>

                      <th
                        scope="col"
                        className="pb-3 pr-4 font-semibold"
                      >
                        Preço
                      </th>

                      <th
                        scope="col"
                        className="pb-3 pr-4 font-semibold"
                      >
                        Quantidade
                      </th>

                      <th
                        scope="col"
                        className="pb-3 pr-4 font-semibold"
                      >
                        Total
                      </th>

                      <th
                        scope="col"
                        className="pb-3"
                      >
                        <span className="sr-only">Remover</span>
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {cartItems.map((cartItem) => (
                      <CartItemRow
                        key={cartItem.id}
                        cartItem={cartItem}
                        isUpdatingQuantity={updateQuantityMutation.isPending}
                        onIncreaseQuantity={() => updateQuantityMutation.mutate({ itemId: cartItem.id, quantity: cartItem.quantity + 1 })}
                        onDecreaseQuantity={() => updateQuantityMutation.mutate({ itemId: cartItem.id, quantity: cartItem.quantity - 1 })}
                        onRemove={() => removeItemMutation.mutate(cartItem.id)}
                      />
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="grid gap-2 md:hidden">
                {cartItems.map((cartItem) => (
                  <article
                    key={cartItem.id}
                    className="grid min-h-18 grid-cols-[62px_minmax(0,1fr)] overflow-hidden rounded-control bg-surface"
                  >
                    <Link
                      to="/nfts/$nftId"
                      params={{ nftId: cartItem.nftId }}
                      className="block h-full"
                    >
                      <img
                        src={cartItem.nftImage}
                        alt={cartItem.nftName}
                        className="h-full min-h-18 w-15.5 object-cover"
                      />
                    </Link>

                    <div className="min-w-0 px-3 py-2.5">
                      <Link
                        to="/nfts/$nftId"
                        params={{ nftId: cartItem.nftId }}
                        className="block truncate font-mono text-[11px] font-bold text-foreground"
                      >
                        {cartItem.nftName}
                      </Link>

                      <p className="mt-1 font-mono text-[9px] text-muted">
                        Edição: {cartItem.editionCurrent}/{cartItem.editionTotal}
                      </p>

                      <div className="mt-1.5 flex items-end justify-between gap-2">
                        <span className="font-mono text-[14px] font-bold text-accent">{cartItem.unitPriceEth} ETH</span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            disabled={cartItem.quantity <= 1 || updateQuantityMutation.isPending}
                            onClick={() => updateQuantityMutation.mutate({ itemId: cartItem.id, quantity: cartItem.quantity - 1 })}
                            aria-label={`Diminuir quantidade de ${cartItem.nftName}`}
                            className="grid size-6 place-items-center rounded-full border border-border bg-surface-2 text-[11px] text-accent"
                          >
                            −
                          </button>

                          <span className="w-3 text-center font-mono text-[11px]">{cartItem.quantity}</span>

                          <button
                            type="button"
                            disabled={cartItem.quantity >= cartItem.maxQuantity || updateQuantityMutation.isPending}
                            onClick={() => updateQuantityMutation.mutate({ itemId: cartItem.id, quantity: cartItem.quantity + 1 })}
                            aria-label={`Aumentar quantidade de ${cartItem.nftName}`}
                            className="grid size-6 place-items-center rounded-full border border-border bg-surface-2 text-[11px] text-accent"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>

            <CartSummary
              quote={quoteQuery.data}
              appliedCouponCode={cartQuery.data?.couponCode}
              couponInput={couponInput}
              isCouponPending={applyCouponMutation.isPending}
              hasCouponError={applyCouponMutation.isError}
              onCouponInputChange={setCouponInput}
              onApplyCoupon={handleApplyCoupon}
              onRemoveCoupon={() => removeCouponMutation.mutate()}
              onGoToCheckout={() => void navigate({ to: "/checkout" })}
            />
          </div>

          {cartItems.length > 0 ? (
            <section className="mt-12 hidden md:block">
              <div className="border-b border-border pb-2">
                <h2 className="font-display text-[14px] font-bold text-accent">Colecionadores também viram</h2>
              </div>

              <div className="mt-5 grid grid-cols-5 gap-5">
                {(relatedQuery.data?.items ?? []).map((item) => (
                  <Link
                    key={item.id}
                    to="/nfts/$nftId"
                    params={{ nftId: item.id }}
                    className="min-w-0"
                  >
                    <div className="bg-surface p-3">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="aspect-square w-full rounded-control object-cover"
                      />
                    </div>

                    <p className="mt-2 truncate text-[11px]">{item.name}</p>

                    <p className="text-[11px] font-bold text-accent">{item.priceEth} ETH</p>
                  </Link>
                ))}
              </div>

              <div className="mt-5 flex justify-center gap-1.5">
                <span className="size-2 rounded-full border border-accent" />

                <span className="size-2 rounded-full bg-accent" />

                <span className="size-2 rounded-full border border-accent" />
              </div>
            </section>
          ) : null}
        </>
      )}
    </div>
  );
};

const Route = createFileRoute("/cart")({ component: CartPage });

export { Route };
