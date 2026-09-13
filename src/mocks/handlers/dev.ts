import { http, HttpResponse } from "msw";
import { mockDatabase } from "../db";
import { getNextEventVersion, realtimeBus } from "../realtimeBus";
import { getScenarioConfig, resetScenarioConfig, setScenarioConfig, type ScenarioConfig } from "../scenarios";

/* - Endpoints de desenvolvimento controlam apenas cenários dos mocks e não pertencem à API da aplicação. - */

const devHandlers = [
  http.post("/api/dev/reset", () => {
    mockDatabase.reset();
    resetScenarioConfig();

    return HttpResponse.json({
      ok: true,
    });
  }),

  http.post("/api/dev/scenario", async ({ request }) => {
    const scenarioPatch = (await request.json()) as Partial<ScenarioConfig>;

    setScenarioConfig(scenarioPatch);

    return HttpResponse.json({
      ok: true,
      scenario: getScenarioConfig(),
    });
  }),

  http.post("/api/dev/simulate/nft-update", async ({ request }) => {
    const input = (await request.json()) as {
      nftId: string;
      priceEth?: string;
      availableQuantity?: number;
      soldOut?: boolean;
      eventVersion?: number;
    };

    const currentNft = mockDatabase.state.nfts.find((nft) => nft.id === input.nftId);

    if (!currentNft) {
      return HttpResponse.json(
        {
          message: "NFT não encontrado.",
        },
        {
          status: 404,
        },
      );
    }

    const eventVersion = input.eventVersion ?? getNextEventVersion();

    if (input.priceEth !== undefined) {
      currentNft.priceEth = input.priceEth;
    }

    if (input.availableQuantity !== undefined) {
      currentNft.availableQuantity = input.availableQuantity;
    }

    if (input.soldOut !== undefined) {
      currentNft.edition.status = input.soldOut ? "sold_out" : "available";
      currentNft.availableQuantity = input.soldOut ? 0 : Math.max(1, currentNft.availableQuantity);
    }

    if (input.eventVersion === undefined) {
      currentNft.version = eventVersion;
      mockDatabase.persist();
    }

    realtimeBus.emit(
      "nft.updated",
      "nft",
      currentNft.id,
      {
        nftId: currentNft.id,
        priceEth: currentNft.priceEth,
        availableQuantity: currentNft.availableQuantity,
      },
      eventVersion,
    );

    return HttpResponse.json({
      ok: true,
      eventVersion,
    });
  }),
];

export { devHandlers };
