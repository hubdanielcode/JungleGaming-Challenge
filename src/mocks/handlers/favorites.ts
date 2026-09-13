import { http, HttpResponse } from "msw";
import { mockDatabase } from "../db";
import { applyNetworkConditions, createApiErrorResponse, getSessionFromRequest } from "./shared";

const favoriteHandlers = [
  http.get("/api/favorites", async ({ request }) => {
    await applyNetworkConditions();

    const storedSession = getSessionFromRequest(request);

    if (!storedSession) {
      return createApiErrorResponse("UNAUTHENTICATED", "Faça login para ver seus favoritos.");
    }

    const favoriteNftIds = mockDatabase.state.favoritesByUser[storedSession.userId] ?? [];
    const favoriteNfts = mockDatabase.state.nfts.filter((nft) => favoriteNftIds.includes(nft.id));

    return HttpResponse.json({ items: favoriteNfts });
  }),

  http.post("/api/favorites/:nftId", async ({ request, params }) => {
    await applyNetworkConditions();

    const storedSession = getSessionFromRequest(request);

    if (!storedSession) {
      return createApiErrorResponse("UNAUTHENTICATED", "Faça login para favoritar.");
    }

    const nftId = String(params.nftId);
    const requestedNft = mockDatabase.state.nfts.find((nft) => nft.id === nftId);

    if (!requestedNft) {
      return createApiErrorResponse("NOT_FOUND", "NFT não encontrado.");
    }

    const favoriteNftIds = (mockDatabase.state.favoritesByUser[storedSession.userId] ??= []);

    if (!favoriteNftIds.includes(nftId)) favoriteNftIds.push(nftId);

    mockDatabase.persist();
    return HttpResponse.json({ ok: true }, { status: 201 });
  }),

  http.delete("/api/favorites/:nftId", async ({ request, params }) => {
    await applyNetworkConditions();

    const storedSession = getSessionFromRequest(request);

    if (!storedSession) {
      return createApiErrorResponse("UNAUTHENTICATED", "Faça login para gerenciar favoritos.");
    }

    const nftId = String(params.nftId);
    const favoriteNftIds = mockDatabase.state.favoritesByUser[storedSession.userId] ?? [];
    mockDatabase.state.favoritesByUser[storedSession.userId] = favoriteNftIds.filter((favoriteNftId) => favoriteNftId !== nftId);

    mockDatabase.persist();

    return HttpResponse.json({ ok: true });
  }),
];

export { favoriteHandlers };
