import { useState, type FormEvent } from "react";
import { Link } from "@tanstack/react-router";
import { Facebook, Instagram, Linkedin, Twitter, Youtube } from "lucide-react";
import { showToast } from "@/hooks/useToast";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface FooterLinkItem {
  label: string;
  to?: "/" | "/profile" | "/wallets";
  search?: Record<string, string>;
  isInScope: boolean;
}

const footerLinkColumns: { title: string; links: FooterLinkItem[] }[] = [
  {
    title: "Meu perfil",
    links: [
      { label: "Meu perfil", to: "/profile", isInScope: true },
      { label: "Minha coleção", isInScope: false },
      { label: "Atividade", isInScope: false },
      { label: "Estúdio do criador", isInScope: false },
      { label: "Lista de interesse", to: "/", search: { favorites: "true" }, isInScope: true },
    ],
  },

  {
    title: "Central de ajuda",
    links: [
      { label: "Central de ajuda", isInScope: false },
      { label: "Como comprar NFTs", isInScope: false },
      { label: "Carteira e segurança", to: "/wallets", isInScope: true },
      { label: "Política do mercado", isInScope: false },
      { label: "Denunciar item", isInScope: false },
    ],
  },

  {
    title: "Coleções",
    links: [
      { label: "Arte digital", to: "/", search: { collectionId: "kurio-apes" }, isInScope: true },
      { label: "Fotografia", isInScope: false },
      { label: "Música", isInScope: false },
      { label: "Arte 3D", isInScope: false },
      { label: "Utilidade", to: "/", search: { collectionId: "kurio-editions" }, isInScope: true },
    ],
  },
];

const footerBenefitList = [
  { badge: "W", title: "Segurança da carteira", description: "Proteja sua carteira e colecione arte digital verificada com confiança." },

  { badge: "C", title: "Criadores em destaque", description: "Conheça artistas, estúdios e comunidades que moldam a cultura digital na rede." },

  {
    badge: "D",
    title: "Alertas de lançamentos",
    description: "Receba calendários de cunhagem, novidades de listas de acesso e análises do mercado.",
  },
];

const footerSocialLinks = [
  { label: "Facebook", icon: Facebook },
  { label: "Instagram", icon: Instagram },
  { label: "Twitter", icon: Twitter },
  { label: "LinkedIn", icon: Linkedin },
  { label: "YouTube", icon: Youtube },
];

