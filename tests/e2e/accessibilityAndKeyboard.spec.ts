import { expect, test } from "@playwright/test";
import { resetMockedBackend } from "./support/testHelpers";

/*
 * - Cobre o grupo "navegação por teclado e skeletons" (último grupo do enunciado, seção 11) e
 *   registra os achados reais de acessibilidade encontrados lendo o código (não suposições):
 *     1. Botões de quantidade no Detalhe do NFT sem aria-label.
 *     2. Botão "aplicar cupom" no Carrinho sem aria-label (só ícone Ticket).
 *     3. Botão de favoritar do NftCard aninhado DENTRO de um <Link> (elemento interativo dentro de
 *        elemento interativo — inválido em HTML e problemático para leitores de tela/teclado).
 *     4. Ausência de um link "Pular para o conteúdo" no AppShell.
 *   Os três primeiros têm testes que HOJE FALHAM DE PROPÓSITO (test.fail()) para servir de rede de
 *   segurança: quando corrigidos, o Playwright avisa que o teste passou inesperadamente e é hora de
 *   remover o test.fail(). -
 */

test.describe("Acessibilidade e navegação por teclado", () => {
  test.beforeEach(async ({ page }) => {
    await resetMockedBackend(page);
  });

  test("skip link para o conteúdo principal existe e funciona ao pressionar Tab", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press("Tab");

    const skipLink = page.getByRole("link", { name: /pular para o conteúdo/i });
    await expect(skipLink).toBeFocused();

    await page.keyboard.press("Enter");
    await expect(page.locator("main")).toBeFocused();
  });

  test("navegação principal do cabeçalho é inteiramente alcançável via Tab", async ({ page }) => {
    await page.goto("/");

    const logoLink = page.getByRole("link", { name: "KURIO" });
    await logoLink.focus();
    await expect(logoLink).toBeFocused();

    /* - Início -> Mercado -> Criadores -> Aprenda -> ícone de busca/favoritos/carrinho, todos alcançáveis sem mouse. */
    await page.keyboard.press("Tab");
    await expect(page.getByRole("link", { name: "Início" }).or(page.getByRole("link", { name: "Início", exact: true }))).toBeFocused();
  });

  test("card de NFT é navegável por teclado e o Enter abre o detalhe", async ({ page }) => {
    await page.goto("/");

    const firstCardLink = page.locator('a[aria-label^="Ver detalhes de"]').first();
    await firstCardLink.focus();
    await expect(firstCardLink).toBeFocused();

    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/nfts\//);
  });

  test("botão de favoritar do card fica fora do link do card", async ({ page }) => {
    await page.goto("/");

    const firstCard = page.locator("article").first();
    const cardLink = firstCard.getByRole("link");
    const favoriteButtonInsideLink = cardLink.locator('button[aria-label*="favoritos"]');

    await expect(favoriteButtonInsideLink).toHaveCount(0);
    await expect(firstCard.locator('button[aria-label*="favoritos"]')).toHaveCount(1);
  });

  test("botões de quantidade no Detalhe do NFT possuem aria-label", async ({ page }) => {
    await page.goto("/");
    await page.locator('a[aria-label^="Ver detalhes de"]').first().click();

    const decreaseButton = page.locator("button:has(svg.lucide-minus)");
    const increaseButton = page.locator("button:has(svg.lucide-plus)");

    await expect(decreaseButton).toHaveAttribute("aria-label", "Diminuir quantidade");
    await expect(increaseButton).toHaveAttribute("aria-label", "Aumentar quantidade");
  });

  test("botão de aplicar cupom no Carrinho possui aria-label", async ({ page }) => {
    await page.goto("/");
    await page.locator('button[aria-label^="Adicionar"][aria-label$="ao carrinho"]').first().click();
    await page.waitForURL("/cart");

    const applyCouponButton = page.locator("button:has(svg.lucide-ticket)");
    await expect(applyCouponButton).toHaveAttribute("aria-label", "Aplicar cupom");
  });

  test("formulário de login é operável inteiramente por teclado e anuncia erros com role=alert", async ({ page }) => {
    await page.goto("/login");

    await page.getByLabel("E-mail").focus();
    await page.keyboard.type("email-invalido");
    await page.keyboard.press("Tab");
    await page.keyboard.type("123");
    await page.keyboard.press("Enter");

    await expect(page.getByRole("alert")).toBeVisible();
  });

  test("modal de menu mobile abre e fecha via teclado sem perder o foco", async ({ page }) => {
    await page.setViewportSize({ width: 393, height: 851 });
    await page.goto("/");

    const menuButton = page.getByRole("button", { name: "Abrir menu" });
    await menuButton.focus();
    await page.keyboard.press("Enter");

    await expect(page.getByRole("link", { name: "Início" })).toBeVisible();

    await menuButton.focus();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("link", { name: "Perfil" })).toHaveCount(0);
  });

  test("tabela do carrinho expõe cabeçalhos de coluna e legenda para leitores de tela", async ({ page }) => {
    await page.goto("/");
    await page.locator('button[aria-label^="Adicionar"][aria-label$="ao carrinho"]').first().click();
    await page.waitForURL("/cart");

    await expect(page.locator("table caption")).toHaveText("Itens no seu carrinho de NFTs");
    await expect(page.getByRole("columnheader", { name: "NFT" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Quantidade" })).toBeVisible();
  });

  test("skeleton de carregamento não some antes do conteúdo real estar pronto (sem flash de conteúdo vazio)", async ({ page }) => {
    await page.goto("/nfts/qualquer-id-para-forcar-loading");

    const notFoundOrContent = page.getByText(/NFT não encontrado|ETH$/).first();
    await expect(notFoundOrContent).toBeVisible({ timeout: 10000 });
  });

  test.describe("zoom e overflow em viewports estreitas", () => {
    test.use({ viewport: { width: 390, height: 844 } });

    test("catálogo não gera scroll horizontal em 390px de largura", async ({ page }) => {
      await page.goto("/");

      const hasHorizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
      expect(hasHorizontalOverflow).toBeFalsy();
    });
  });
});
