import { expect, test } from "@playwright/test";
import { applyScenarioPatch, getFirstNftCardLink, loginThroughUserInterface, resetMockedBackend } from "./support/testHelpers";

/* - Cobre "favoritos com falha e recuperação". A Home aplica atualização otimista via onMutate/onError no useMutation de favoritos (src/routes/index.tsx), então o teste força uma falha transitória de 100% para observar o rollback e depois libera a rede para confirmar que uma nova tentativa funciona. - */

test.describe("Favoritos", () => {
  test.beforeEach(async ({ page }) => {
    await resetMockedBackend(page);
  });

  test("favoritar aplica atualização otimista e confirma após sucesso do servidor", async ({ page }) => {
    await loginThroughUserInterface(page);
    await page.goto("/");

    const favoriteButton = page.locator('button[aria-label^="Adicionar"][aria-label$="aos favoritos"]').first();
    await favoriteButton.click();

    await expect(page.locator('button[aria-label^="Remover"][aria-label$="dos favoritos"]').first()).toBeVisible();

    await page.reload();
    await expect(page.locator('button[aria-label^="Remover"][aria-label$="dos favoritos"]').first()).toBeVisible();
  });

  test("falha de mutation reverte a atualização otimista (rollback) e permite tentar de novo", async ({ page }) => {
    await loginThroughUserInterface(page);
    await page.goto("/");

    const favoriteButton = page.locator('button[aria-label^="Adicionar"][aria-label$="aos favoritos"]').first();

    /* - Força 100% de falha transitória só para a tentativa que deve falhar. */

    await applyScenarioPatch(page.request, { transientFailureRate: 1, latency: "none" });
    await favoriteButton.click();

    /* - onMutate marca como favorito imediatamente (otimista); onError reverte para previousFavoriteNftIds via queryClient.setQueryData. O botão deve voltar ao estado "Adicionar aos favoritos" assim que a mutation falhar. - */

    await expect(page.locator('button[aria-label^="Adicionar"][aria-label$="aos favoritos"]').first()).toBeVisible({ timeout: 5000 });

    /* - Libera a rede e tenta novamente: agora deve confirmar o favorito de verdade. */

    await applyScenarioPatch(page.request, { transientFailureRate: 0 });
    await favoriteButton.click();
    await expect(page.locator('button[aria-label^="Remover"][aria-label$="dos favoritos"]').first()).toBeVisible();
  });

  test("filtro de favoritos na Home mostra apenas os NFTs favoritados", async ({ page }) => {
    await loginThroughUserInterface(page);
    await page.goto("/");

    const firstCardLink = await getFirstNftCardLink(page);
    const favoritedNftName = await firstCardLink.getAttribute("aria-label");

    await page.locator('button[aria-label^="Adicionar"][aria-label$="aos favoritos"]').first().click();
    await expect(page.locator('button[aria-label^="Remover"][aria-label$="dos favoritos"]').first()).toBeVisible();

    await page.goto("/?favorites=true");

    const visibleCardLinks = page.locator('a[aria-label^="Ver detalhes de"]');
    await expect(visibleCardLinks).toHaveCount(1);
    await expect(visibleCardLinks.first()).toHaveAttribute("aria-label", favoritedNftName ?? "");
  });
});
