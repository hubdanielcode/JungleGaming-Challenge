# Kurio — Marketplace de NFTs

Frontend do desafio técnico de Marketplace de NFTs, implementado em **React + TypeScript**, com
**TanStack Router**, **TanStack Query**, **Axios**, **Socket.IO**, **Tailwind CSS**, **shadcn/ui**,
**MSW** e **Playwright**. Todos os fluxos (descoberta, compra e conta do colecionador) funcionam
com dados e integrações simuladas — não há backend real nem blockchain envolvidos.

## Sumário

- [Kurio — Marketplace de NFTs](#kurio--marketplace-de-nfts)
  - [Sumário](#sumário)
  - [Requisitos](#requisitos)
  - [Instalação](#instalação)
  - [Variáveis de ambiente](#variáveis-de-ambiente)
  - [Comandos de execução](#comandos-de-execução)
  - [Contas de demonstração](#contas-de-demonstração)
  - [Cenários dos mocks (seleção e reset)](#cenários-dos-mocks-seleção-e-reset)
  - [Como reproduzir os fluxos de falha](#como-reproduzir-os-fluxos-de-falha)
  - [Testes end-to-end (Playwright)](#testes-end-to-end-playwright)
  - [Auditoria de performance (Lighthouse)](#auditoria-de-performance-lighthouse)
  - [Deploy](#deploy)
  - [Documentação adicional](#documentação-adicional)

## Requisitos

- Node.js 20 ou superior
- npm 10 ou superior

## Instalação

```bash
git clone https://github.com/hubdanielcode/JungleGaming-Challenge.git
cd marketplace-nft
npm install
```

Não é necessário criar nenhum arquivo `.env` para rodar localmente: todas as variáveis têm um
valor padrão que já ativa os mocks e aponta para o próprio dev server. A seção abaixo documenta
o que pode ser sobrescrito.

## Variáveis de ambiente

| Variável            | Padrão                | Descrição                                                                                                                                        |
| ------------------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `VITE_ENABLE_MOCKS` | `true`                | Liga/desliga o MSW (REST + Socket.IO simulado). Use `false` apenas se for apontar para um backend real, o que está fora do escopo deste desafio. |
| `VITE_API_BASE_URL` | `/api`                | Base usada pelo cliente Axios (`src/lib/axios.ts`).                                                                                              |
| `VITE_SOCKET_URL`   | `ws://localhost:5173` | Endpoint usado pelo cliente `socket.io-client`.                                                                                                  |

Para sobrescrever, crie um `.env.local` (ignorado pelo Git) ou exporte a variável na linha de
comando, por exemplo:

```bash
VITE_ENABLE_MOCKS=false VITE_API_BASE_URL=https://minha-api.exemplo.com npm run dev
```

## Comandos de execução

| Comando                   | O que faz                                                                                                                  |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `npm run dev`             | Sobe o servidor de desenvolvimento (Vite) com os mocks ativos por padrão.                                                  |
| `npm run dev:mocks`       | Igual ao anterior, forçando `VITE_ENABLE_MOCKS=true` explicitamente.                                                       |
| `npm run build`           | Verifica os tipos (`tsc -b`) e gera o build de produção (`vite build`).                                                    |
| `npm run preview`         | Serve o build de produção localmente, para conferência antes do deploy.                                                    |
| `npm run typecheck`       | Roda apenas a verificação de tipos (`tsc -b --noEmit`).                                                                    |
| `npm run lint`            | Roda o ESLint em todo o projeto.                                                                                           |
| `npm run test:e2e`        | Executa a suíte Playwright (Chromium, projetos desktop/tablet/mobile).                                                     |
| `npm run test:e2e:ui`     | Abre o modo interativo do Playwright.                                                                                      |
| `npm run test:e2e:report` | Abre o último relatório HTML gerado pelo Playwright.                                                                       |
| `npm run lighthouse`      | Builda, sobe o preview e audita Início e Detalhe do NFT (mobile e desktop).                                                |
| `npm run msw:init`        | Regenera o service worker do MSW em `public/` (necessário após clonar o repositório, caso o worker não esteja versionado). |

## Contas de demonstração

Nenhuma senha real é usada — são credenciais fictícias, válidas apenas na base simulada:

| E-mail                             | Senha      | Observação                                                                         |
| ---------------------------------- | ---------- | ---------------------------------------------------------------------------------- |
| `andreza.colecionadora@kurio.test` | `kurio123` | Possui carteira principal cadastrada.                                              |
| `daniel.dev@kurio.test`            | `kurio123` | Não possui carteira cadastrada (útil para testar o fluxo de cadastro de carteira). |

## Cenários dos mocks (seleção e reset)

Os mocks rodam na camada de rede (MSW), com estado persistido em `localStorage` para sobreviver
a um refresh. Os cenários abaixo podem ser ativados por query string, por exemplo
`http://localhost:5173/?scenario=slow`:

| Cenário            | Efeito                                                                                                                |
| ------------------ | --------------------------------------------------------------------------------------------------------------------- |
| `slow`             | Latência de 1,5 a 3,5 segundos em todas as respostas.                                                                 |
| `flaky`            | Latência variável combinada com ~30% de falhas transitórias (5xx).                                                    |
| `offline`          | Recusa as conexões do Socket.IO, simulando queda de tempo real.                                                       |
| `order-timeout`    | O pedido criado permanece em `pending`, sem resolver — usado para testar a recuperação por idempotência após timeout. |
| `payment-declined` | O próximo pedido criado é recusado pela simulação.                                                                    |

**Reset do cenário:** enquanto os mocks estiverem ativos, um botão fixo **"Resetar cenário"**
aparece no canto inferior direito da tela. Ele chama `POST /api/dev/reset` e recarrega a página,
restaurando integralmente fixtures, sessões, carrinhos, favoritos, carteiras e pedidos ao estado
inicial. Use-o sempre que quiser voltar a um ponto de partida conhecido.

## Como reproduzir os fluxos de falha

Todos os passos abaixo assumem a aplicação rodando com mocks ativos (`npm run dev`).

1. **Sessão expirada / acesso não autorizado**
   Faça login, acesse `Perfil` ou `Carrinho`, resete o cenário em outra aba (ou aguarde a
   expiração simulada) e tente concluir uma ação protegida — a UI deve tratar a sessão inválida e
   redirecionar ao login preservando o contexto de retomada.

2. **Cupom inválido ou expirado**
   No carrinho, aplique o cupom `EXPIROU5` (expirado) ou qualquer código inexistente para ver o
   tratamento de erro de validação.

3. **Preço/disponibilidade alterada durante a compra**
   Adicione um NFT ao carrinho, use `POST /api/dev/simulate/nft-update` (ou a ação equivalente
   exposta na UI de desenvolvimento) para alterar preço ou disponibilidade, e tente finalizar o
   checkout — a cotação desatualizada deve bloquear a confirmação até uma nova revisão.

4. **Timeout após criação do pedido / recuperação por idempotência**
   Acesse com `?scenario=order-timeout`, finalize uma compra e dê refresh na página com o pedido
   pendente — o mesmo pedido deve ser recuperado via `orderId`, sem gerar uma nova compra.

5. **Pagamento recusado**
   Acesse com `?scenario=payment-declined` e finalize uma compra — o pedido deve ser apresentado
   como recusado, não como confirmado.

6. **Falha de conexão / respostas HTTP 4xx e 5xx / latência fora de ordem**
   Acesse com `?scenario=flaky` para navegar pelo catálogo, aplicar filtros e adicionar itens ao
   carrinho — os estados de carregamento, erro e nova tentativa devem se comportar corretamente
   mesmo com respostas fora de ordem.

7. **Queda de tempo real (Socket.IO)**
   Acesse com `?scenario=offline` com um pedido pendente em aberto, depois remova o parâmetro e
   recarregue — a reconexão deve reconciliar o estado do pedido via REST, sem duplicar a compra.

8. **Conflito de cadastro / validação de formulário**
   Tente cadastrar uma conta com um e-mail já usado por uma das contas de demonstração, ou envie
   os formulários de perfil/senha/carteiras com campos inválidos, para ver as mensagens de erro
   retornadas pela API simulada.

Detalhes de implementação de cada cenário (endpoints de desenvolvimento, transporte do Socket.IO
e persistência) estão documentados em [`docs/mocking.md`](docs/mocking.md).

## Testes end-to-end (Playwright)

```bash
npm run test:e2e
```

- Roda em Chromium, nos três recortes exigidos: desktop (1440px), tablet (768px) e mobile (390px).
- Cobre catálogo/filtros/paginação, acesso direto ao detalhe, sessão, favoritos, carrinho, compra
  completa, falha de pagamento, edição de perfil/carteiras, tempo real via Socket.IO, teclado e
  regressão visual (início, detalhe, carrinho e pagamento), com baselines versionadas em
  `tests/e2e/visualRegression.spec.ts-snapshots/`.
- Relatório HTML e traces das falhas ficam em `playwright-report/` e podem ser abertos com
  `npm run test:e2e:report`.

## Auditoria de performance (Lighthouse)

```bash
npm run lighthouse
```

- Builda a aplicação, sobe o preview otimizado (porta 4173) e audita **Início** e **Detalhe do
  NFT**, nos perfis **mobile** e **desktop**, com o cenário padrão dos mocks.
- Executa 3 medições por página/perfil e reporta a mediana de Performance, Accessibility, Best
  Practices e SEO, além de LCP, CLS e TBT.
- Relatórios HTML/JSON versionados são salvos em `reports/lighthouse/<data>/`.

## Deploy

A aplicação é publicada como um site estático na **Vercel** (build gerado por `npm run build`),
com os mocks habilitados no ambiente publicado (`VITE_ENABLE_MOCKS=true`, que já é o padrão — não
é necessário configurar nenhuma variável de ambiente para o deploy funcionar). O deploy é feito a
partir da integração Git da Vercel: todo push para a branch `main` gera automaticamente um novo
deployment de produção.

Acesso direto e refresh de qualquer rota funcionam na versão publicada graças ao `vercel.json` na
raiz do projeto, que redireciona todas as rotas para `index.html` (fallback de SPA):

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

- **Repositório:** https://github.com/hubdanielcode/JungleGaming-Challenge
- **URL pública:** https://marketplace-de-nft-s.vercel.app

Use as [contas de demonstração](#contas-de-demonstração) acima para testar o fluxo completo direto
na URL publicada.

## Documentação adicional

- [`ARCHITECTURE.md`](ARCHITECTURE.md) — contratos REST e de eventos, política de sessão, estado
  do carrinho, estratégia de cache/retries, reconciliação REST ↔ Socket.IO, limitações e desvios
  do Figma.
- [`docs/mocking.md`](docs/mocking.md) — detalhes de ativação, persistência/reset e cenários do
  MSW, incluindo o transporte usado para simular o Socket.IO.
