import { CircleHelp, Heart, LogOut, ShoppingCart, UserRound, WalletCards, Download, Tag } from "lucide-react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useLogout } from "@/features/authentication/hooks";

const items = [
  { label: "Dados do perfil", to: "/profile", icon: UserRound },
  { label: "Carteiras", to: "/wallets", icon: WalletCards },
  { label: "Atividade", to: "/", icon: ShoppingCart },
  { label: "Lista de interesse", to: "/", search: { favorites: "true" }, icon: Heart },
  { label: "Ofertas", to: "/", icon: Tag },
  { label: "Arquivos baixados", to: "/", icon: Download },
  { label: "Suporte", to: "/", icon: CircleHelp },
] as const;

const AccountSidebar = ({ active }: { active: "profile" | "wallets" }) => {
  const navigate = useNavigate();
  const logout = useLogout();

  return (
    <aside className="hidden w-77.5 shrink-0 bg-surface lg:block">
      <div className="px-4 pt-4">
        <h2 className="font-display text-[19px] font-bold">Meu perfil</h2>

        <nav className="mt-4">
          {items.map((item) => {
            const isActive = item.to === `/${active}`;
            const Icon = item.icon;

            return (
              <Link
                key={item.label}
                to={item.to}
                search={"search" in item ? item.search : undefined}
                className={`relative flex h-11.5 items-center gap-3 px-4 text-[15px] transition-colors ${isActive ? "bg-surface text-accent" : "text-accent/90 hover:bg-surface"}`}
              >
                {isActive ? <span className="absolute inset-y-0 left-0 w-1.25 bg-accent" /> : null}
                <Icon
                  size={18}
                  strokeWidth={1.7}
                />

                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <button
        type="button"
        onClick={async () => {
          await logout();
          await navigate({ to: "/" });
        }}
        className="mt-2 flex h-12.25 w-full items-center gap-3 border-t border-border px-4 text-[15px] font-bold text-accent hover:bg-surface"
      >
        <LogOut
          size={18}
          strokeWidth={1.7}
        />
        Sair
      </button>
    </aside>
  );
};
export { AccountSidebar };
