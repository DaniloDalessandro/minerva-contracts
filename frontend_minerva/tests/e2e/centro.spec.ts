import { test, expect, Page } from "@playwright/test";

async function goToCentro(page: Page) {
  await page.goto("/centro");
  await expect(page.getByRole("heading", { name: "Centros", exact: true })).toBeVisible({ timeout: 10_000 });
}

test.describe("Centros — Página", () => {
  test("exibe cabeçalho com título Centros", async ({ page }) => {
    await goToCentro(page);
    await expect(page.getByRole("heading", { name: "Centros", exact: true })).toBeVisible();
  });

  test("exibe subtítulo da página", async ({ page }) => {
    await goToCentro(page);
    await expect(page.getByText(/gerenciamento de centros gestores/i)).toBeVisible();
  });

  test("exibe as duas abas", async ({ page }) => {
    await goToCentro(page);
    await expect(page.getByRole("tab", { name: /centros gestores/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /centros solicitantes/i })).toBeVisible();
  });

  test("não causa overflow horizontal", async ({ page }) => {
    await goToCentro(page);
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2);
  });
});

test.describe("Centros — Aba Centros Gestores", () => {
  test("exibe tabela de centros gestores por padrão", async ({ page }) => {
    await goToCentro(page);
    await expect(page.getByRole("heading", { name: /centros gestores/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /adicionar novo item/i })).toBeVisible();
  });

  test("abre modal Novo Centro Gestor", async ({ page }) => {
    await goToCentro(page);
    await page.getByRole("button", { name: /adicionar novo item/i }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByRole("heading", { name: /novo centro gestor/i })).toBeVisible();
  });

  test("modal Novo Centro Gestor exibe campo Nome", async ({ page }) => {
    await goToCentro(page);
    await page.getByRole("button", { name: /adicionar novo item/i }).click();
    await expect(page.getByRole("dialog").locator("#name")).toBeVisible();
  });

  test("fecha modal com Cancelar", async ({ page }) => {
    await goToCentro(page);
    await page.getByRole("button", { name: /adicionar novo item/i }).click();
    await page.getByRole("button", { name: /cancelar/i }).click();
    await expect(page.getByRole("dialog")).not.toBeVisible();
  });

  test("modal não causa overflow horizontal", async ({ page }) => {
    await goToCentro(page);
    await page.getByRole("button", { name: /adicionar novo item/i }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2);
  });
});

test.describe("Centros — Aba Centros Solicitantes", () => {
  test("muda para aba Centros Solicitantes", async ({ page }) => {
    await goToCentro(page);
    await page.getByRole("tab", { name: /centros solicitantes/i }).click();
    await expect(page.getByRole("heading", { name: /centros solicitantes/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /adicionar novo item/i })).toBeVisible();
  });

  test("abre modal Novo Centro Solicitante", async ({ page }) => {
    await goToCentro(page);
    await page.getByRole("tab", { name: /centros solicitantes/i }).click();
    await page.getByRole("button", { name: /adicionar novo item/i }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByRole("heading", { name: /novo centro solicitante/i })).toBeVisible();
  });

  test("fecha modal Novo Centro Solicitante com Cancelar", async ({ page }) => {
    await goToCentro(page);
    await page.getByRole("tab", { name: /centros solicitantes/i }).click();
    await page.getByRole("button", { name: /adicionar novo item/i }).click();
    await page.getByRole("button", { name: /cancelar/i }).click();
    await expect(page.getByRole("dialog")).not.toBeVisible();
  });
});
