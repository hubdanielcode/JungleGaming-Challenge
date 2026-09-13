import { expect, type Page } from "@playwright/test";

const knownTestUsers = {
  primary: {
    email: "andreza.colecionadora@kurio.test",
    password: "kurio123",
    username: "andreza.colecionadora",
  },
  secondary: {
    email: "daniel.dev@kurio.test",
    password: "kurio123",
    username: "daniel.dev",
  },
} as const;

type TestUserCredentials = {
  email: string;
  password: string;
  username: string;
};

const knownCoupons = {
  activePercentOff: "KURIO10",
  activeFixedOff: "BEMVINDO",
  expired: "EXPIROU5",
} as const;

interface ScenarioConfigPatch {
  latency?: "none" | "fast" | "variable" | "slow";
  transientFailureRate?: number;
  offline?: boolean;
  forceOrderTimeout?: boolean;
  nextPaymentOutcome?: "confirmed" | "declined" | null;
}

interface SimulateNftUpdateInput {
  nftId: string;
  priceEth?: string;
  availableQuantity?: number;
  eventVersion?: number;
}

/* - Os endpoints de controle dos mocks são chamados pelo próprio browser para que o request atravesse o Service Worker do MSW. Assim, o teste não depende de uma API externa ou de um servidor de mock separado do fluxo que a aplicação realmente utiliza. - */
const resetMockedBackend = async (page: Page) => {
  await page.goto("/");
  await page.locator("body").waitFor();

  const responseStatus = await page.evaluate(async () => {
    const response = await fetch("/api/dev/reset", {
      method: "POST",
    });
    return response.status;
  });

  expect(responseStatus).toBe(200);
};

const applyScenarioPatch = async (page: Page, scenarioPatch: ScenarioConfigPatch) => {
  const responseStatus = await page.evaluate(async (patch) => {
    const response = await fetch("/api/dev/scenario", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(patch),
    });

    return response.status;
  }, scenarioPatch);

  expect(responseStatus).toBe(200);
};

const simulateNftUpdate = async (page: Page, simulateNftUpdateInput: SimulateNftUpdateInput): Promise<number> => {
  const simulateNftUpdateResult = await page.evaluate(async (input) => {
    const response = await fetch("/api/dev/simulate/nft-update", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    });

    return {
      ok: response.ok,
      status: response.status,
      body: (await response.json()) as { eventVersion: number },
    };
  }, simulateNftUpdateInput);

  expect(simulateNftUpdateResult.ok).toBeTruthy();
  expect(simulateNftUpdateResult.status).toBe(200);

  return simulateNftUpdateResult.body.eventVersion;
};

const loginThroughUserInterface = async (page: Page, credentials: TestUserCredentials = knownTestUsers.primary) => {
  await page.goto("/login");

  await page
    .getByRole("textbox", {
      name: "E-mail",
      exact: true,
    })
    .fill(credentials.email);

  await page
    .getByRole("textbox", {
      name: "Senha",
      exact: true,
    })
    .fill(credentials.password);

  await page.getByRole("button", { name: "Entrar" }).click();

  await expect(page).toHaveURL(/\/(?:\?page=1)?$/, {
    timeout: 15000,
  });
};

const getFirstNftCardLink = async (page: Page) => {
  const firstNftLink = page.locator('a[aria-label^="Ver detalhes de"]').first();

  await expect(firstNftLink).toBeVisible();

  return firstNftLink;
};

const extractNftNameFromCardLink = async (page: Page) => {
  const firstNftLink = await getFirstNftCardLink(page);
  const accessibleName = await firstNftLink.getAttribute("aria-label");

  if (!accessibleName) {
    throw new Error("O primeiro NFT não possui aria-label.");
  }

  return accessibleName.replace("Ver detalhes de ", "");
};

export {
  knownTestUsers,
  knownCoupons,
  resetMockedBackend,
  applyScenarioPatch,
  simulateNftUpdate,
  loginThroughUserInterface,
  getFirstNftCardLink,
  extractNftNameFromCardLink,
};
