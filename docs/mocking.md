# Mocking com MSW

## Ativação

`VITE_ENABLE_MOCKS` controla o boot do MSW em `src/main.tsx`.
O mock fica ativo por padrão e pode ser desligado com `VITE_ENABLE_MOCKS=false`.

Os handlers REST ficam em `src/mocks/handlers`, o estado em `src/mocks/db.ts`
e os eventos em `src/mocks/realtimeBus.ts` e `src/mocks/socketHandlers.ts`.

## Persistência e reset

O estado simulado é persistido em `localStorage` na chave `kurio-mock-db-v1`.
O endpoint `POST /api/dev/reset` restaura fixtures, sessões, carrinhos,
favoritos, carteiras e pedidos para o cenário inicial.

## Cenários

Os cenários podem ser definidos por `?scenario=` ou pelo objeto global
`window.__kurioScenarios`.

| Cenário | Comportamento |
| --- | --- |
| `slow` | Latência de 1,5 a 3,5 segundos. |
| `flaky` | Latência variável e 30% de falhas transitórias. |
| `offline` | Recusa conexões do Socket.IO. |
| `order-timeout` | Mantém o pedido como `pending`. |
| `payment-declined` | Recusa o próximo pedido. |

## Endpoints de desenvolvimento

- `POST /api/dev/reset` restaura o estado inicial.
- `POST /api/dev/scenario` aplica alterações no cenário atual.
- `POST /api/dev/simulate/nft-update` altera preço ou disponibilidade e publica `nft.updated`.

## Socket.IO

O cliente utiliza `socket.io-client` e o mock utiliza `@mswjs/socket.io-binding`.
O fluxo de atualização passa pelo `realtimeBus`, depois pelo socket mock e só então
chega ao cliente. Isso evita simular tempo real diretamente no estado da interface.

## Contas de teste

| E-mail | Senha | Observação |
| --- | --- | --- |
| `andreza.colecionadora@kurio.test` | `kurio123` | Possui carteira principal. |
| `daniel.dev@kurio.test` | `kurio123` | Não possui carteira cadastrada. |

## Cupons

| Código | Efeito |
| --- | --- |
| `KURIO10` | 10% de desconto. |
| `BEMVINDO` | 0,05 ETH de desconto fixo. |
| `EXPIROU5` | Expirado. |

## Carteira no checkout

O checkout usa os endpoints mockados `POST /api/wallets/:id/connect` e
`POST /api/wallets/:id/disconnect`. O cenário `wallet-declined` faz a conexão retornar conflito de
simulação; o estado conectado/desconectado fica persistido no mock e a compra só pode ser criada
quando a carteira, provedor e rede selecionados forem coerentes e a carteira estiver conectada.
