import { ArrowLeft, Heart } from "lucide-react";
import { Link } from "@tanstack/react-router";

interface MobilePageHeaderProps {
  title?: string;
  backTo?: "/" | "/cart";
  showFavorite?: boolean;
  favoriteActive?: boolean;
  onToggleFavorite?: () => void;
}

const MobilePageHeader = ({ title = "", backTo = "/", showFavorite = false, favoriteActive = false, onToggleFavorite }: MobilePageHeaderProps) => (
  <header className="flex h-14 items-center justify-between px-6 md:hidden">
    <Link
      to={backTo}
      aria-label="Voltar"
      className="grid size-9 place-items-center rounded-full text-foreground"
    >
      <ArrowLeft size={19} />
    </Link>

    <h1 className="font-mono text-sm font-bold tracking-wide text-foreground">{title}</h1>

    {showFavorite ? (
      <button
        type="button"
        onClick={onToggleFavorite}
        aria-label="Favoritar"
        className="grid size-9 place-items-center rounded-full text-foreground"
      >
        <Heart
          size={19}
          fill={favoriteActive ? "currentColor" : "none"}
        />
      </button>
    ) : (
      <span className="size-9" />
    )}
  </header>
);

export { MobilePageHeader };
