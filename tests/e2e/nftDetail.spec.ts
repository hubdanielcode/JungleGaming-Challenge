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

    await simulateNftUpdate(page, { nftId, soldOut: true });
    await page.goto(detailHref!);

    await expect(page.getByRole("button", { name: "Esgotado" })).toBeDisabled();
  });

  test("botões de quantidade respeitam o mínimo de 1 e o limite máximo por pedido", async ({ page }) => {
    await page.goto("/");
    const firstCardLink = await getFirstNftCardLink(page);
    await firstCardLink.click();

    /* - Os botões de quantidade (Minus/Plus do lucide-react) não têm aria-label — este é um dos  achados de acessibilidade documentados no ARCHITECTURE.md. Enquanto o bug não é corrigido, localizamos pelo ícone SVG renderizado (classe "lucide-minus"/"lucide-plus"), que é a única  forma estável de alcançar esses botões hoje. O valor da quantidade também não tem um seletor  próprio (nenhuma classe ou aria-label): é localizado pelo span logo depois do botão "-". - */

    const decreaseButton = page.locator("button:has(svg.lucide-minus)");
    const increaseButton = page.locator("button:has(svg.lucide-plus)");
    const quantityValue = page.locator("button:has(svg.lucide-minus) + span");

    await expect(quantityValue).toHaveText("1");
    await expect(decreaseButton).toBeDisabled();

    await increaseButton.click();
    await expect(quantityValue).toHaveText("2");
    await expect(decreaseButton).toBeEnabled();

    /* - Não há rótulo de "quantidade máxima" na interface hoje (outro achado de UX a documentar), então descobrimos o limite clicando em "+" até o botão travar sozinho, com um teto de segurança para não entrar em loop infinito caso o botão nunca desabilite. */

    const safetyClickCap = 50;
    let observedMaximumQuantity = 2;

    for (let clickIndex = 0; clickIndex < safetyClickCap; clickIndex += 1) {
      if (await increaseButton.isDisabled()) {
        break;
      }

      await increaseButton.click();
      observedMaximumQuantity += 1;
    }

    await expect(increaseButton).toBeDisabled();
    await expect(quantityValue).toHaveText(String(observedMaximumQuantity));

    /* - O "+" precisa ter parado antes do teto de segurança — se não parou, o limite máximo por edição não está sendo respeitado (regressão do requisito "limite de quantidade" do enunciado). */

    expect(observedMaximumQuantity).toBeLessThan(2 + safetyClickCap);
  });

  test("favoritar como visitante redireciona para login de forma consistente com a Home", async ({ page }) => {
    await page.goto("/");
    const firstCardLink = await getFirstNftCardLink(page);
    await firstCardLink.click();

    const favoriteButton = page.locator('button[aria-label="Adicionar aos favoritos"]');
    await favoriteButton.click();

    await expect(page).toHaveURL(/\/login/);
  });
});
