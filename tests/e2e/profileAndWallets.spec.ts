import { expect, test } from "@playwright/test";
import { knownTestUsers, loginThroughUserInterface, resetMockedBackend } from "./support/testHelpers";

/*
 * - Cobre o fluxo de conta exigido pelo enunciado: edição de perfil, avatar, senha, carteiras e validações. Todas as operações são executadas pela interface para verificar o resultado visível da mutation, enquanto o backend continua sendo atendido pelos handlers do MSW. -
 */

test.describe("Perfil e carteiras", () => {
  test.beforeEach(async ({ page }) => {
    await resetMockedBackend(page);
  });

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

  test("valida o endereço e cadastra uma carteira secundária", async ({ page }) => {
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
  });

  test("impede cadastrar uma segunda carteira principal", async ({ page }) => {
    await loginThroughUserInterface(page);
    await page.goto("/wallets");

    await page.getByLabel("Endereço da carteira").fill("0xABCDEF123456");
    await page.getByRole("button", { name: "Salvar carteira" }).click();

    await expect(page.getByText("Já existe uma carteira principal.")).toBeVisible();
  });
});
