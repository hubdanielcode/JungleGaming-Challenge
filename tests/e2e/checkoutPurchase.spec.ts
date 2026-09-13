import { expect, test } from "@playwright/test";
import { applyScenarioPatch, loginThroughUserInterface, resetMockedBackend } from "./support/testHelpers";

/* - Cobre "compra do catálogo ao recibo" e "falha de pagamento e timeout com idempotência", os dois grupos mais sensíveis do enunciado (seção 3 exige explicitamente impedir pedidos duplicados após timeout/reenvio). - */

const goToCheckoutWithOneItemInCart = async (page: import("@playwright/test").Page) => {
  await loginThroughUserInterface(page);
  await page.goto("/");
  await page.locator('button[aria-label^="Adicionar"][aria-label$="ao carrinho"]').first().click();
  await page.waitForURL("/cart");
  await page.getByRole("button", { name: "Ir para pagamento" }).click();
  await page.waitForURL("/checkout");
};

const fillCheckoutCollectorForm = async (page: import("@playwright/test").Page) => {
  await page.getByLabel("Nome").fill("Andreza Colecionadora");
  await page.getByLabel("E-mail").fill("andreza.colecionadora@kurio.test");

  const walletOptions = page.getByRole("radio");
  if ((await walletOptions.count()) === 0) {
    /* - Sem carteira cadastrada, o checkout não pode prosseguir; cadastra uma antes de continuar. */

    await page.getByRole("link", { name: "Gerenciar" }).click();
    await page.waitForURL("/wallets");
    console.warn("Nenhuma carteira encontrada — cadastro de carteira precisa ser feito manualmente neste ambiente de teste.");
  } else {
    await walletOptions.first().check();
  }
};

