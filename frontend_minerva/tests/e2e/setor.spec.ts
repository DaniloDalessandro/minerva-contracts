import { test, expect, Page } from "@playwright/test";

async function goToSetor(page: Page) {
  await page.goto("/setor");
  await expect(page.getByRole("heading", { name: /setores/i })).toBeVisible({ timeout: 10_000 });
}

test.describe("Setores — Página", () => {
  test("exibe cabeçalho com título Setores", async ({ page }) => {
    await goToSetor(page);
    await expect(page.getByRole("heading", { name: /setores/i })).toBeVisible();
  });

  test("exibe subtítulo da página", async ({ page }) => {
    await goToSetor(page);
    await expect(page.getByText(/gerenciamento de direções/i)).toBeVisible();
  });

  test("exibe as três abas", async ({ page }) => {
    await goToSetor(page);
    await expect(page.getByRole("tab", { name: /direções/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /gerências/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /coordenações/i })).toBeVisible();
  });

  test("não causa overflow horizontal", async ({ page }) => {
    await goToSetor(page);
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2);
  });
});

test.describe("Setores — Aba Direções", () => {
  test("exibe tabela de direções por padrão", async ({ page }) => {
    await goToSetor(page);
    await expect(page.getByRole("heading", { name: /direções/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /adicionar novo item/i })).toBeVisible();
  });

  test("abre modal Nova Direção", async ({ page }) => {
    await goToSetor(page);
    await page.getByRole("button", { name: /adicionar novo item/i }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByRole("heading", { name: /nova direção/i })).toBeVisible();
  });

  test("modal Nova Direção exibe campo Nome", async ({ page }) => {
    await goToSetor(page);
    await page.getByRole("button", { name: /adicionar novo item/i }).click();
    await expect(page.getByRole("dialog").locator("#name")).toBeVisible();
  });

  test("fecha modal Nova Direção com Cancelar", async ({ page }) => {
    await goToSetor(page);
    await page.getByRole("button", { name: /adicionar novo item/i }).click();
    await page.getByRole("button", { name: /cancelar/i }).click();
    await expect(page.getByRole("dialog")).not.toBeVisible();
  });

  test("modal não causa overflow horizontal", async ({ page }) => {
    await goToSetor(page);
    await page.getByRole("button", { name: /adicionar novo item/i }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2);
  });
});

test.describe("Setores — Aba Gerências", () => {
  test("muda para aba Gerências e exibe tabela", async ({ page }) => {
    await goToSetor(page);
    await page.getByRole("tab", { name: /gerências/i }).click();
    await expect(page.getByRole("heading", { name: /gerências/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /adicionar novo item/i })).toBeVisible();
  });

  test("abre modal Nova Gerência", async ({ page }) => {
    await goToSetor(page);
    await page.getByRole("tab", { name: /gerências/i }).click();
    await page.getByRole("button", { name: /adicionar novo item/i }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByRole("heading", { name: /nova gerência/i })).toBeVisible();
  });

  test("fecha modal Nova Gerência com Cancelar", async ({ page }) => {
    await goToSetor(page);
    await page.getByRole("tab", { name: /gerências/i }).click();
    await page.getByRole("button", { name: /adicionar novo item/i }).click();
    await page.getByRole("button", { name: /cancelar/i }).click();
    await expect(page.getByRole("dialog")).not.toBeVisible();
  });
});

test.describe("Setores — Aba Coordenações", () => {
  test("muda para aba Coordenações e exibe tabela", async ({ page }) => {
    await goToSetor(page);
    await page.getByRole("tab", { name: /coordenações/i }).click();
    await expect(page.getByRole("heading", { name: /coordenações/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /adicionar novo item/i })).toBeVisible();
  });

  test("abre modal Nova Coordenação", async ({ page }) => {
    await goToSetor(page);
    await page.getByRole("tab", { name: /coordenações/i }).click();
    await page.getByRole("button", { name: /adicionar novo item/i }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByRole("heading", { name: /nova coordenação/i })).toBeVisible();
  });

  test("fecha modal Nova Coordenação com Cancelar", async ({ page }) => {
    await goToSetor(page);
    await page.getByRole("tab", { name: /coordenações/i }).click();
    await page.getByRole("button", { name: /adicionar novo item/i }).click();
    await page.getByRole("button", { name: /cancelar/i }).click();
    await expect(page.getByRole("dialog")).not.toBeVisible();
  });
});
