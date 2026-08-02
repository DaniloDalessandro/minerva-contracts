import { test, expect, Page } from "@playwright/test";

async function goToLinhas(page: Page) {
  await page.goto("/linhas-orcamentarias");
  await expect(page.getByRole("heading", { name: /linhas orçamentárias/i })).toBeVisible({ timeout: 10_000 });
}

async function openModal(page: Page) {
  await goToLinhas(page);
  await page.getByRole("button", { name: /adicionar novo item/i }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
}

test.describe("Linhas Orçamentárias — Página", () => {
  test("exibe título e ícone da página", async ({ page }) => {
    await goToLinhas(page);
    await expect(page.getByRole("heading", { name: /linhas orçamentárias/i })).toBeVisible();
  });

  test("exibe subtítulo da página", async ({ page }) => {
    await goToLinhas(page);
    await expect(page.getByText(/gerenciamento de linhas orçamentárias/i)).toBeVisible();
  });

  test("exibe botão de adicionar", async ({ page }) => {
    await goToLinhas(page);
    await expect(page.getByRole("button", { name: /adicionar novo item/i })).toBeVisible();
  });

  test("não causa overflow horizontal", async ({ page }) => {
    await goToLinhas(page);
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2);
  });
});

test.describe("Linhas Orçamentárias — Modal", () => {
  test("abre o modal ao clicar em adicionar", async ({ page }) => {
    await openModal(page);
    await expect(page.getByRole("heading", { name: /nova linha orçamentária/i })).toBeVisible();
  });

  test("modal exibe seções do formulário", async ({ page }) => {
    await openModal(page);
    await expect(page.getByText("Dados Básicos")).toBeVisible();
    await expect(page.getByText("Centros")).toBeVisible();
    await expect(page.getByText(/informações de contrato/i)).toBeVisible();
    await expect(page.getByText("Fiscais")).toBeVisible();
    await expect(page.getByText("Status")).toBeVisible();
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
    await expect(page.getByRole("button", { name: /criar linha orçamentária/i })).toBeVisible();
  });
});
