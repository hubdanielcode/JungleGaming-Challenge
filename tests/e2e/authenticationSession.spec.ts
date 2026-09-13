import { expect, test } from "@playwright/test";
import { knownTestUsers, loginThroughUserInterface, resetMockedBackend } from "./support/testHelpers";

/* - Cobre o grupo "cadastro/login/expiração/logout/troca de usuário" e o item eliminatório de isolamento entre usuários (seção 11 do enunciado: "exposição de dados entre usuários"). - */

test.describe("Autenticação e sessão", () => {
  test.beforeEach(async ({ page }) => {
    await resetMockedBackend(page);
  });

  test("cadastro com dados válidos cria a conta e autentica automaticamente", async ({ page }) => {
    await page.goto("/register");

    const uniqueSuffix = Date.now().toString(36);

    await page.getByLabel("Nome de usuário").fill(`novo.colecionador.${uniqueSuffix}`);
    await page.getByLabel("E-mail", { exact: true }).fill(`novo.${uniqueSuffix}@kurio.test`);
    await page.getByLabel("Senha", { exact: true }).fill("senhaSegura123");
    await page.getByLabel("Confirmar senha").fill("senhaSegura123");
    await page.getByRole("button", { name: "Criar perfil" }).click();
    await page.waitForURL("/");

    await expect(page.getByRole("button", { name: "Sair" })).toBeVisible();
  });

  test("cadastro com e-mail já existente retorna conflito e mantém o usuário na tela", async ({ page }) => {
    await page.goto("/register");
    await page.getByLabel("Nome de usuário").fill("outra.pessoa");
    await page.getByLabel("E-mail", { exact: true }).fill(knownTestUsers.primary.email);
    await page.getByLabel("Senha", { exact: true }).fill("senhaSegura123");
    await page.getByLabel("Confirmar senha").fill("senhaSegura123");
    await page.getByRole("button", { name: "Criar perfil" }).click();

    await expect(page.getByRole("alert")).toContainText(/já existe uma conta|e-mail já cadastrado/i);
    await expect(page).toHaveURL("/register");
  });

  test("login com senha incorreta mostra erro e não autentica", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("E-mail").fill(knownTestUsers.primary.email);
    await page.getByLabel("Senha").fill("senhaErrada");
    await page.getByRole("button", { name: "Entrar" }).click();

    await expect(page.getByRole("alert")).toContainText(/e-mail ou senha incorretos/i);
    await expect(page).toHaveURL("/login");
  });

  test("login com credenciais válidas autentica e mescla o carrinho de visitante", async ({ page }) => {
    /* - Adiciona um item ao carrinho como visitante antes de logar, para exercitar o merge guest→user. - */

    await page.goto("/");

    await page.locator('button[aria-label^="Adicionar"][aria-label$="ao carrinho"]').first().click();
    await page.waitForURL("/cart");

    const cartItemCountBeforeLogin = await page.locator("tbody tr").count();

    expect(cartItemCountBeforeLogin).toBeGreaterThan(0);

    await loginThroughUserInterface(page);
    await page.goto("/cart");
    await expect(page.locator("tbody tr")).toHaveCount(cartItemCountBeforeLogin);
  });

  test("logout limpa a sessão e o cache privado, voltando para navegação de visitante", async ({ page }) => {
    await loginThroughUserInterface(page);
    await page.getByRole("button", { name: "Sair" }).click();
    await expect(page.getByRole("link", { name: "Entrar" })).toBeVisible();

    /* - Rotas privadas devem redirecionar para /login depois do logout. - */

    await page.goto("/checkout");
    await page.waitForURL("/login");
  });

  test("sessão persiste após refresh da página", async ({ page }) => {
    await loginThroughUserInterface(page);
    await page.reload();
    await expect(page.getByRole("button", { name: "Sair" })).toBeVisible();
  });

  test("sessão expirada/inválida redireciona para login ao tentar acessar rota privada", async ({ page }) => {
    await loginThroughUserInterface(page);

    /* - A checagem de expiração roda dentro do Service Worker do MSW. Para simular uma sessão inválida de forma determinística, sobrescrevemos o token guardado no localStorage com um valor que o servidor mockado não reconhece. - */

    await page.evaluate(() => {
      localStorage.setItem("kurio-session-token", "tok_expirado_simulado");
    });

    await page.goto("/checkout");
    await page.waitForURL("/login");
  });

  test("troca de usuário: dados de um usuário não vazam para o outro (isolamento — item eliminatório)", async ({ page }) => {
    /* - Usuário A favorita um NFT e adiciona um item ao carrinho. - */

    await loginThroughUserInterface(page, knownTestUsers.primary);

    await page.goto("/");
    await page.locator('button[aria-label^="Adicionar"][aria-label$="aos favoritos"]').first().click();
    await page.locator('button[aria-label^="Adicionar"][aria-label$="ao carrinho"]').first().click();
    await page.waitForURL("/cart");
    await expect(page.locator("tbody tr").first()).toBeVisible();
    const userACartItemCount = await page.locator("tbody tr").count();

    expect(userACartItemCount).toBeGreaterThan(0);

    await page.getByRole("button", { name: "Sair" }).click();
    await expect(page.getByRole("link", { name: "Entrar" })).toBeVisible();

    /* - Usuário B entra com uma sessão diferente. O cache privado deve ser invalidado e os dados devem ser carregados pelo identificador do novo usuário. - */

    await loginThroughUserInterface(page, knownTestUsers.secondary);
    await page.goto("/?favorites=true");
    await expect(page.locator('a[aria-label^="Ver detalhes de"]')).toHaveCount(0);
    await page.goto("/cart");
    await expect(page.getByText("Seu carrinho está vazio.")).toBeVisible();
  });
});
