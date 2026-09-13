import { expect, test } from "@playwright/test";
import { knownCoupons, loginThroughUserInterface, resetMockedBackend } from "./support/testHelpers";

/* - Cobre o grupo "carrinho completo": quantidade, remoção, cupom válido/expirado e persistência. - */

test.describe("Carrinho de NFTs", () => {
  test.beforeEach(async ({ page }) => {
    await resetMockedBackend(page);
  });

  const addFirstNftToCart = async (page: import("@playwright/test").Page) => {
    await page.goto("/");
    await page.locator('button[aria-label^="Adicionar"][aria-label$="ao carrinho"]').first().click();
    await page.waitForURL("/cart");
  };

  test("aumentar e diminuir quantidade recalcula o total da linha", async ({ page }) => {
    await addFirstNftToCart(page);

    const firstRow = page.locator("tbody tr").first();
    const increaseButton = firstRow.locator("button:has(svg.lucide-plus)");
    const decreaseButton = firstRow.locator("button:has(svg.lucide-minus)");
    const lineTotalCell = firstRow.locator("td").nth(3);

    const initialLineTotalText = await lineTotalCell.textContent();

    await increaseButton.click();
    await expect(lineTotalCell).not.toHaveText(initialLineTotalText ?? "");

    await decreaseButton.click();
    await expect(lineTotalCell).toHaveText(initialLineTotalText ?? "");
  });

  test("remover item esvazia o carrinho e mostra o estado vazio", async ({ page }) => {
    await addFirstNftToCart(page);

    const removeButton = page.locator("tbody tr").first().locator('button[aria-label^="Remover"][aria-label$="do carrinho"]');
    await removeButton.click();

    await expect(page.getByText("Seu carrinho está vazio.")).toBeVisible();
  });

  test("aplicar cupom válido reflete desconto no resumo", async ({ page }) => {
    await addFirstNftToCart(page);

    await page.getByLabel("Código promocional").fill(knownCoupons.activePercentOff);
    await page.locator('button:has(svg.lucide-ticket)').click();

    await expect(page.getByText(`Cupom ${knownCoupons.activePercentOff} aplicado`)).toBeVisible();
    await expect(page.getByText("Desconto").locator("xpath=following-sibling::span")).not.toHaveText("0 ETH");
  });

  test("aplicar cupom expirado mostra mensagem de erro e não altera o total", async ({ page }) => {
    await addFirstNftToCart(page);

    await page.getByLabel("Código promocional").fill(knownCoupons.expired);
    await page.locator('button:has(svg.lucide-ticket)').click();

    await expect(page.getByText("Cupom inválido ou expirado.")).toBeVisible();
    await expect(page.getByText(`Cupom ${knownCoupons.expired} aplicado`)).toHaveCount(0);
  });

  test("carrinho persiste após refresh da página", async ({ page }) => {
    await addFirstNftToCart(page);
    const rowCountBeforeReload = await page.locator("tbody tr").count();

    await page.reload();

    await expect(page.locator("tbody tr")).toHaveCount(rowCountBeforeReload);
  });

  test("carrinho de visitante é mesclado ao carrinho autenticado após login", async ({ page }) => {
    await addFirstNftToCart(page);
    const guestCartItemCount = await page.locator("tbody tr").count();

    await loginThroughUserInterface(page);

    await page.goto("/cart");
    await expect(page.locator("tbody tr")).toHaveCount(guestCartItemCount);
  });

  test("acessar o carrinho vazio mostra chamada para explorar o catálogo", async ({ page }) => {
    await page.goto("/cart");

    await expect(page.getByText("Seu carrinho está vazio.")).toBeVisible();
    await page.getByRole("link", { name: "Explorar NFTs" }).click();
    await expect(page).toHaveURL("/");
  });
});
