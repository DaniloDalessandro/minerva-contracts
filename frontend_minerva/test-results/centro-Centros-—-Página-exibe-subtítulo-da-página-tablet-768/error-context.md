# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: centro.spec.ts >> Centros — Página >> exibe subtítulo da página
- Location: tests\e2e\centro.spec.ts:14:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText(/gerenciamento de centros gestores/i)
Expected: visible
Error: strict mode violation: getByText(/gerenciamento de centros gestores/i) resolved to 2 elements:
    1) <p class="text-sm text-muted-foreground">Gerenciamento de centros gestores e solicitantes</p> aka getByText('Gerenciamento de centros gestores e solicitantes')
    2) <p class="text-sm text-muted-foreground mt-0.5">Gerenciamento de centros gestores</p> aka getByText('Gerenciamento de centros gestores', { exact: true })

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByText(/gerenciamento de centros gestores/i)

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]: 15%
  - alert [ref=e8]
  - generic [ref=e9]:
    - generic [ref=e10]: 15%
    - generic [ref=e18]:
      - generic [ref=e27]:
        - generic [ref=e28]: Minerva
        - generic [ref=e29]: Gestão de Contratos
      - generic [ref=e31]:
        - generic [ref=e32]: Navegação
        - list [ref=e33]:
          - listitem [ref=e34]:
            - link "Dashboards" [ref=e35] [cursor=pointer]:
              - /url: /dashboard
          - listitem [ref=e39]:
            - link "Usuários" [ref=e40] [cursor=pointer]:
              - /url: /usuarios
          - listitem [ref=e54]:
            - link "Colaboradores" [ref=e55] [cursor=pointer]:
              - /url: /colaboradores
          - listitem [ref=e62]:
            - link "Auxílios" [ref=e63] [cursor=pointer]:
              - /url: /auxilios
          - listitem [ref=e71]:
            - link "Contratos" [ref=e72] [cursor=pointer]:
              - /url: /contratos
          - listitem [ref=e77]:
            - link "Linhas Orçamentárias" [ref=e78] [cursor=pointer]:
              - /url: /linhas-orcamentarias
          - listitem [ref=e82]:
            - link "Orçamentos" [ref=e83] [cursor=pointer]:
              - /url: /orcamento
          - listitem [ref=e88]:
            - link "Setores" [ref=e89] [cursor=pointer]:
              - /url: /setor
          - listitem [ref=e95]:
            - link "Centros" [ref=e96] [cursor=pointer]:
              - /url: /centro
          - listitem [ref=e102]:
            - link "Fale com Gaby" [ref=e103] [cursor=pointer]:
              - /url: /alice
          - listitem [ref=e108]:
            - link "Ajuda" [ref=e109] [cursor=pointer]:
              - /url: /ajuda
      - list [ref=e115]:
        - listitem [ref=e116]:
          - button "Admin Admin admin@admin.com" [ref=e117]:
            - img "Admin" [ref=e119]
            - generic [ref=e120]:
              - generic [ref=e121]: Admin
              - generic [ref=e122]: admin@admin.com
      - button "Toggle Sidebar" [ref=e126]
    - main [ref=e127]:
      - generic [ref=e128]:
        - button "Toggle Sidebar" [ref=e129]
        - navigation "breadcrumb" [ref=e131]:
          - list [ref=e132]:
            - listitem [ref=e133]:
              - link "Home" [ref=e134] [cursor=pointer]:
                - /url: /dashboard
            - listitem [ref=e135]
            - listitem [ref=e138]:
              - link "Centros" [disabled] [ref=e139]
        - button "Notificações" [ref=e141]
      - main [ref=e142]:
        - generic [ref=e143]:
          - generic [ref=e149]:
            - heading "Centros" [level=1] [ref=e150]
            - paragraph [ref=e151]: Gerenciamento de centros gestores e solicitantes
          - generic [ref=e152]:
            - tablist [ref=e153]:
              - tab "Centros Gestores" [selected] [ref=e154]
              - tab "Centros Solicitantes" [ref=e155]
            - tabpanel "Centros Gestores" [ref=e156]:
              - generic [ref=e159]:
                - generic [ref=e161]:
                  - generic [ref=e163]:
                    - heading "Centros Gestores" [level=2] [ref=e164]
                    - paragraph [ref=e165]: Gerenciamento de centros gestores
                  - generic [ref=e166]:
                    - button "Adicionar novo item" [ref=e167]
                    - button "Configurar visibilidade de colunas" [ref=e169]
                - generic [ref=e170]:
                  - table [ref=e173]:
                    - rowgroup [ref=e174]:
                      - row [ref=e175]:
                        - columnheader "Filtrar coluna Nome Nome ↕" [ref=e176]:
                          - generic [ref=e178]:
                            - button "Filtrar coluna Nome" [ref=e180]
                            - generic [ref=e181] [cursor=pointer]:
                              - generic [ref=e182]: Nome
                              - generic [ref=e183]: ↕
                        - columnheader "Filtrar coluna Status Status" [ref=e184]:
                          - generic [ref=e186]:
                            - button "Filtrar coluna Status" [ref=e188]
                            - generic [ref=e189]: Status
                        - columnheader "Criado em ↕" [ref=e191]:
                          - generic [ref=e194] [cursor=pointer]:
                            - generic [ref=e195]: Criado em
                            - generic [ref=e196]: ↕
                        - columnheader "Atualizado em ↕" [ref=e197]:
                          - generic [ref=e200] [cursor=pointer]:
                            - generic [ref=e201]: Atualizado em
                            - generic [ref=e202]: ↕
                        - columnheader "Criado por ↕" [ref=e203]:
                          - generic [ref=e206] [cursor=pointer]:
                            - generic [ref=e207]: Criado por
                            - generic [ref=e208]: ↕
                    - rowgroup [ref=e209]:
                      - row [ref=e210] [cursor=pointer]:
                        - cell "CENTRO GESTOR FINANCEIRO" [ref=e211]
                        - cell "Ativo" [ref=e216]
                        - cell "29/04/2026 23:38" [ref=e221]
                        - cell "29/04/2026 23:38" [ref=e226]
                        - cell "admin@admin.com" [ref=e231]
                      - row [ref=e236] [cursor=pointer]:
                        - cell "CENTRO GESTOR ADMINISTRATIVO" [ref=e237]
                        - cell "Ativo" [ref=e242]
                        - cell "29/04/2026 23:38" [ref=e247]
                        - cell "29/04/2026 23:38" [ref=e252]
                        - cell "admin@admin.com" [ref=e257]
                      - row [ref=e262] [cursor=pointer]:
                        - cell "CENTRO GESTOR DE TECNOLOGIA" [ref=e263]
                        - cell "Ativo" [ref=e268]
                        - cell "29/04/2026 23:38" [ref=e273]
                        - cell "29/04/2026 23:38" [ref=e278]
                        - cell "admin@admin.com" [ref=e283]
                      - row [ref=e288] [cursor=pointer]:
                        - cell "MC2-1777515925" [ref=e289]
                        - cell "Ativo" [ref=e294]
                        - cell "29/04/2026 23:25" [ref=e299]
                        - cell "29/04/2026 23:25" [ref=e304]
                        - cell "admin@admin.com" [ref=e309]
                      - row [ref=e314] [cursor=pointer]:
                        - cell "MC2-1777515880" [ref=e315]
                        - cell "Ativo" [ref=e320]
                        - cell "29/04/2026 23:24" [ref=e325]
                        - cell "29/04/2026 23:24" [ref=e330]
                        - cell "admin@admin.com" [ref=e335]
                      - row [ref=e340] [cursor=pointer]:
                        - cell "MC2-1777515872" [ref=e341]
                        - cell "Ativo" [ref=e346]
                        - cell "29/04/2026 23:24" [ref=e351]
                        - cell "29/04/2026 23:24" [ref=e356]
                        - cell "admin@admin.com" [ref=e361]
                      - row [ref=e366] [cursor=pointer]:
                        - cell "MC2-1777515837" [ref=e367]
                        - cell "Ativo" [ref=e372]
                        - cell "29/04/2026 23:23" [ref=e377]
                        - cell "29/04/2026 23:23" [ref=e382]
                        - cell "admin@admin.com" [ref=e387]
                      - row [ref=e392] [cursor=pointer]:
                        - cell "MC2-1777515750" [ref=e393]
                        - cell "Ativo" [ref=e398]
                        - cell "29/04/2026 23:22" [ref=e403]
                        - cell "29/04/2026 23:22" [ref=e408]
                        - cell "admin@admin.com" [ref=e413]
                      - row [ref=e418] [cursor=pointer]:
                        - cell "MC2-1777515266" [ref=e419]
                        - cell "Ativo" [ref=e424]
                        - cell "29/04/2026 23:14" [ref=e429]
                        - cell "29/04/2026 23:14" [ref=e434]
                        - cell "admin@admin.com" [ref=e439]
                      - row [ref=e444] [cursor=pointer]:
                        - cell "MC-1777515266-UPD" [ref=e445]
                        - cell "Ativo" [ref=e450]
                        - cell "29/04/2026 23:14" [ref=e455]
                        - cell "29/04/2026 23:14" [ref=e460]
                        - cell "admin@admin.com" [ref=e465]
                  - generic [ref=e470]:
                    - paragraph [ref=e471]: Página 1 de 2 · 12 registros
                    - generic [ref=e472]:
                      - button "Primeira página" [disabled]
                      - button "Página anterior" [disabled]
                      - button "Próxima página" [ref=e473]
                      - button "Última página" [ref=e474]
    - button "Abrir Gaby — assistente IA" [ref=e475]
