import { Ticket } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { Quote } from "@/types";

interface CartSummaryProps {
  quote: Quote | undefined;
  appliedCouponCode: string | null | undefined;
  couponInput: string;
  isCouponPending: boolean;
  hasCouponError: boolean;
  onCouponInputChange: (couponCode: string) => void;
  onApplyCoupon: () => void;
  onRemoveCoupon: () => void;
  onGoToCheckout: () => void;
}

const CartSummary = ({
  quote,
  appliedCouponCode,
  couponInput,
  isCouponPending,
  hasCouponError,
  onCouponInputChange,
  onApplyCoupon,
  onRemoveCoupon,
  onGoToCheckout,
}: CartSummaryProps) => (
  <aside className="h-fit rounded-[26px] bg-surface p-4 md:rounded-none md:bg-transparent md:p-0 lg:sticky lg:top-24">
    <h2 className="hidden font-display text-xl font-bold md:block">Resumo da carteira</h2>

    <div className="flex gap-2">
      <Input
        value={couponInput}
        onChange={(event) => onCouponInputChange(event.target.value)}
        placeholder="Digite o código promocional..."
        aria-label="Código promocional"
        className="h-11 rounded-full bg-background font-mono text-[10px] placeholder:text-muted"
      />

      <Button
        variant="primary"
        aria-label="Aplicar cupom"
        disabled={!couponInput || isCouponPending}
        onClick={onApplyCoupon}
        className="h-11 rounded-full px-5 font-mono text-[11px]"
      >
        <span className="hidden md:inline">Aplicar</span>

        <Ticket
          size={14}
          className="md:hidden"
        />
      </Button>
    </div>

    {appliedCouponCode ? (
      <div className="mt-2 flex items-center justify-between text-xs text-success">
        <span>Cupom {appliedCouponCode} aplicado</span>
        <button
          type="button"
          onClick={onRemoveCoupon}
          className="underline"
        >
          Remover
        </button>
      </div>
    ) : null}

    {hasCouponError ? <p className="mt-2 text-xs text-danger">Cupom inválido ou expirado.</p> : null}

    <div className="mt-4 grid gap-2 text-[12px] md:mt-6 md:gap-3 md:border-t md:border-border md:pt-5 md:text-sm">
      <div className="flex justify-between">
        <span className="text-muted">Subtotal</span>

        <span>{quote?.subtotalEth ?? "0"} ETH</span>
      </div>

      <div className="flex justify-between">
        <span className="text-muted">Desconto do lançamento</span>

        <span>(-) {quote?.discountEth ?? "00.00"}</span>
      </div>

      <div className="flex justify-between">
        <span className="text-muted">Taxa de rede</span>

        <span>{quote?.networkFeeEth ?? "0.016"} ETH</span>
      </div>

      <p className="-mt-1 text-right text-[9px] text-accent">Taxa estimada</p>

      <div className="flex justify-between border-t border-border pt-3 text-base font-bold">
        <span>Total</span>

        <span className="font-mono text-accent">{quote?.totalEth ?? "0"} ETH</span>
      </div>
    </div>

    <Button
      className="mt-5 h-12 w-full rounded-full font-mono text-[12px] md:h-11"
      onClick={onGoToCheckout}
    >
      Conectar e finalizar
    </Button>

    <Link
      to="/"
      className="mt-4 hidden w-full text-center text-sm text-accent md:block"
    >
      Continuar explorando
    </Link>
  </aside>
);

export { CartSummary };
