import { chromium } from "@playwright/test";
import path from "path";
import fs from "fs";

export const STORAGE_STATE = path.join(__dirname, ".auth-state.json");

export default async function globalSetup() {
  // Reutiliza sessão existente se o arquivo de estado já existir
  if (fs.existsSync(STORAGE_STATE)) {
    return;
  }

  const browser = await chromium.launch();
  const page = await browser.newPage();

  const baseURL = process.env.BASE_URL || "http://localhost:4002";

  await page.goto(`${baseURL}/login`);
  await page.locator("#email").fill(process.env.TEST_EMAIL || "admin@admin.com");
  await page.locator("#password").fill(process.env.TEST_PASSWORD || "admin123");
  await page.getByRole("button", { name: /entrar na plataforma/i }).click();
  await page.waitForURL("**/dashboard", { timeout: 20_000 });

  await page.context().storageState({ path: STORAGE_STATE });
  await browser.close();
}