```

# Test source

```ts
  1  | import { test, expect, Page } from "@playwright/test";
  2  | 
  3  | async function goToCentro(page: Page) {
  4  |   await page.goto("/centro");
  5  |   await expect(page.getByRole("heading", { name: "Centros", exact: true })).toBeVisible({ timeout: 10_000 });
  6  | }
  7  | 
  8  | test.describe("Centros — Página", () => {
  9  |   test("exibe cabeçalho com título Centros", async ({ page }) => {
  10 |     await goToCentro(page);
  11 |     await expect(page.getByRole("heading", { name: "Centros", exact: true })).toBeVisible();
  12 |   });
  13 | 
  14 |   test("exibe subtítulo da página", async ({ page }) => {
  15 |     await goToCentro(page);
> 16 |     await expect(page.getByText(/gerenciamento de centros gestores/i)).toBeVisible();
     |                                                                        ^ Error: expect(locator).toBeVisible() failed
  17 |   });
  18 | 
  19 |   test("exibe as duas abas", async ({ page }) => {
  20 |     await goToCentro(page);
  21 |     await expect(page.getByRole("tab", { name: /centros gestores/i })).toBeVisible();
  22 |     await expect(page.getByRole("tab", { name: /centros solicitantes/i })).toBeVisible();
  23 |   });
  24 | 
  25 |   test("não causa overflow horizontal", async ({ page }) => {
  26 |     await goToCentro(page);
  27 |     const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  28 |     const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
  29 |     expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2);
  30 |   });
  31 | });
  32 | 
  33 | test.describe("Centros — Aba Centros Gestores", () => {
  34 |   test("exibe tabela de centros gestores por padrão", async ({ page }) => {
  35 |     await goToCentro(page);
  36 |     await expect(page.getByRole("heading", { name: /centros gestores/i })).toBeVisible();
  37 |     await expect(page.getByRole("button", { name: /adicionar novo item/i })).toBeVisible();
  38 |   });
  39 | 
  40 |   test("abre modal Novo Centro Gestor", async ({ page }) => {
  41 |     await goToCentro(page);
  42 |     await page.getByRole("button", { name: /adicionar novo item/i }).click();
  43 |     await expect(page.getByRole("dialog")).toBeVisible();
  44 |     await expect(page.getByRole("heading", { name: /novo centro gestor/i })).toBeVisible();
  45 |   });
  46 | 
  47 |   test("modal Novo Centro Gestor exibe campo Nome", async ({ page }) => {
  48 |     await goToCentro(page);
  49 |     await page.getByRole("button", { name: /adicionar novo item/i }).click();
  50 |     await expect(page.getByRole("dialog").locator("#name")).toBeVisible();
  51 |   });
  52 | 
  53 |   test("fecha modal com Cancelar", async ({ page }) => {
  54 |     await goToCentro(page);
  55 |     await page.getByRole("button", { name: /adicionar novo item/i }).click();
  56 |     await page.getByRole("button", { name: /cancelar/i }).click();
  57 |     await expect(page.getByRole("dialog")).not.toBeVisible();
  58 |   });
  59 | 
  60 |   test("modal não causa overflow horizontal", async ({ page }) => {
  61 |     await goToCentro(page);
  62 |     await page.getByRole("button", { name: /adicionar novo item/i }).click();
  63 |     await expect(page.getByRole("dialog")).toBeVisible();
  64 |     const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  65 |     const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
  66 |     expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2);
  67 |   });
  68 | });
  69 | 
  70 | test.describe("Centros — Aba Centros Solicitantes", () => {
  71 |   test("muda para aba Centros Solicitantes", async ({ page }) => {
  72 |     await goToCentro(page);
  73 |     await page.getByRole("tab", { name: /centros solicitantes/i }).click();
  74 |     await expect(page.getByRole("heading", { name: /centros solicitantes/i })).toBeVisible();
  75 |     await expect(page.getByRole("button", { name: /adicionar novo item/i })).toBeVisible();
  76 |   });
  77 | 
  78 |   test("abre modal Novo Centro Solicitante", async ({ page }) => {
  79 |     await goToCentro(page);
  80 |     await page.getByRole("tab", { name: /centros solicitantes/i }).click();
  81 |     await page.getByRole("button", { name: /adicionar novo item/i }).click();
  82 |     await expect(page.getByRole("dialog")).toBeVisible();
  83 |     await expect(page.getByRole("heading", { name: /novo centro solicitante/i })).toBeVisible();
  84 |   });
  85 | 
  86 |   test("fecha modal Novo Centro Solicitante com Cancelar", async ({ page }) => {
  87 |     await goToCentro(page);
  88 |     await page.getByRole("tab", { name: /centros solicitantes/i }).click();
  89 |     await page.getByRole("button", { name: /adicionar novo item/i }).click();
  90 |     await page.getByRole("button", { name: /cancelar/i }).click();
  91 |     await expect(page.getByRole("dialog")).not.toBeVisible();
  92 |   });
  93 | });
  94 | 
```