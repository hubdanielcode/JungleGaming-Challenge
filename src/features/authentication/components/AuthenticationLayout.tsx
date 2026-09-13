import { ArrowRight, X } from "lucide-react";
import type { ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";

interface AuthenticationLayoutProps {
  title: string;
  subtitle: string;
  children: ReactNode;
}

const authenticationBackdropNfts = [
  { id: "emerald-ape-042", name: "Emerald Ape #042", price: "1.19 ETH", image: "/images/nfts/emerald-ape-042.png" },
  { id: "sage-nomad-009", name: "Sage Nomad #009", price: "1.69 ETH", image: "/images/nfts/sage-nomad-009.png" },
  { id: "neon-vessel-552", name: "Neon Vessel #552", price: "1.99 ETH", oldPrice: "2.29 ETH", image: "/images/nfts/neon-vessel-552.png" },
  { id: "cosmic-bloom-118", name: "Cosmic Bloom #118", price: "1.29 ETH", image: "/images/nfts/cosmic-bloom-118.png" },
  { id: "violet-nomad-314", name: "Violet Nomad #314", price: "1.39 ETH", image: "/images/nfts/violet-nomad-314.png" },
  { id: "ivory-baron-088", name: "Ivory Baron #088", price: "1.79 ETH", image: "/images/nfts/ivory-baron-088.png" },
  { id: "golden-beat-207", name: "Golden Beat #207", price: "0.99 ETH", image: "/images/nfts/golden-beat-207.png" },
  { id: "golden-frequency-071", name: "Golden Frequency #071", price: "0.59 ETH", image: "/images/nfts/sage-nomad-009.png" },
  { id: "golden-signal-160", name: "Golden Signal #160", price: "0.39 ETH", image: "/images/nfts/golden-signal-160.png" },
];

const authenticationBackdropCollections = [
  ["Arte digital", "(33)"],
  ["Fotografia", "(12)"],
  ["Música", "(65)"],
  ["Arte 3D", "(39)"],
  ["Colecionáveis", "(23)"],
  ["Generativa", "(17)"],
  ["Jogos", "(19)"],
  ["Assinaturas", "(13)"],
  ["Utilidade", "(18)"],
];

/* - O Figma apresenta login/cadastro como um modal sobre a página inicial no desktop. Mantemos uma composição estática da home por trás do formulário para que o estado de autenticação preserve exatamente a mesma hierarquia visual, sem duplicar consultas ou regras de negócio do catálogo. - */

const AuthenticationBackdrop = () => (
  <div className="pointer-events-none absolute inset-0 hidden overflow-hidden md:block">
    <div className="mx-auto max-w-300 px-0 pt-10">
      <section className="grid min-h-112.5 grid-cols-[minmax(0,1fr)_450px] items-center gap-10">
        <div className="pl-10">
          <p className="text-[11px] tracking-[0.08em] text-foreground">Bem-vindo à Kurio</p>

          <h2 className="mt-4 max-w-140 font-display text-[43px] font-bold uppercase leading-[1.08] text-foreground">
            Seja dono do futuro da arte digital
          </h2>

          <p className="mt-5 max-w-120 text-[11px] leading-5 text-muted">
            Descubra NFTs selecionados de criadores emergentes e consagrados. Colecione arte digital rara, apoie artistas e tenha uma parte da cultura
            da internet.
          </p>

          <span className="mt-6 inline-flex items-center rounded-control bg-accent px-5 py-3 text-[10px] font-bold uppercase text-accent-foreground">
            Explorar{" "}
            <ArrowRight
              size={12}
              className="ml-1"
            />
          </span>
        </div>

        <div className="overflow-hidden rounded-[20px] bg-surface-2">
          <img
            src="/images/nfts/kurio-hero.png"
            alt=""
            className="block aspect-square w-full object-cover"
          />
        </div>
      </section>

      <section className="mt-24 grid grid-cols-[250px_minmax(0,1fr)] gap-10">
        <aside className="rounded-none bg-surface p-5">
          <h3 className="font-display text-lg font-bold text-foreground">Coleções</h3>

          <ul className="mt-5 grid gap-3">
            {authenticationBackdropCollections.map(([label, count]) => (
              <li
                key={label}
                className="flex items-center justify-between text-sm text-muted"
              >
                <span>{label}</span>
                <span>{count}</span>
              </li>
            ))}
          </ul>

          <h3 className="mt-8 font-display text-lg font-bold text-foreground">Faixa de preço</h3>

          <div className="mt-5 h-1 rounded-full bg-accent/80" />
          <p className="mt-2 font-mono text-sm text-foreground">Preço: 0,02 - 12,30 ETH</p>
          <span className="mt-3 inline-flex rounded-control bg-accent px-4 py-2 text-[10px] font-bold text-accent-foreground">Aplicar</span>

          <h3 className="mt-8 font-display text-lg font-bold text-foreground">Rede</h3>
          <ul className="mt-4 grid gap-3 text-sm text-muted">
            <li className="flex justify-between">
              <span>Ethereum</span>
              <span>(119)</span>
            </li>
            <li className="flex justify-between">
              <span>Polygon</span>
              <span>(78)</span>
            </li>
            <li className="flex justify-between">
              <span>Solana</span>
              <span>(86)</span>
            </li>
          </ul>
        </aside>

        <div>
          <div className="mb-6 flex items-center justify-between">
            <div className="flex gap-5 text-xs text-muted">
              <span className="font-bold text-accent">Todos os NFTs</span>
              <span>Novos lançamentos</span>
              <span>Em alta</span>
            </div>

            <span className="text-xs text-muted">Ordenar por: Listados recentemente</span>
          </div>

          <div className="grid grid-cols-3 gap-x-8 gap-y-8">
            {authenticationBackdropNfts.map((nft) => (
              <article
                key={nft.id}
                className="min-w-0"
              >
                <div className="overflow-hidden rounded-none bg-surface p-2">
                  <img
                    src={nft.image}
                    alt=""
                    className="block aspect-square w-full rounded-control object-cover"
                  />
                </div>

                <p className="mt-2 px-1 font-mono text-[11px] leading-4 text-foreground">{nft.name}</p>

                <div className="flex items-baseline gap-2 px-1">
                  <span className="font-mono text-[11px] font-bold text-accent">{nft.price}</span>

                  {nft.oldPrice ? <span className="font-mono text-[9px] text-muted line-through">{nft.oldPrice}</span> : null}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  </div>
);

const AuthenticationLayout = ({ title, subtitle, children }: AuthenticationLayoutProps) => {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen overflow-hidden rounded-4xl bg-background md:min-h-[1900px] md:rounded-none">
      <AuthenticationBackdrop />

      <div
        className="absolute inset-0 bg-background/5"
        aria-hidden="true"
      />

      <div className="relative z-10 flex min-h-screen items-start justify-center px-7 md:min-h-[1900px] md:px-0 md:py-24">
        <div className="relative w-full max-w-125 border-0 bg-background px-0 pt-33 pb-8 shadow-none md:border-b-4 md:border-accent md:bg-surface md:px-19.5 md:py-10 md:shadow-2xl">
          <button
            type="button"
            aria-label="Fechar"
            onClick={() => void navigate({ to: "/" })}
            className="absolute right-4 top-3 hidden size-7 place-items-center text-accent transition-colors hover:text-accent-strong md:grid md:right-3 md:top-3"
          >
            <X
              size={17}
              strokeWidth={1.5}
            />
          </button>

          <div className="mb-10 text-center md:hidden">
            <Link
              to="/"
              className="font-display text-[30px] font-bold tracking-[0.18em] text-foreground"
            >
              KURIO
            </Link>
          </div>

          <div className="text-center">
            <p className="hidden font-mono text-[15px] font-bold tracking-[0.02em] text-foreground md:block md:text-[16px]">
              <Link
                to="/login"
                className={title === "Entrar" ? "text-accent" : "text-foreground"}
              >
                Entrar
              </Link>{" "}
              <span className="text-foreground">|</span>{" "}
              <Link
                to="/register"
                className={title === "Criar conta" ? "text-accent" : "text-foreground"}
              >
                Criar conta
              </Link>
            </p>

            <h1 className="font-display text-[21px] font-bold text-foreground md:hidden">{title}</h1>

            <p className="mx-auto mt-6 hidden max-w-85 text-center font-mono text-[10px] leading-4 text-foreground md:mt-7 md:block md:text-[11px] md:leading-5">
              {subtitle}
            </p>
          </div>

          <div className="mt-8 md:mt-7">{children}</div>
        </div>
      </div>
    </div>
  );
};

export { AuthenticationLayout };
