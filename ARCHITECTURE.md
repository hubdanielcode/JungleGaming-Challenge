# Arquitetura — Kurio Marketplace de NFTs

Este documento registra as decisões técnicas da solução, os contratos entre o cliente e a API
simulada, a política de sessão e carrinho, a estratégia de cache e a reconciliação entre REST e
Socket.IO. Ele complementa o `README.md` (setup e execução) e o `docs/mocking.md` (detalhes da
camada de mocks) exigidos na seção 12 do enunciado.

## 1. Visão geral

A aplicação é um cliente React/TypeScript servido pelo Vite, com três camadas de integração:

- **TanStack Router** cuida das rotas, dos parâmetros de busca e da proteção dos fluxos privados.
- **TanStack Query** cuida do estado assíncrono (consultas, mutations, cache e invalidação).
- **Axios** é o único cliente HTTP (`src/lib/axios.ts`); nenhum componente ou hook chama `fetch`
  diretamente nem contém dados fictícios embutidos — toda simulação vive na camada de rede (MSW).

## 2. Contratos REST

Todos os endpoints abaixo estão implementados em `src/mocks/handlers` e documentados também em
`docs/mocking.md` do ponto de vista de cenários. Aqui o foco é o contrato em si.

### 2.1 Sessão e conta

| Método | Rota                 | Descrição                                                                                   |
| ------ | -------------------- | ------------------------------------------------------------------------------------------- |
| `POST` | `/api/auth/register` | Cria a conta; retorna `CONFLICT` para e-mail já cadastrado e `VALIDATION_ERROR` para campos |
|        |                      | inválidos.                                                                                  |
| `POST` | `/api/auth/login`    | Autentica; retorna `UNAUTHENTICATED` para credenciais inválidas.                            |
| `GET`  | `/api/session`       | Consulta a sessão atual; retorna `SESSION_EXPIRED` quando o token expirou.                  |
| `POST` | `/api/auth/logout`   | Encerra a sessão no servidor simulado.                                                      |

### 2.2 NFTs

| Método | Rota            | Descrição                                                            |
| ------ | --------------- | -------------------------------------------------------------------- |
| `GET`  | `/api/nfts`     | Listagem com busca, filtros, ordenação e paginação via query string. |
| `GET`  | `/api/nfts/:id` | Detalhe por identificador; retorna `NOT_FOUND` para NFT inexistente. |

### 2.3 Favoritos

| Método   | Rota                    | Descrição                                           |
| -------- | ----------------------- | --------------------------------------------------- |
| `GET`    | `/api/favorites`        | Lista os NFTs favoritados pelo usuário autenticado. |
| `POST`   | `/api/favorites/:nftId` | Adiciona aos favoritos.                             |
| `DELETE` | `/api/favorites/:nftId` | Remove dos favoritos.                               |

### 2.4 Carrinho

| Método   | Rota                      | Descrição                                                       |
| -------- | ------------------------- | --------------------------------------------------------------- |
| `GET`    | `/api/cart`               | Consulta o carrinho do usuário ou do visitante (por `guestId`). |
| `POST`   | `/api/cart/items`         | Adiciona um item, respeitando o limite de edição disponível.    |
| `PATCH`  | `/api/cart/items/:itemId` | Altera a quantidade de um item.                                 |
| `DELETE` | `/api/cart/items/:itemId` | Remove um item.                                                 |
| `POST`   | `/api/cart/coupon`        | Aplica um cupom; retorna o status `invalid` ou `expired` quando |
|          |                           | aplicável                                                       |
| `DELETE` | `/api/cart/coupon`        | Remove o cupom aplicado.                                        |
| `GET`    | `/api/cart/quote`         | Cotação atual (subtotal, desconto, taxa de rede e total).       |

### 2.5 Pedidos

| Método | Rota              | Descrição                                               |
| ------ | ----------------- | ------------------------------------------------------- |
| `POST` | `/api/orders`     | Cria o pedido; ver política de idempotência na seção 4. |
| `GET`  | `/api/orders/:id` | Consulta o estado e o recibo do pedido.                 |

### 2.6 Perfil

| Método  | Rota                    | Descrição                          |
| ------- | ----------------------- | ---------------------------------- |
| `GET`   | `/api/profile`          | Consulta os dados do colecionador. |
| `PATCH` | `/api/profile`          | Atualiza nome e e-mail.            |
| `PUT`   | `/api/profile/avatar`   | Atualiza o avatar.                 |
| `POST`  | `/api/profile/password` | Altera a senha.                    |

### 2.7 Carteiras

| Método  | Rota               | Descrição                                                |
| ------- | ------------------ | -------------------------------------------------------- |
| `GET`   | `/api/wallets`     | Lista as carteiras cadastradas (principal e secundária). |
| `POST`  | `/api/wallets`     | Cadastra uma carteira.                                   |
| `PATCH` | `/api/wallets/:id` | Atualiza uma carteira existente.                         |

### 2.8 Erros

