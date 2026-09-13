import { Heart } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import type { NFT } from "@/types";

interface NftCardProps {
  nft: NFT;
  isFavorite: boolean;
  isFavoritePending: boolean;
  onToggleFavorite: (nftId: string) => void;
  onAddToCart: (nftId: string) => void;
}

const NftCard = ({ nft, isFavorite, isFavoritePending, onToggleFavorite, onAddToCart }: NftCardProps) => {
  const [imageSrc, setImageSrc] = useState(nft.image);
  const isSoldOut = nft.edition.status === "sold_out";

  return (
    <article className="group min-w-0">
      <div className="relative overflow-hidden rounded-card bg-surface p-2">
        <Link
          to="/nfts/$nftId"
          params={{ nftId: nft.id }}
          className="block"
          aria-label={`Ver detalhes de ${nft.name}`}
        >
          <div className="relative aspect-square overflow-hidden rounded-control bg-surface-2">
            <img
              src={imageSrc}
              alt={nft.name}
              className="block h-full w-full object-cover"
              onError={() => setImageSrc("/images/nfts/emerald-ape-042.png")}
            />
            {isSoldOut ? (
              <span className="absolute left-0 top-0 rounded-none bg-foreground px-2 py-1 text-[9px] font-bold uppercase text-background">
                Esgotado
              </span>
            ) : nft.tags[0] ? (
              <span className="absolute left-0 top-0 rounded-none bg-accent px-2 py-1 text-[9px] font-bold uppercase text-accent-foreground">
                {nft.tags[0] === "raro" ? "Raro" : nft.tags[0] === "novo" ? "Novo" : "Em alta"}
              </span>
            ) : null}
          </div>
        </Link>

        <button
          type="button"
          aria-label={isFavorite ? `Remover ${nft.name} dos favoritos` : `Adicionar ${nft.name} aos favoritos`}
          onClick={() => onToggleFavorite(nft.id)}
          disabled={isFavoritePending}
          className={`absolute right-3 top-3 grid size-8 place-items-center rounded-full border transition-colors ${isFavorite ? "border-accent bg-accent text-accent-foreground" : "border-border bg-surface/90 text-foreground hover:border-accent hover:text-accent"}`}
        >
          <Heart
            size={14}
            fill={isFavorite ? "currentColor" : "none"}
          />
        </button>
      </div>

      <div className="px-1 pt-2">
        <Link
          to="/nfts/$nftId"
          params={{ nftId: nft.id }}
          className="block min-w-0"
        >
          <h3 className="truncate font-mono text-[11px] font-normal leading-4 text-foreground">{nft.name}</h3>
        </Link>

        <div className="mt-0.5 flex items-center justify-between gap-2">
          <div className="flex items-baseline gap-2 font-mono">
            <p className="text-[11px] font-bold text-accent">{nft.priceEth} ETH</p>
            {nft.originalPriceEth ? <p className="text-[9px] text-muted line-through">{nft.originalPriceEth} ETH</p> : null}
          </div>

          <button
            type="button"
            aria-label={`Adicionar ${nft.name} ao carrinho`}
            onClick={() => onAddToCart(nft.id)}
            disabled={isSoldOut}
            className="rounded-control bg-accent px-3 py-1.5 text-[9px] font-bold uppercase text-accent-foreground transition-opacity disabled:opacity-50"
          >
            Comprar
          </button>
        </div>
      </div>
    </article>
  );
};

export { NftCard };
