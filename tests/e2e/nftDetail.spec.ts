import { expect, test } from "@playwright/test";
import { getFirstNftCardLink, resetMockedBackend, simulateNftUpdate } from "./support/testHelpers";

/* - Cobre o grupo "acesso direto ao detalhe" e parte de favoritos/carrinho a partir do Detalhe. - */

test.describe("Detalhe do NFT", () => {
  test.beforeEach(async ({ page }) => {
    await resetMockedBackend(page);
  });

  test("acesso direto pela URL carrega o NFT sem passar pelo catálogo", async ({ page }) => {
    await page.goto("/");
    const firstCardLink = await getFirstNftCardLink(page);
    const detailHref = await firstCardLink.getAttribute("href");
    expect(detailHref).toBeTruthy();

    await page.goto(detailHref!);

    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByText(/ETH$/).first()).toBeVisible();
  });

  test("NFT inexistente mostra estado de não encontrado com link de volta ao catálogo", async ({ page }) => {
    await page.goto("/nfts/nft-que-nao-existe-123");

    await expect(page.getByText("NFT não encontrado")).toBeVisible();
    await page.getByRole("link", { name: "Voltar para o catálogo" }).click();
    await expect(page).toHaveURL("/");
  });

  test("edição esgotada desabilita a compra e mostra o rótulo correspondente", async ({ page }) => {
    await page.goto("/");
    const firstCardLink = await getFirstNftCardLink(page);
    const detailHref = await firstCardLink.getAttribute("href");
    const nftId = detailHref!.split("/nfts/")[1];

    await simulateNftUpdate(page, { nftId, availableQuantity: 0 });
    await page.goto(detailHref!);

    await expect(page.getByRole("button", { name: "Edição esgotada" })).toBeDisabled();
  });

  test("botões de quantidade respeitam o mínimo de 1 e o limite máximo por pedido", async ({ page }) => {
    await page.goto("/");
    const firstCardLink = await getFirstNftCardLink(page);
    await firstCardLink.click();

    /* - Os botões de quantidade (Minus/Plus do lucide-react) não têm aria-label — este é um dos  achados de cessibilidade documentados no ARCHITECTURE.md. Enquanto o bug não é corrigido, localizamos pelo ícone SVG renderizado (classe "lucide-minus"/"lucide-plus"), que é a única  forma estável de alcançar esses botões hoje. - */

    const decreaseButton = page.locator("button:has(svg.lucide-minus)");
    const increaseButton = page.locator("button:has(svg.lucide-plus)");
    const quantityValue = page.locator("span.font-mono").filter({ hasText: /^\d+$/ });

    await expect(quantityValue).toHaveText("1");
    await expect(decreaseButton).toBeDisabled();

    await increaseButton.click();
    await expect(quantityValue).toHaveText("2");
    await expect(decreaseButton).toBeEnabled();

    /* - Clica no "+" repetidamente até estourar o máximo exibido ao lado de "Quantidade"; o botão deve travar exatamente nesse número. */

    const maximumQuantityLabel = await page.getByText(/^Máximo \d+$/).textContent();
    const maximumQuantity = Number(maximumQuantityLabel?.match(/\d+/)?.[0] ?? "1");

    for (let clickIndex = 0; clickIndex < maximumQuantity + 2; clickIndex += 1) {
      if (await increaseButton.isDisabled()) break;
      await increaseButton.click();
    }

    await expect(quantityValue).toHaveText(String(maximumQuantity));
    await expect(increaseButton).toBeDisabled();
  });

  test("BUG CONHECIDO — favoritar como visitante falha em silêncio no Detalhe (a Home redireciona, o Detalhe não)", async ({ page }) => {
    await page.goto("/");
    const firstCardLink = await getFirstNftCardLink(page);
    await firstCardLink.click();

    const favoriteButton = page.locator('button[aria-label="Adicionar aos favoritos"]');
    await favoriteButton.click();

    await page.waitForTimeout(500);
    await expect(page).toHaveURL(/\/nfts\//);
    await expect(page.getByRole("alert")).toHaveCount(0);
  });
});
