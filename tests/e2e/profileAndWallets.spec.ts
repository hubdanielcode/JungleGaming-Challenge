import { expect, test } from "@playwright/test";
import { knownTestUsers, loginThroughUserInterface, resetMockedBackend } from "./support/testHelpers";

/* - Cobre o fluxo de conta exigido pelo enunciado: edição de perfil, avatar, senha, carteiras e validações. Todas as operações são executadas pela interface para verificar o resultado visível da mutation, enquanto o backend continua sendo atendido pelos handlers do MSW. - */

test.describe("Perfil e carteiras", () => {
  test.beforeEach(async ({ page }) => {
    await resetMockedBackend(page);
  });

  /* - Valida a edição dos dados básicos do perfil e o ciclo completo do avatar: upload, atualização visual e remoção. - */

  test("edita o perfil e atualiza o avatar", async ({ page }) => {
    await loginThroughUserInterface(page);
    await page.goto("/profile");

    await expect(page.getByRole("heading", { name: "Perfil do colecionador" })).toBeVisible();

    const usernameInput = page.getByLabel("Nome de usuário");
    const emailInput = page.getByLabel("E-mail", { exact: true });
    const updatedUsername = "andreza.atualizada";
    const updatedEmail = "andreza.atualizada@kurio.test";

    await usernameInput.fill(updatedUsername);
    await emailInput.fill(updatedEmail);
    await page.getByRole("button", { name: "Salvar", exact: true }).click();

    await expect(page.getByText("Perfil salvo.")).toBeVisible();
    await expect(usernameInput).toHaveValue(updatedUsername);
    await expect(emailInput).toHaveValue(updatedEmail);

    await page.locator('input[type="file"]').setInputFiles({
      name: "avatar.png",
      mimeType: "image/png",
      buffer: Buffer.from("fake-avatar-data"),
    });

    await expect(page.getByText("Avatar atualizado.")).toBeVisible();
    await expect(page.locator('img[alt=""]').first()).toHaveAttribute("src", /^data:image\/png;base64,/);

    await page.getByRole("button", { name: "Remover" }).click();
    await expect(page.getByText("Avatar atualizado.")).toBeVisible();
    await expect(page.locator('img[alt=""]')).toHaveCount(0);
  });

  /* - Valida as regras de senha pela interface, cobrindo senha curta, confirmação divergente e atualização válida. - */

  test("rejeita senha inválida e aceita uma nova senha válida", async ({ page }) => {
    await loginThroughUserInterface(page);
    await page.goto("/profile");

    await page.getByLabel("Senha atual").fill(knownTestUsers.primary.password);
    await page.getByLabel("Nova senha").fill("123");
    await page.getByLabel("Confirmar nova senha").fill("123");
    await page.getByRole("button", { name: "Salvar", exact: true }).click();

    await expect(page.getByText("A nova senha deve ter ao menos 6 caracteres.")).toBeVisible();

    await page.getByLabel("Nova senha").fill("novaSenha123");
    await page.getByLabel("Confirmar nova senha").fill("senhaDiferente");
    await page.getByRole("button", { name: "Salvar", exact: true }).click();

    await expect(page.getByText("As senhas não coincidem.")).toBeVisible();

    await page.getByLabel("Confirmar nova senha").fill("novaSenha123");
    await page.getByRole("button", { name: "Salvar", exact: true }).click();

    await expect(page.getByText("Senha atualizada.")).toBeVisible();
  });

  /* - Valida a criação de uma carteira secundária, incluindo a validação do endereço, e depois confirma que uma carteira existente pode ser editada pela interface. - */

  test("valida o endereço, cadastra e edita uma carteira secundária", async ({ page }) => {
    await loginThroughUserInterface(page);
    await page.goto("/wallets");

    await expect(page.getByRole("heading", { name: "Carteira principal" })).toBeVisible();

    await page.getByRole("button", { name: "Adicionar", exact: true }).first().click();
    await page.getByRole("button", { name: "Salvar carteira" }).click();

    await expect(page.getByText("Informe o endereço da carteira.")).toBeVisible();

    await page.getByLabel("Tipo de carteira").selectOption("secondary");
    await page.getByLabel("Endereço da carteira").fill("0x123");
    await page.getByRole("button", { name: "Salvar carteira" }).click();

    await expect(page.getByText("Endereço de carteira inválido.")).toBeVisible();

    await page.getByLabel("Apelido da carteira").fill("Reserva");
    await page.getByLabel("Endereço da carteira").fill("0x1234567890ABCDEF");
    await page.getByLabel("Rede").selectOption("polygon");
    await page.getByLabel("Provedor da carteira").selectOption("walletconnect");
    await page.getByRole("button", { name: "Salvar carteira" }).click();

    await expect(page.getByText("Reserva")).toBeVisible();

    /* - Reabre a carteira secundária criada anteriormente e verifica a atualização dos dados através da mutation de edição. - */

    await page.getByRole("button", { name: "Editar carteira secundária" }).click();
    await page.getByLabel("Apelido da carteira").fill("Reserva atualizada");
    await page.getByLabel("Rede").selectOption("ethereum");
    await page.getByRole("button", { name: "Atualizar carteira" }).click();

    await expect(page.getByText("Reserva atualizada")).toBeVisible();
  });

  /* - Valida a edição de uma carteira principal que já existe no estado inicial do usuário de teste. - */

  test("edita a carteira principal existente", async ({ page }) => {
    await loginThroughUserInterface(page);
    await page.goto("/wallets");

    await expect(page.getByRole("button", { name: "Editar carteira principal" })).toBeVisible();
    await page.getByRole("button", { name: "Editar carteira principal" }).click();

    await page.getByLabel("Apelido da carteira").fill("Principal atualizada");
    await page.getByLabel("Endereço da carteira").fill("0xABCDEF123456");
    await page.getByRole("button", { name: "Atualizar carteira" }).click();

    await expect(page.getByLabel("Apelido da carteira")).toHaveValue("Principal atualizada");
    await expect(page.getByLabel("Endereço da carteira")).toHaveValue("0xABCDEF123456");
  });

  /* - Garante que a regra de negócio impede o cadastro de mais de uma carteira principal para o mesmo usuário. - */

  test("impede cadastrar uma segunda carteira principal", async ({ page }) => {
    await loginThroughUserInterface(page);
    await page.goto("/wallets");

    await page.getByLabel("Endereço da carteira").fill("0xABCDEF123456");
    await page.getByRole("button", { name: "Salvar carteira" }).click();

    await expect(page.getByText("Já existe uma carteira principal.")).toBeVisible();
  });
});
