import { test, expect, Page } from "@playwright/test";

async function goToOrcamento(page: Page) {
  await page.goto("/orcamento");
  await expect(page.getByRole("heading", { name: /orçamentos/i })).toBeVisible({ timeout: 10_000 });
}

async function openModal(page: Page) {
  await goToOrcamento(page);
  await page.getByRole("button", { name: /adicionar novo item/i }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
}

test.describe("Orçamentos — Página", () => {
  test("exibe título e ícone da página", async ({ page }) => {
    await goToOrcamento(page);
    await expect(page.getByRole("heading", { name: /orçamentos/i })).toBeVisible();
  });

  test("exibe subtítulo da página", async ({ page }) => {
    await goToOrcamento(page);
    await expect(page.getByText(/gerenciamento de orçamentos/i)).toBeVisible();
  });

  test("exibe botão de adicionar", async ({ page }) => {
    await goToOrcamento(page);
    await expect(page.getByRole("button", { name: /adicionar novo item/i })).toBeVisible();
  });

  test("não causa overflow horizontal", async ({ page }) => {
    await goToOrcamento(page);
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2);
  });
});

test.describe("Orçamentos — Modal", () => {
  test("abre o modal ao clicar em adicionar", async ({ page }) => {
    await openModal(page);
    await expect(page.getByRole("heading", { name: /novo orçamento/i })).toBeVisible();
  });

  test("modal exibe campos essenciais", async ({ page }) => {
    await openModal(page);
    await expect(page.getByRole("dialog").locator("#year")).toBeVisible();
    await expect(page.getByRole("dialog").locator("#total_amount")).toBeVisible();
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
    await expect(page.getByRole("button", { name: /criar orçamento/i })).toBeVisible();
  });
});
