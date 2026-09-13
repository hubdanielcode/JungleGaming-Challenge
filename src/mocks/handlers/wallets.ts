import { http, HttpResponse } from "msw";
import type { Wallet, WalletInput } from "@/types";
import { mockDatabase } from "../db";
import { applyNetworkConditions, createApiErrorResponse, getSessionFromRequest } from "./shared";
import { getScenarioConfig } from "../scenarios";

const walletHandlers = [
  http.get("/api/wallets", async ({ request }) => {
    await applyNetworkConditions();

    const storedSession = getSessionFromRequest(request);

    if (!storedSession) {
      return createApiErrorResponse("UNAUTHENTICATED", "Faça login para ver suas carteiras.");
    }

    return HttpResponse.json({
      items: mockDatabase.state.walletsByUser[storedSession.userId] ?? [],
    });
  }),

  http.post("/api/wallets", async ({ request }) => {
    await applyNetworkConditions();

    const storedSession = getSessionFromRequest(request);

    if (!storedSession) {
      return createApiErrorResponse("UNAUTHENTICATED", "Faça login para cadastrar uma carteira.");
    }

    const walletInput = (await request.json()) as WalletInput;

    if (!walletInput.address || !/^0x[0-9a-fA-F]{8,64}$/.test(walletInput.address)) {
      return createApiErrorResponse("VALIDATION_ERROR", "Endereço de carteira inválido.", [
        { field: "address", message: "Endereço de carteira inválido." },
      ]);
    }

    const userWallets = (mockDatabase.state.walletsByUser[storedSession.userId] ??= []);
    const walletKindAlreadyExists = userWallets.some((wallet) => wallet.kind === walletInput.kind);

    if (walletKindAlreadyExists) {
      const walletKindLabel = walletInput.kind === "primary" ? "principal" : "secundária";

      return createApiErrorResponse("CONFLICT", `Já existe uma carteira ${walletKindLabel}.`);
    }

    const newWallet: Wallet = {
      id: `wallet-${Math.random().toString(36).slice(2, 8)}`,
      kind: walletInput.kind,
      address: walletInput.address,
      network: walletInput.network,
      provider: walletInput.provider,
      label: walletInput.label ?? (walletInput.kind === "primary" ? "Principal" : "Secundária"),
      connectionStatus: "connected",
    };

    userWallets.push(newWallet);
    mockDatabase.persist();

    return HttpResponse.json(newWallet, { status: 201 });
  }),

  http.patch("/api/wallets/:id", async ({ request, params }) => {
    await applyNetworkConditions();

    const storedSession = getSessionFromRequest(request);

    if (!storedSession) {
      return createApiErrorResponse("UNAUTHENTICATED", "Faça login para editar carteiras.");
    }

    const walletInput = (await request.json()) as Partial<WalletInput>;
    const userWallets = mockDatabase.state.walletsByUser[storedSession.userId] ?? [];
    const walletToUpdate = userWallets.find((wallet) => wallet.id === params.id);

    if (!walletToUpdate) {
      return createApiErrorResponse("NOT_FOUND", "Carteira não encontrada.");
    }

    if (walletInput.address && !/^0x[0-9a-fA-F]{8,64}$/.test(walletInput.address)) {
      return createApiErrorResponse("VALIDATION_ERROR", "Endereço de carteira inválido.", [
        { field: "address", message: "Endereço de carteira inválido." },
      ]);
    }

    Object.assign(walletToUpdate, walletInput);
    mockDatabase.persist();

    return HttpResponse.json(walletToUpdate);
  }),
  http.post("/api/wallets/:id/connect", async ({ request, params }) => {
    await applyNetworkConditions();

    const storedSession = getSessionFromRequest(request);
    if (!storedSession) {
      return createApiErrorResponse("UNAUTHENTICATED", "Faça login para conectar a carteira.");
    }

    const userWallets = mockDatabase.state.walletsByUser[storedSession.userId] ?? [];
    const wallet = userWallets.find((currentWallet) => currentWallet.id === params.id);
    if (!wallet) {
      return createApiErrorResponse("NOT_FOUND", "Carteira não encontrada.");
    }

    if (getScenarioConfig().walletConnectionOutcome === "declined") {
      wallet.connectionStatus = "disconnected";
      mockDatabase.persist();
      return createApiErrorResponse("AVAILABILITY_CONFLICT", "A conexão da carteira foi recusada pela simulação.");
    }

    wallet.connectionStatus = "connected";
    mockDatabase.persist();
    return HttpResponse.json(wallet);
  }),

  http.post("/api/wallets/:id/disconnect", async ({ request, params }) => {
    await applyNetworkConditions();

    const storedSession = getSessionFromRequest(request);
    if (!storedSession) {
      return createApiErrorResponse("UNAUTHENTICATED", "Faça login para desconectar a carteira.");
    }

    const userWallets = mockDatabase.state.walletsByUser[storedSession.userId] ?? [];
    const wallet = userWallets.find((currentWallet) => currentWallet.id === params.id);
    if (!wallet) {
      return createApiErrorResponse("NOT_FOUND", "Carteira não encontrada.");
    }

    wallet.connectionStatus = "disconnected";
    mockDatabase.persist();
    return HttpResponse.json(wallet);
  }),

];

export { walletHandlers };