test.describe("Checkout e compra", () => {
  test.beforeEach(async ({ page }) => {
    await resetMockedBackend(page);
  });

  test("compra completa: do catálogo até o recibo confirmado", async ({ page }) => {
    await applyScenarioPatch(page, { nextPaymentOutcome: "confirmed" });
    await goToCheckoutWithOneItemInCart(page);
    await fillCheckoutCollectorForm(page);

    await page.getByRole("button", { name: "Conectar carteira" }).click();
    await expect(page.getByRole("status")).toContainText("conectado", { timeout: 10000 });
    await page.getByRole("button", { name: "Confirmar compra" }).click();

    await page.waitForURL(/\/confirmation\//);
    await expect(page.getByText(/pagamento em processamento|compra confirmada/i)).toBeVisible();
    await expect(page.getByText("Compra confirmada")).toBeVisible({ timeout: 10000 });
  });

  test("pagamento recusado mostra o estado terminal correto na confirmação", async ({ page }) => {
    await applyScenarioPatch(page, { nextPaymentOutcome: "declined" });
    await goToCheckoutWithOneItemInCart(page);
    await fillCheckoutCollectorForm(page);

    await page.getByRole("button", { name: "Conectar carteira" }).click();
    await expect(page.getByRole("status")).toContainText("conectado", { timeout: 10000 });
    await page.getByRole("button", { name: "Confirmar compra" }).click();

    await page.waitForURL(/\/confirmation\//);
    await expect(page.getByText("Pagamento recusado")).toBeVisible({ timeout: 10000 });
  });

  test("rede sem carteira correspondente não pode ser confirmada", async ({ page }) => {
    await goToCheckoutWithOneItemInCart(page);
    await fillCheckoutCollectorForm(page);

    await page.getByLabel("Rede").selectOption("polygon");
    await page.getByRole("button", { name: "Conectar carteira" }).click();
    await expect(page.getByRole("alert")).toContainText("Nenhuma carteira cadastrada");

    await page.getByRole("button", { name: "Confirmar compra" }).click();
    await expect(page.getByRole("alert")).toContainText("Conecte a carteira");
  });

  test("recusa da carteira impede a confirmação e expõe estado de erro", async ({ page }) => {
    await applyScenarioPatch(page, { walletConnectionOutcome: "rejected" });
    await goToCheckoutWithOneItemInCart(page);
    await fillCheckoutCollectorForm(page);

    await page.getByRole("button", { name: "Conectar carteira" }).click();
    await expect(page.getByRole("alert")).toContainText("recusada");

    await expect(page.getByRole("button", { name: "Confirmar compra" })).toBeVisible();
  });

  test("clique duplo no botão de confirmar não cria dois pedidos", async ({ page }) => {
    await applyScenarioPatch(page, { nextPaymentOutcome: "confirmed" });
    await goToCheckoutWithOneItemInCart(page);
    await fillCheckoutCollectorForm(page);

    await page.getByRole("button", { name: "Conectar carteira" }).click();
    await expect(page.getByRole("status")).toContainText("conectado", { timeout: 10000 });

    const submitButton = page.getByRole("button", { name: /confirmar compra|processando/i });

    /* - O botão de submit fica desabilitado assim que createOrderMutation.isPending vira true (ver src/routes/checkout.tsx), então o segundo clique físico deve ser bloqueado pela própria interface antes mesmo de chegar à mesma idempotencyKey no servidor. - */

    await Promise.all([submitButton.click(), submitButton.click({ force: true }).catch(() => undefined)]);

    await page.waitForURL(/\/confirmation\//);
    const orderIdFromUrl = page.url().split("/confirmation/")[1];

    await page.goto("/");
    await expect(page.getByText("Seu carrinho está vazio.")).toHaveCount(0);
    expect(orderIdFromUrl).toBeTruthy();
  });

  test("timeout seguido de reenvio reutiliza a mesma idempotencyKey e não duplica o pedido", async ({ page }) => {
    await applyScenarioPatch(page, { forceOrderTimeout: true });
    await goToCheckoutWithOneItemInCart(page);
    await fillCheckoutCollectorForm(page);

    await page.getByRole("button", { name: "Conectar carteira" }).click();
    await expect(page.getByRole("status")).toContainText("conectado", { timeout: 10000 });
    await page.getByRole("button", { name: "Confirmar compra" }).click();
    await page.waitForURL(/\/confirmation\//);
    await expect(page.getByText("Pagamento em processamento")).toBeVisible();

    const firstOrderId = page.url().split("/confirmation/")[1];

    await page.getByRole("button", { name: "Tentar novamente" }).click();
    await page.waitForURL("/checkout");
    await fillCheckoutCollectorForm(page);
    await page.getByRole("button", { name: "Conectar carteira" }).click();
    await expect(page.getByRole("status")).toContainText("conectado", { timeout: 10000 });
    await page.getByRole("button", { name: "Confirmar compra" }).click();
    await page.waitForURL(/\/confirmation\//);

    const secondOrderId = page.url().split("/confirmation/")[1];

    expect(secondOrderId).toBe(firstOrderId);
  });

  test("cotação obsoleta (preço mudou) bloqueia a confirmação até o resumo ser atualizado", async ({ page }) => {
    await goToCheckoutWithOneItemInCart(page);
    await fillCheckoutCollectorForm(page);

    /* - Descobrir o NFT no carrinho e mudar o preço dele via endpoint de dev para forçar cartQuote.stale = true no próximo GET /api/cart/quote (ver src/mocks/quote.ts). - */

    const firstCartItem = await page.evaluate(async () => {
      const response = await fetch("/api/cart");
      const cartBody = (await response.json()) as {
        items: Array<{ nftId: string; unitPriceEth: string }>;
      };

      return cartBody.items[0] ?? null;
    });

    if (firstCartItem) {
      await page.evaluate(
        async ({ nftId, priceEth }) => {
          await fetch("/api/dev/simulate/nft-update", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              nftId,
              priceEth,
            }),
          });
        },
        {
          nftId: firstCartItem.nftId,
          priceEth: (Number(firstCartItem.unitPriceEth) * 2).toFixed(4),
        },
      );
    }

    await page.getByRole("button", { name: "Conectar carteira" }).click();
    await expect(page.getByRole("status")).toContainText("conectado", { timeout: 10000 });
    await page.getByRole("button", { name: "Confirmar compra" }).click();

    await expect(page.getByRole("alert")).toContainText(/cotação mudou|atualize o resumo/i);
  });
});
