import { expect, test } from "@playwright/test";

const shouldRun = process.env.E2E_RUN === "true";

const uniqueEmail = () => `prof-${Date.now()}@example.com`;

// Opcional: execute com E2E_RUN=true e um backend configurado.
test.describe("Cadastro e login", () => {
  test.skip(!shouldRun, "Defina E2E_RUN=true para ativar o teste de fluxo completo.");

  test("registro, login e carregamento do dashboard", async ({ page }) => {
    const email = uniqueEmail();
    const password = "SenhaSegura123";

    await page.goto("/register");
    await page.getByLabel("Organização").fill("Escola Municipal Esperança");
    await page.getByLabel("E-mail").fill(email);
    await page.getByLabel("Senha").fill(password);
    await page.getByRole("button", { name: "Registrar" }).click();
    await expect(page.getByText("Conta criada", { exact: false })).toBeVisible();

    await page.goto("/login");
    await page.getByLabel("E-mail").fill(email);
    await page.getByLabel("Senha").fill(password);
    await page.getByRole("button", { name: "Entrar" }).click();

    await expect(page).toHaveURL(/dashboard/);
    await expect(page.getByRole("heading", { name: /painel/i })).toBeVisible();
  });
});
