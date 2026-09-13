import { http, HttpResponse } from "msw";
import type { NFTUpdatedPayload } from "@/types";
import { mockDatabase } from "../db";
import { getNextEventVersion, realtimeBus } from "../realtimeBus";
import { resetScenarioConfig, setScenarioConfig, type ScenarioConfig } from "../scenarios";

/* - Endpoints de desenvolvimento controlam apenas cenários dos mocks e não pertencem à API da aplicação. - */

const devHandlers = [
  http.post("/api/dev/reset", async () => {
    mockDatabase.reset();
    resetScenarioConfig();

    return HttpResponse.json({ ok: true });
  }),

  http.post("/api/dev/scenario", async ({ request }) => {
    const scenarioPatch = (await request.json()) as Partial<ScenarioConfig>;
    setScenarioConfig(scenarioPatch);

    return HttpResponse.json({ ok: true });
  }),

  http.post("/api/dev/simulate/nft-update", async ({ request }) => {
    const nftUpdateInput = (await request.json()) as {
      nftId: string;
      priceEth?: string;
      availableQuantity?: number;
      eventVersion?: number;
    };

    const requestedNft = mockDatabase.state.nfts.find((nft) => nft.id === nftUpdateInput.nftId);

    if (!requestedNft) {
      return HttpResponse.json({ ok: false }, { status: 404 });
    }

    if (nftUpdateInput.priceEth !== undefined) {
      requestedNft.priceEth = nftUpdateInput.priceEth;
    }

    if (nftUpdateInput.availableQuantity !== undefined) {
      requestedNft.availableQuantity = nftUpdateInput.availableQuantity;
    }

    const eventVersion = nftUpdateInput.eventVersion ?? getNextEventVersion();

    if (nftUpdateInput.eventVersion === undefined) {
      requestedNft.version = eventVersion;
      mockDatabase.persist();
    }

    const nftUpdatedPayload: NFTUpdatedPayload = {
      nftId: requestedNft.id,
      priceEth: requestedNft.priceEth,
      edition: requestedNft.edition,
      availableQuantity: requestedNft.availableQuantity,
      version: eventVersion,
    };

    realtimeBus.emit("nft.updated", "nft", requestedNft.id, nftUpdatedPayload, eventVersion);

    return HttpResponse.json({ ok: true, eventVersion });
  }),
];

export { devHandlers };
