import { expect, test } from "@playwright/test";
import { loginThroughUserInterface, resetMockedBackend } from "./support/testHelpers";

/* - Registra baselines das quatro áreas visuais pedidas pelo enunciado. O projeto tablet continua coberto pela suíte funcional, mas as baselines visuais são mantidas apenas nos recortes desktop e mobile solicitados explicitamente para regressão visual. - */

test.describe("Regressão visual", () => {
  test.beforeEach(async ({ page }) => {
    await resetMockedBackend(page);
  });

  test("início", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === "chromium-tablet", "Baseline visual mantida em desktop e mobile.");

    await page.goto("/");
    await expect(page.getByRole("heading", { name: /Seja dono/ })).toBeVisible();
    await expect(page).toHaveScreenshot("home.png", { fullPage: true, animations: "disabled" });
  });

  test("detalhe", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === "chromium-tablet", "Baseline visual mantida em desktop e mobile.");

    await page.goto("/");
    const firstNftLink = page.locator('a[aria-label^="Ver detalhes de"]').first();
    await expect(firstNftLink).toBeVisible();
    await firstNftLink.click();
    await expect(page.getByRole("heading").first()).toBeVisible();
    await expect(page).toHaveScreenshot("nft-detail.png", { fullPage: true, animations: "disabled" });
  });

  test("carrinho", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === "chromium-tablet", "Baseline visual mantida em desktop e mobile.");

    await page.goto("/");
    await page.locator('button[aria-label^="Adicionar"][aria-label$="ao carrinho"]').first().click();
    await page.waitForURL("/cart");
    await expect(page.getByRole("heading", { name: "Carrinho de NFTs" })).toBeVisible();
    await expect(page).toHaveScreenshot("cart.png", { fullPage: true, animations: "disabled" });
  });

  test("pagamento", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === "chromium-tablet", "Baseline visual mantida em desktop e mobile.");

    await loginThroughUserInterface(page);
    await page.goto("/");
    await page.locator('button[aria-label^="Adicionar"][aria-label$="ao carrinho"]').first().click();
    await page.waitForURL("/cart");
    await page.getByRole("button", { name: "Conectar e finalizar" }).click();
    await expect(page.getByText("Pagamento")).toBeVisible();
    await expect(page).toHaveScreenshot("payment.png", { fullPage: true, animations: "disabled" });
  });
});
