# Kurio — Marketplace de NFTs

Aplicação frontend do desafio técnico de Marketplace de NFTs.

## Stack

- React
- TypeScript
- Vite
- TanStack Router
- TanStack Query
- Axios
- Socket.IO Client
- Tailwind CSS
- shadcn/ui e Radix UI
- MSW
- Playwright

## Desenvolvimento

```bash
npm install
npm run dev
```

Os mocks ficam ativos por padrão. Para desligá-los:

```bash
VITE_ENABLE_MOCKS=false npm run dev
```

## Contas de demonstração

- `andreza.colecionadora@kurio.test` / `kurio123`
- `daniel.dev@kurio.test` / `kurio123`

## Cenários dos mocks

Use `?scenario=slow`, `?scenario=flaky`, `?scenario=offline`,
`?scenario=order-timeout` ou `?scenario=payment-declined` na URL.

O reset do estado simulado é feito por `POST /api/dev/reset` — o botão "Resetar cenário",
fixo no canto inferior direito enquanto os mocks estão ativos, chama esse endpoint e recarrega
a página. Use-o sempre que quiser voltar ao estado inicial das fixtures (por exemplo, após
alterar dados simulados durante o desenvolvimento), já que o banco simulado persiste em
`localStorage` para sobreviver a um refresh.

A implementação dos mocks está documentada em [`docs/mocking.md`](docs/mocking.md).
