import { Link } from "@tanstack/react-router";
import { Minus, Plus, Trash2 } from "lucide-react";
import { decimal } from "@/lib/decimal";
import { mergeClassNames } from "@/lib/utils";
import type { CartItem } from "@/types";

interface CartItemRowProps {
  cartItem: CartItem;
  isUpdatingQuantity: boolean;
  onIncreaseQuantity: () => void;
  onDecreaseQuantity: () => void;
  onRemove: () => void;
}

/* - Uma linha da tabela do carrinho: imagem, edição, preço unitário, controle de quantidade e total da linha. - */

const CartItemRow = ({ cartItem, isUpdatingQuantity, onIncreaseQuantity, onDecreaseQuantity, onRemove }: CartItemRowProps) => {
  const lineTotalEth = decimal.multiplyByInteger(cartItem.unitPriceEth, cartItem.quantity);

  return (
    <tr className="group">
      <td className="rounded-l-[4px] bg-surface py-2.5 pl-2 pr-4">
        <div className="flex items-center gap-3">
          <img
            src={cartItem.nftImage}
            alt={cartItem.nftName}
            className="size-14 rounded-lg object-cover"
          />

          <div className="min-w-0">
            <Link
              to="/nfts/$nftId"
              params={{ nftId: cartItem.nftId }}
              className="block truncate text-sm font-semibold hover:text-accent"
            >
              {cartItem.nftName}
            </Link>

            <p className="mt-0.5 text-xs text-muted">
              Edição {cartItem.editionCurrent}/{cartItem.editionTotal}
            </p>

            {!cartItem.available ? <p className="mt-0.5 text-xs text-danger">Indisponível na quantidade selecionada</p> : null}
          </div>
        </div>
      </td>

      <td className="bg-surface py-2.5 pr-4 font-mono text-sm text-foreground">{cartItem.unitPriceEth} ETH</td>

      <td className="bg-surface py-2.5 pr-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            className={mergeClassNames(
              "grid size-8 place-items-center rounded-control border border-border-strong text-accent transition-colors",
              "hover:border-accent disabled:cursor-not-allowed disabled:opacity-40",
            )}
            disabled={cartItem.quantity <= 1 || isUpdatingQuantity}
            onClick={onDecreaseQuantity}
            aria-label={`Diminuir quantidade de ${cartItem.nftName}`}
          >
            <Minus size={13} />
          </button>

          <span className="w-6 text-center font-mono text-sm">{cartItem.quantity}</span>

          <button
            type="button"
            className={mergeClassNames(
              "grid size-8 place-items-center rounded-control border border-border-strong text-accent transition-colors",
              "hover:border-accent disabled:cursor-not-allowed disabled:opacity-40",
            )}
            disabled={cartItem.quantity >= cartItem.maxQuantity || isUpdatingQuantity}
            onClick={onIncreaseQuantity}
            aria-label={`Aumentar quantidade de ${cartItem.nftName}`}
          >
            <Plus size={13} />
          </button>
        </div>
      </td>

      <td className="bg-surface py-2.5 pr-4 font-mono text-sm font-semibold text-accent">{decimal.format(lineTotalEth)} ETH</td>

      <td className="rounded-r-[4px] bg-surface py-2.5 pr-2">
        <button
          type="button"
          onClick={onRemove}
          className="p-2 text-muted transition-colors hover:text-danger"
          aria-label={`Remover ${cartItem.nftName} do carrinho`}
        >
          <Trash2 size={16} />
        </button>
      </td>
    </tr>
  );
};

export { CartItemRow };
