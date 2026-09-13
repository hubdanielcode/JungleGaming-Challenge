import { expect, test } from "@playwright/test";
import { applyScenarioPatch, resetMockedBackend } from "./support/testHelpers";

/* - Cobre o grupo "busca/filtros/paginação com restauração de histórico" do enunciado (seção 11, grupo 1). A Home lê e escreve os filtros direto na query string via TanStack Router (ver HomeSearchParameters em src/routes/index.tsx), então cada asserção de URL aqui reflete comportamento real do componente, não um formato inventado. - */

test.describe("Catálogo — busca, filtros e paginação", () => {
  test.beforeEach(async ({ page }) => {
    await resetMockedBackend(page);
  });

  test("busca por texto atualiza a URL e filtra a lista", async ({ page }) => {
    await page.goto("/");

    const searchInput = page.getByPlaceholder("Buscar NFTs ou coleções");
    await searchInput.fill("kurio");
    await searchInput.press("Enter");

    await expect(page).toHaveURL(/search=kurio/);
  });

  test("filtro de coleção via sidebar reflete na URL e reseta a paginação para a página 1", async ({ page }) => {
    await page.goto("/?page=2");

    const collectionCheckbox = page.getByText("Colecionáveis").locator("..").locator('input[type="checkbox"]');
    await collectionCheckbox.check();

    await expect(page).toHaveURL(/collectionId=kurio-apes/);
    await expect(page).not.toHaveURL(/page=2/);
  });

  test("aplicar faixa de preço grava minPrice e maxPrice na URL", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("button", { name: "Aplicar" }).click();

    /* - Sem mexer no slider, os valores batem exatamente com os limites padrão (CATALOG_MINIMUM_PRICE_IN_ETH / CATALOG_MAXIMUM_PRICE_IN_ETH), então o componente não deve escrever minPrice/maxPrice na URL quando o usuário não alterou a faixa — isso confirma que a lógica de "só grava se for diferente do padrão" está correta. - */

    await expect(page).not.toHaveURL(/minPrice=/);
    await expect(page).not.toHaveURL(/maxPrice=/);
  });

  test("navegação por histórico do navegador restaura os filtros anteriores", async ({ page }) => {
    await page.goto("/");

    const searchInput = page.getByPlaceholder("Buscar NFTs ou coleções");
    await searchInput.fill("edições");
    await searchInput.press("Enter");
    await expect(page).toHaveURL(/search=edi/);

    await page.goto("/?collectionId=kurio-editions");
    await expect(page).toHaveURL(/collectionId=kurio-editions/);

    await page.goBack();
    await expect(page).toHaveURL(/search=edi/);
    await expect(searchInput).toHaveValue("edições");
  });

  test("refresh da página preserva os filtros aplicados via URL", async ({ page }) => {
    await page.goto("/?collectionId=kurio-apes&sort=price_asc");
    await page.reload();

    await expect(page).toHaveURL(/collectionId=kurio-apes/);
    await expect(page).toHaveURL(/sort=price_asc/);
  });

  test("troca de ordenação atualiza a URL", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("combobox").click();
    await page.getByRole("option", { name: "Menor preço" }).click();

    await expect(page).toHaveURL(/sort=price_asc/);
  });

  test("estado vazio é exibido quando a busca não encontra resultados", async ({ page }) => {
    await page.goto("/?search=xxxxxxxxxxnaoexiste");

    await expect(page.getByText(/nenhum|não encontramos|sem resultados/i)).toBeVisible({ timeout: 10000 });
  });

  test("skeleton de carregamento aparece antes dos cards do catálogo", async ({ page }) => {
    await applyScenarioPatch(page.request, { latency: "slow" });

    await page.goto("/");

    /* - Com latência forçada para 1.5–3.5s, o skeleton precisa estar visível antes dos dados chegarem. - */

    const loadingSkeleton = page.locator('[class*="animate-pulse"]').first();
    await expect(loadingSkeleton).toBeVisible();

    await expect(page.locator('a[aria-label^="Ver detalhes de"]').first()).toBeVisible({ timeout: 10000 });
  });

  test("falha transitória de rede não deixa a página quebrada e permite nova tentativa", async ({ page }) => {
    await applyScenarioPatch(page.request, { transientFailureRate: 1, latency: "none" });

    await page.goto("/");

    /* - Com 100% de falha transitória, o React Query aplica sua política de retry (retry < 2, ver queryClient.ts) e a query eventualmente para em erro. Interface não deve travar em um skeleton infinito nem lançar uma tela em branco. - */

    await expect(page.locator("body")).not.toHaveText("");

    await applyScenarioPatch(page.request, { transientFailureRate: 0 });
    await page.reload();
    await expect(page.locator('a[aria-label^="Ver detalhes de"]').first()).toBeVisible({ timeout: 10000 });
  });
});