const AppFooter = () => {
  const [newsletterEmail, setNewsletterEmail] = useState("");

  /* - Cadastro de newsletter é uma ação auxiliar fora do escopo funcional: confirmamos o recebimento visualmente, sem persistir nada, para não simular um serviço que não existe. - */

  const handleNewsletterSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    showToast({
      title: "Fora do escopo desta entrega",
      description: "O cadastro de lançamentos é apenas ilustrativo nesta versão do desafio.",
      variant: "default",
    });
    setNewsletterEmail("");
  };

  const handleOutOfScopeLinkClick = (label: string) => {
    showToast({
      title: "Fora do escopo desta entrega",
      description: `"${label}" não faz parte dos fluxos avaliados neste desafio.`,
      variant: "default",
    });
  };

  return (
    <footer className="mx-auto w-300 bg-background">
      <div className="bg-surface">
        <div className="mx-auto grid min-h-62.5 max-w-300 grid-cols-1 gap-0 px-4 py-6 md:h-62.5 md:grid-cols-[266px_266px_266px_minmax(0,1fr)] md:px-8 md:py-8">
          {footerBenefitList.map((benefit) => (
            <div
              key={benefit.title}
              className="flex gap-3 border-b border-border px-3 py-5 last:border-b-0 md:flex-col md:border-b-0 md:border-r md:px-4 md:py-0 last:border-r-0"
            >
              <span className="grid size-18 shrink-0 place-items-center rounded-full bg-accent font-mono text-[20px] font-bold text-accent-foreground">
                {benefit.badge}
              </span>

              <div className="min-w-0">
                <h3 className="font-display text-[11px] font-bold leading-4 text-foreground md:text-[17px] md:leading-5">{benefit.title}</h3>

                <p className="mt-1 font-mono text-[9px] leading-4 text-muted md:mt-2 md:text-[13px] md:leading-[1.45]">{benefit.description}</p>
              </div>
            </div>
          ))}

          <div className="px-3 py-5 md:px-4 md:py-0">
            <h3 className="font-display text-[17px] font-bold leading-5 text-foreground">Antecipe-se ao próximo lançamento</h3>

            <form
              onSubmit={handleNewsletterSubmit}
              className="mt-3 flex items-center gap-0"
            >
              <Input
                type="email"
                value={newsletterEmail}
                onChange={(event) => setNewsletterEmail(event.target.value)}
                placeholder="digite seu e-mail..."
                aria-label="E-mail para novidades de lançamentos"
                className="h-10 min-h-10 min-w-0 rounded-r-none border-r-0 bg-surface-2 px-3 text-[13px]"
              />

              <Button
                type="submit"
                className="h-10 min-h-10 shrink-0 rounded-l-none px-4 text-[13px]"
              >
                Enviar
              </Button>
            </form>

            <p className="mt-3 font-mono text-[9px] leading-4 text-muted md:text-[13px] md:leading-[1.45]">
              Receba lançamentos selecionados, histórias de criadores e novidades do mercado.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-surface-2">
        <div className="mx-auto grid max-w-300 grid-cols-1 gap-4 px-6 py-5 md:grid-cols-4 md:items-center md:gap-0 md:px-8 md:py-6 md:h-22">
          <p className="font-display text-[12px] font-bold tracking-[0.18em] text-foreground">KURIO</p>

          <p className="text-[11px] leading-4 text-foreground">Feito para colecionadores, criadores e cultura</p>

          <a
            href="mailto:contato@email.com"
            className="text-[11px] text-foreground transition-colors hover:text-accent"
          >
            contato@email.com
          </a>

          <a
            href="tel:+551140028922"
            className="text-[11px] text-foreground transition-colors hover:text-accent"
          >
            +55 11 4002 8922
          </a>
        </div>
      </div>

      <div className="bg-surface px-6 py-8 md:h-59 md:px-8 md:py-8">
        <div className="mx-auto grid max-w-300 gap-8 sm:grid-cols-2 md:grid-cols-4 md:gap-0">
          {footerLinkColumns.map((column) => (
            <div key={column.title}>
              <h3 className="font-display text-[17px] font-bold text-foreground">{column.title}</h3>

              <ul className="mt-3 grid gap-2.5 text-[13px] text-foreground">
                {column.links.map((link) =>
                  link.isInScope && link.to ? (
                    <li key={link.label}>
                      <Link
                        to={link.to}
                        search={link.search}
                        className="transition-colors hover:text-accent"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ) : (
                    <li key={link.label}>
                      <button
                        type="button"
                        onClick={() => handleOutOfScopeLinkClick(link.label)}
                        className="text-left transition-colors hover:text-accent"
                      >
                        {link.label}
                      </button>
                    </li>
                  ),
                )}
              </ul>
            </div>
          ))}

          <div>
            <h3 className="font-display text-[17px] font-bold text-foreground">Redes sociais</h3>

            <div className="mt-4 flex gap-2">
              {footerSocialLinks.map((social) => (
                <button
                  key={social.label}
                  type="button"
                  aria-label={social.label}
                  onClick={() => handleOutOfScopeLinkClick(social.label)}
                  className="grid size-8 place-items-center rounded-control border border-accent text-accent transition-colors hover:bg-accent hover:text-accent-foreground"
                >
                  <social.icon size={14} />
                </button>
              ))}
            </div>

            <h3 className="mt-7 font-display text-[17px] font-bold text-foreground">Carteiras compatíveis</h3>

            <p className="mt-3 inline-block rounded-control bg-surface-2 px-3 py-2 text-[9px] font-bold uppercase tracking-[0.04em] text-accent">
              METAMASK · WALLETCONNECT · COINBASE
            </p>
          </div>
        </div>
      </div>

      <div className="bg-background px-4 py-5 text-center font-mono text-[11.5px] text-foreground">© 2026 Kurio. Propriedade digital para todos.</div>
    </footer>
  );
};

export { AppFooter };
