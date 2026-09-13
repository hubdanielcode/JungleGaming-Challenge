import { expect, test } from "@playwright/test";
import { loginThroughUserInterface, resetMockedBackend, simulateNftUpdate } from "./support/testHelpers";

/* - Cobre "eventos Socket.IO durante checkout" e "duplicatas/eventos antigos/reconexão". */

test.describe("Atualizações em tempo real (Socket.IO)", () => {
  test.beforeEach(async ({ page }) => {
    await resetMockedBackend(page);
  });

  test("preço mudando via Socket.IO durante o checkout marca a cotação como obsoleta", async ({ page }) => {
    await loginThroughUserInterface(page);
    await page.goto("/");

    const firstCardLink = page.locator('a[aria-label^="Ver detalhes de"]').first();
    const detailHref = await firstCardLink.getAttribute("href");
    const nftId = detailHref!.split("/nfts/")[1];

    await firstCardLink.click();
    await page.getByRole("button", { name: "COMPRAR" }).click();
    await page.waitForURL("/cart");
    await page.getByRole("button", { name: "Ir para pagamento" }).click();
    await page.waitForURL("/checkout");

    await simulateNftUpdate(page, { nftId, priceEth: "99.9900" });

    await page.getByRole("button", { name: "Confirmar compra" }).click();
    await expect(page.getByRole("alert")).toContainText(/cotação mudou|atualize o resumo/i);

    await expect(page.getByText("99.9900 ETH")).toHaveCount(0);
  });

  test("evento de versão antiga não regride o estado exibido", async ({ page }) => {
    await loginThroughUserInterface(page);
    await page.goto("/");

    const firstCardLink = page.locator('a[aria-label^="Ver detalhes de"]').first();
    const detailHref = await firstCardLink.getAttribute("href");
    const nftId = detailHref!.split("/nfts/")[1];
    await firstCardLink.click();

    const latestEventVersion = await simulateNftUpdate(page, { nftId, priceEth: "5.0000" });
    await expect(page.getByText("5.0000 ETH")).toBeVisible({ timeout: 5000 });

    await simulateNftUpdate(page, {
      nftId,
      priceEth: "1.0000",
      eventVersion: latestEventVersion,
    });

    /* - O segundo evento usa a mesma versão do primeiro. O RealtimeClient descarta versões <= última aplicada, portanto o preço exibido não pode regredir para 1.0000 ETH. - */

    await expect(page.getByText("5.0000 ETH")).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("1.0000 ETH")).toHaveCount(0);

    await page.reload();
    await expect(page.getByText("5.0000 ETH")).toBeVisible({ timeout: 5000 });
  });

  test("reconexão do socket com pedido pendente eventualmente resolve o status", async ({ page }) => {
    await loginThroughUserInterface(page);
    await page.goto("/");
    await page.locator('button[aria-label^="Adicionar"][aria-label$="ao carrinho"]').first().click();
    await page.waitForURL("/cart");
    await page.getByRole("button", { name: "Ir para pagamento" }).click();
    await page.waitForURL("/checkout");
    await page.getByLabel("Nome").fill("Andreza Colecionadora");
    await page.getByLabel("E-mail").fill("andreza.colecionadora@kurio.test");
    const walletOption = page.getByRole("radio").first();
    if (await walletOption.isVisible().catch(() => false)) {
      await walletOption.check();
    }

    await page.getByRole("button", { name: "Confirmar compra" }).click();
    await page.waitForURL(/\/confirmation\//);
    await expect(page.getByText("Pagamento em processamento")).toBeVisible();

    /* - Simula queda e reconexão de rede no nível do navegador; o cliente Socket.IO deve reconectar sozinho (reconnection: true, reconnectionDelay: 1000, ver src/lib/socket.ts) e o polling de refetchInterval do pedido (2s) cobre o caso de o evento se perder. */

    await page.context().setOffline(true);
    await page.waitForTimeout(1500);
    await page.context().setOffline(false);

    await expect(page.getByText(/compra confirmada|pagamento recusado/i)).toBeVisible({ timeout: 15000 });
  });
});
