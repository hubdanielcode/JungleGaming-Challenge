import type { FormEvent } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/Input";

interface MobileHomeToolbarProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onOpenFilters: () => void;
}

const MobileHomeToolbar = ({ value, onChange, onSubmit, onOpenFilters }: MobileHomeToolbarProps) => (
  <div className="mb-4 flex items-center gap-2 md:hidden">
    <form
      onSubmit={onSubmit}
      className="relative min-w-0 flex-1"
    >
      <Search
        size={17}
        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted"
      />

      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Explorar coleções"
        aria-label="Explorar coleções"
        className="h-11 rounded-control border-transparent bg-surface pl-11 font-mono text-[11px] text-foreground placeholder:text-muted focus-visible:ring-1 focus-visible:ring-accent"
      />
    </form>

    <button
      type="button"
      onClick={onOpenFilters}
      aria-label="Filtros"
      aria-expanded={false}
      className="grid size-11 shrink-0 place-items-center rounded-control bg-accent text-accent-foreground"
    >
      <SlidersHorizontal size={17} />
    </button>
  </div>
);

export { MobileHomeToolbar };