Toda resposta de erro segue o mesmo formato (`ApiErrorBody`, em `src/types/common.ts`):

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Mensagem legível para o usuário.",
    "fields": [{ "field": "email", "message": "E-mail inválido." }]
  }
}
```

Os códigos usados são `VALIDATION_ERROR`, `UNAUTHENTICATED`, `SESSION_EXPIRED`, `FORBIDDEN`,
`NOT_FOUND`, `CONFLICT`, `AVAILABILITY_CONFLICT`, `IDEMPOTENCY_CONFLICT`, `RATE_LIMITED`,
`TRANSIENT_FAILURE` e `INTERNAL_ERROR`. O cliente Axios converte essas respostas em instâncias de
`ApiError`, para que o código de UI decida o tratamento por código, nunca por texto da mensagem.

## 3. Valores em ETH

Preços, subtotal, desconto, taxa de rede e total trafegam como `DecimalString` (string decimal,
nunca `number`), para não perder precisão em ponto flutuante. Toda soma, subtração e proporção
sobre esses valores passa por `src/lib/decimal.ts`, que converte a string para uma base fixa de
18 casas decimais usando `bigint` antes de operar, e só formata de volta para exibição no fim da
cadeia de cálculo. Quantidades de itens são sempre inteiras (`number`).

## 4. Pedidos e idempotência

A criação de pedido (`POST /api/orders`) exige um cabeçalho `Idempotency-Key`. O servidor
simulado mantém um mapa `idempotencyKey → orderId`:

- Reenviar a mesma chave com os mesmos dados (carteira, nome, e-mail, cupom) devolve o pedido já
  criado, sem duplicar a compra — cobre clique repetido e reenvio após timeout.
- Reenviar a mesma chave com dados diferentes retorna `IDEMPOTENCY_CONFLICT`.
- Antes de criar o pedido, o servidor recalcula a cotação do carrinho; se ela estiver
  desatualizada (`cartQuote.stale`) ou o cupom aplicado tiver mudado, a resposta é
  `AVAILABILITY_CONFLICT`, obrigando o cliente a revalidar antes de tentar de novo.

No cliente, a chave de idempotência é gerada uma vez por tentativa de checkout e persistida em
`localStorage` por identidade (`src/lib/pendingOrder.ts`), junto com o `orderId` assim que a API
responde:

- Se a página remontar antes da resposta da criação do pedido (refresh, queda de conexão), o
  checkout reaproveita a mesma chave de idempotência em vez de gerar outra — cobre o caso de
  reenvio antes de qualquer resposta do servidor.
- Se o pedido já foi criado (`orderId` presente no registro), o checkout redireciona
  imediatamente para `/confirmation/:orderId` em vez de permitir o preenchimento de uma nova
  compra, mesmo sem o `orderId` estar na URL ainda.
- O registro é limpo (`clearPendingOrder`) quando o pedido chega a um estado terminal
  (`confirmed` ou `declined`) na tela de confirmação, liberando o checkout para uma nova compra.

## 5. Sessão

- O token de sessão fica em `localStorage` (`kurio-session-token`), nunca a senha em claro.
- Um `guestId` também em `localStorage` (`kurio-guest-id`) identifica o carrinho de um visitante
  não autenticado, para que os itens adicionados antes do login sejam preservados ao autenticar.
- `GET /api/session` retorna `SESSION_EXPIRED` quando o token expirou; o cliente trata esse
  código de forma centralizada, preservando o contexto de navegação (inclusive durante o
  checkout) para retomada após novo login.
- No logout (`src/features/authentication/hooks.ts`), o cache do TanStack Query é limpo para
  sessão, perfil, favoritos, carrinho e carteiras (`queryClient.removeQueries`), para não vazar
  dados privados de um usuário para o próximo que logar na mesma aba.
- Além da limpeza no logout, as chaves de cache privadas (`queryKeys.cart`, `.favorites`,
  `.profile`, `.wallets`, `.session`, em `src/lib/queryClient.ts`) são funções que embutem a
  identidade ativa (`getActiveIdentityId()`, em `src/lib/session.ts`: o token de sessão, ou
  `guest:<guestId>` para visitante) diretamente na chave. Assim, o isolamento entre usuários não
  depende só da limpeza rodar em todo caminho de troca de sessão — identidades diferentes nunca
  computam a mesma chave de cache, mesmo num login direto de um usuário para outro sem logout
  explícito. Ao trocar de identidade, os dados da identidade anterior ficam órfãos no cache até
  o `gcTime` expirar; a limpeza explícita no logout apenas libera essa memória mais cedo.

## 6. Estado do carrinho

O carrinho é resolvido no servidor simulado por usuário autenticado ou por `guestId`. Cada item
carrega `priceVersion`, `maxQuantity` e `available`, para refletir mudanças de preço e
disponibilidade recebidas via evento em tempo real enquanto o carrinho está aberto (seção 7). A
cotação (`GET /api/cart/quote`) é a referência final: ela recalcula subtotal, desconto, taxa de
rede e total a partir do estado atual, e marca `stale: true` quando algo mudou desde a última
cotação vista pelo cliente — é essa flag que bloqueia a confirmação do pedido até o usuário revisar
o carrinho de novo.

## 7. Estratégia de cache (TanStack Query)

Configuração central em `src/lib/queryClient.ts`:

- `staleTime` de 30 segundos e `gcTime` de 5 minutos como padrão, para evitar refetch agressivo
  em navegação comum, sem manter dados obsoletos por muito tempo.
- `refetchOnWindowFocus` desativado, porque a atualização de dados sensíveis a tempo (preço,
  disponibilidade, estado do pedido) já é feita pelos eventos de Socket.IO, não por foco de janela.
- Retentativa automática de consultas (até 2 vezes) para falhas transitórias, mas nunca para uma
  `ApiError` (erro de negócio, ex. validação ou conflito), que deve ser tratado pela UI e não
  repetido silenciosamente.
- Mutations nunca fazem retry automático — evita duplicar efeitos colaterais (ex. criar pedido ou
  aplicar cupom duas vezes); a repetição intencional de uma mutation de pedido é responsabilidade
  explícita da idempotência (seção 4).
- Atualização otimista está implementada com rollback em pelo menos uma interação (identificada
  em `src/routes/index.tsx`); ao estender esse padrão para outras mutations, o rollback deve
  restaurar o `queryClient.setQueryData` anterior salvo em `onMutate`.

## 8. Tempo real (Socket.IO)

O cliente (`src/lib/socket.ts`) mantém uma conexão por sessão e trata cada evento como um
envelope: `{ id, resource, resourceId, version, emittedAt, payload }` (`RealtimeEvent`, em
`src/types/common.ts`). Para cada combinação `resource:resourceId`, o cliente guarda a última
versão aplicada e descarta qualquer evento com versão igual ou anterior — isso cobre duplicatas e
eventos antigos chegando fora de ordem, sem regredir um estado mais recente nem reaplicar efeitos.

Eventos implementados:

- `nft.updated`: atualiza preço e disponibilidade no catálogo, no detalhe e no carrinho.
- `order.updated`: atualiza o estado do pedido e dispara a confirmação ou recusa na tela de
  confirmação.

No mock, os eventos passam pelo protocolo real de Socket.IO via `@mswjs/socket.io-binding`
(documentado em `docs/mocking.md`); nenhuma tela atualiza estado diretamente a partir do mock, só
a partir do evento recebido pelo `socket.io-client`.

Ao reconectar (`RealtimeClient.onReconnect`, consumido em `AppShell` para catálogo/carrinho/pedidos
e na tela de confirmação para o pedido específico em exibição), o cliente revalida via REST os
recursos que dependem de tempo real, em vez de esperar o próximo evento ou o próximo `staleTime`
natural. Isso cobre o caso de um evento ter sido perdido durante a queda de conexão: a reconciliação
por REST corrige o estado imediatamente na volta, e o dedup por versão (acima) evita que um evento
tardio da mesma queda reaplique um efeito já corrigido.

## 9. Assets e desvios do Figma

- O Figma entregue não inclui os artworks originais de cada NFT individual (só as telas de
  layout). Para manter a aplicação executável localmente sem depender de um serviço externo de
  imagens aleatórias, as imagens de NFT são geradas localmente e de forma determinística por
  `scripts/generateNftAvatars.ts` (retrato geométrico variando por seed), salvas em
  `public/images/nfts`. Isso preserva a composição visual das telas (proporção, moldura, grade)
  sem depender de uma rede externa durante a auditoria de Lighthouse ou a execução dos testes.
- O Figma fornecido tem apenas as pastas `Desktop` e `Mobile`, sem frame de tablet. O enunciado
  permite implementar apenas os frames disponíveis, mas ainda exige testar a faixa de 768px — as
  telas foram adaptadas nesse breakpoint a partir do layout mobile, priorizando não deixar
  conteúdo cortado nem gerar rolagem horizontal indevida.

## 10. Limitações conhecidas (resumo)

Para referência rápida:

1. ~~Chave de idempotência do checkout não sobrevive a um refresh no meio exato do envio~~ —
   resolvido: a chave e o `orderId` resultante são persistidos por identidade em
   `src/lib/pendingOrder.ts` (seção 4).
2. ~~Chaves de cache do TanStack Query não são segmentadas por id de usuário~~ — resolvido: as
   chaves privadas embutem a identidade ativa (seção 5).
3. ~~`onReconnect` do cliente Socket.IO não está conectado a uma reconciliação com a API REST~~ —
   resolvido: `AppShell` e a tela de confirmação revalidam via REST ao reconectar (seção 8).
4. Regressão visual (Playwright) configurada para início, detalhe, carrinho e pagamento
   (`tests/visual`); as baselines precisam ser geradas (`playwright test --update-snapshots`) e
   commitadas a partir de uma execução real antes da entrega.
5. Não há suíte de auditoria Lighthouse versionada além do script em `scripts/lighthouse.mjs` — os
   relatórios de referência ainda precisam ser gerados e commitados em `reports/lighthouse`
   rodando localmente (este ambiente de desenvolvimento não tem um navegador gráfico disponível).
