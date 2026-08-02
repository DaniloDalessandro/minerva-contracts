import { Page } from "@playwright/test";

export async function loginAsAdmin(page: Page) {
  await page.goto("/login");
  await page.locator("#email").fill(process.env.TEST_EMAIL || "admin@admin.com");
  await page.locator("#password").fill(process.env.TEST_PASSWORD || "admin123");
  await page.getByRole("button", { name: /entrar na plataforma/i }).click();
  await page.waitForURL("**/dashboard", { timeout: 15_000 });
}
