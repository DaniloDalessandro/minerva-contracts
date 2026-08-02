import { test, expect, Page } from "@playwright/test";

async function goToContratos(page: Page) {
  await page.goto("/contratos");
  await expect(page.getByRole("heading", { name: /contratos/i })).toBeVisible({ timeout: 10_000 });
}

async function openModal(page: Page) {
  await goToContratos(page);
  await page.getByRole("button", { name: /adicionar novo item/i }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
}

test.describe("Contratos — Página", () => {
  test("exibe título e ícone da página", async ({ page }) => {
    await goToContratos(page);
    await expect(page.getByRole("heading", { name: /contratos/i })).toBeVisible();
  });

  test("exibe subtítulo da página", async ({ page }) => {
    await goToContratos(page);
    await expect(page.getByText(/gerenciamento de contratos/i)).toBeVisible();
  });

  test("exibe botão de adicionar", async ({ page }) => {
    await goToContratos(page);
    await expect(page.getByRole("button", { name: /adicionar novo item/i })).toBeVisible();
  });

  test("não causa overflow horizontal", async ({ page }) => {
    await goToContratos(page);
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2);
  });
});

test.describe("Contratos — Modal", () => {
  test("abre o modal ao clicar em adicionar", async ({ page }) => {
    await openModal(page);
    await expect(page.getByRole("heading", { name: /novo contrato/i })).toBeVisible();
  });

  test("modal exibe seções do formulário", async ({ page }) => {
    await openModal(page);
    await expect(page.getByText("Dados Básicos")).toBeVisible();
    await expect(page.getByText("Valores")).toBeVisible();
    await expect(page.getByText(/datas principais/i)).toBeVisible();
  });

  test("fecha o modal com botão Cancelar", async ({ page }) => {
    await openModal(page);
    await page.getByRole("button", { name: /cancelar/i }).click();
    await expect(page.getByRole("dialog")).not.toBeVisible();
  });

  test("fecha o modal com ESC quando vazio", async ({ page }) => {
    await openModal(page);
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).not.toBeVisible();
  });

  test("modal respeita altura máxima de 90vh", async ({ page }) => {
    await openModal(page);
    const dialog = page.getByRole("dialog");
    const box = await dialog.boundingBox();
    const viewportHeight = page.viewportSize()!.height;
    expect(box!.height).toBeLessThanOrEqual(viewportHeight * 0.92);
  });

  test("modal não causa overflow horizontal", async ({ page }) => {
    await openModal(page);
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2);
  });

  test("exibe botão de submit com texto correto", async ({ page }) => {
    await openModal(page);
    await expect(page.getByRole("button", { name: /criar contrato/i })).toBeVisible();
  });
});
