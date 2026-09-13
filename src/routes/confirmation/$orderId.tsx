import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { CheckCircle2, Clock3, XCircle } from "lucide-react";
import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchOrder } from "@/features/orders/api";
import { queryKeys } from "@/lib/queryClient";
import { realtimeClient } from "@/lib/socket";
import { getRealtimeSessionId, getActiveIdentityId } from "@/lib/session";
import { clearPendingOrder, getPendingOrder, setPendingOrder } from "@/lib/pendingOrder";
import { Button } from "@/components/ui/Button";
import { LoadingSkeleton } from "@/components/common/LoadingSkeleton";
import type { Order } from "@/types";

type OrderUpdatedPayload = {
  orderId: string;
  status: Order["status"];
  version: number;
  transactionRef?: string | null;
  explorerUrl?: string | null;
};

const ConfirmationPage = () => {
  const { orderId } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const orderQuery = useQuery({
    queryKey: queryKeys.orders.detail(orderId),
    queryFn: () => fetchOrder(orderId),
    refetchInterval: (query) => (query.state.data?.status === "pending" ? 2000 : false),
  });

  useEffect(() => {
    const socket = realtimeClient.connect(getRealtimeSessionId());
    const removeOrderListener = realtimeClient.onResourceEvent<OrderUpdatedPayload>("order.updated", (eventEnvelope) => {
      if (eventEnvelope.payload.orderId !== orderId) {
        return;
      }

      queryClient.setQueryData<Order | undefined>(queryKeys.orders.detail(orderId), (currentOrder) =>
        currentOrder
          ? {
              ...currentOrder,
              status: eventEnvelope.payload.status,
              transactionRef: eventEnvelope.payload.transactionRef ?? currentOrder.transactionRef,
              explorerUrl: eventEnvelope.payload.explorerUrl ?? currentOrder.explorerUrl,
              version: eventEnvelope.version,
            }
          : currentOrder,
      );
    });

    /* - Após reconectar, busca o pedido via REST para não depender de um evento perdido durante a queda. - */

    const removeReconnectListener = realtimeClient.onReconnect(() => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.orders.detail(orderId) });
    });

    return () => {
      removeOrderListener();
      removeReconnectListener();
      socket?.removeAllListeners("order.updated");
    };
  }, [orderId, queryClient]);

  const orderStatus = orderQuery.data?.status;

  useEffect(() => {
    if (orderStatus === "confirmed" || orderStatus === "declined") {
      clearPendingOrder(getActiveIdentityId());
    }
  }, [orderStatus]);

  if (orderQuery.isLoading) {
    return (
      <div className="mx-auto max-w-190 p-6">
        <LoadingSkeleton className="h-125" />
      </div>
    );
  }

  if (orderQuery.isError || !orderQuery.data) {
    return (
      <div className="mx-auto max-w-190 p-6 text-center">
        <h1 className="font-display text-3xl font-bold">Pedido não encontrado</h1>

        <Link
          to="/"
          className="mt-5 inline-block text-sm text-accent"
        >
          Voltar para o catálogo
        </Link>
      </div>
    );
  }

  const currentOrder = orderQuery.data;
  const isPending = currentOrder.status === "pending";
  const isConfirmed = currentOrder.status === "confirmed";

  return (
    <div className="mx-auto max-w-190 px-4 py-12 md:py-20">
      <div className="rounded-card border border-border bg-surface p-6 text-center md:p-10">
        {isPending ? (
          <Clock3
            size={44}
            className="mx-auto text-warning"
          />
        ) : isConfirmed ? (
          <CheckCircle2
            size={44}
            className="mx-auto text-success"
          />
        ) : (
          <XCircle
            size={44}
            className="mx-auto text-danger"
          />
        )}

        <p className="mt-5 text-xs uppercase tracking-[0.2em] text-accent">Pedido #{currentOrder.id}</p>

        <h1 className="mt-3 font-display text-3xl font-bold uppercase tracking-wide">
          {isPending ? "Pagamento em processamento" : isConfirmed ? "Compra confirmada" : "Pagamento recusado"}
        </h1>

        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted">
          {isPending
            ? "Estamos aguardando a resposta da simulação da carteira."
            : isConfirmed
              ? "Seu pedido foi confirmado e o recibo abaixo representa o snapshot da compra."
              : "A transação foi recusada. Seus itens continuam disponíveis no carrinho."}
        </p>

        <div className="mt-8 rounded-card border border-border bg-background p-5 text-left">
          <h2 className="font-semibold">Itens</h2>

          <div className="mt-4 grid gap-3">
            {currentOrder.items.map((orderItem) => (
              <div
                key={orderItem.nftId}
                className="flex items-center gap-3"
              >
                <img
                  src={orderItem.nftImage}
                  alt={orderItem.nftName}
                  className="size-12 rounded object-cover"
                />

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{orderItem.nftName}</p>

                  <p className="text-xs text-muted">
                    {orderItem.quantity} × {orderItem.unitPriceEth} ETH
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 grid gap-2 border-t border-border pt-5 text-sm">
            <div className="flex justify-between">
              <span className="text-muted">Subtotal</span>

              <span>{currentOrder.subtotalEth} ETH</span>
            </div>

            <div className="flex justify-between">
              <span className="text-muted">Taxa de rede</span>

              <span>{currentOrder.networkFeeEth} ETH</span>
            </div>

            <div className="flex justify-between font-bold">
              <span>Total</span>

              <span className="font-mono text-accent">{currentOrder.totalEth} ETH</span>
            </div>

            {currentOrder.transactionRef ? (
              <div className="flex justify-between pt-2">
                <span className="text-muted">Transação</span>

                <span className="font-mono text-xs">{currentOrder.transactionRef}</span>
              </div>
            ) : null}
          </div>
        </div>

        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          {isPending ? (
            <Button
              type="button"
              onClick={() => {
                const identityId = getActiveIdentityId();
                const pendingOrder = getPendingOrder(identityId);

                if (pendingOrder) {
                  setPendingOrder(identityId, {
                    idempotencyKey: pendingOrder.idempotencyKey,
                    orderId: null,
                  });
                }

                void navigate({ to: "/checkout" });
              }}
            >
              Tentar novamente
            </Button>
          ) : null}

          <Link to="/">
            <Button>Voltar ao catálogo</Button>
          </Link>

          {isConfirmed && currentOrder.explorerUrl ? (
            <a
              href={currentOrder.explorerUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-10 items-center justify-center rounded-control border border-border px-4 text-sm font-semibold"
            >
              Ver transação
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
};

const Route = createFileRoute("/confirmation/$orderId")({ component: ConfirmationPage });

export { Route };
