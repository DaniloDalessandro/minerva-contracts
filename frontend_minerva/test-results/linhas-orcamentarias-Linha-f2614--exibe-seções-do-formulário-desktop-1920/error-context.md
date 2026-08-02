# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: linhas-orcamentarias.spec.ts >> Linhas Orçamentárias — Modal >> modal exibe seções do formulário
- Location: tests\e2e\linhas-orcamentarias.spec.ts:44:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('Centros')
Expected: visible
Error: strict mode violation: getByText('Centros') resolved to 2 elements:
    1) <span class="font-medium">Centros</span> aka locator('a').filter({ hasText: 'Centros' })
    2) <h3 class="text-[15px] font-semibold text-foreground border-b border-primary/25 pb-1.5 flex items-center gap-2">…</h3> aka getByRole('heading', { name: 'Centros' })

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByText('Centros')

```

# Page snapshot

```yaml
- generic:
  - alert
  - generic:
    - generic:
      - generic:
        - generic:
          - generic:
            - generic:
              - generic:
                - generic:
                  - generic: Minerva
                  - generic: Gestão de Contratos
          - generic:
            - generic:
              - generic: Navegação
              - list:
                - listitem:
                  - link:
                    - /url: /dashboard
                    - generic: Dashboards
                - listitem:
                  - link:
                    - /url: /usuarios
                    - generic: Usuários
                - listitem:
                  - link:
                    - /url: /colaboradores
                    - generic: Colaboradores
                - listitem:
                  - link:
                    - /url: /auxilios
                    - generic: Auxílios
                - listitem:
                  - link:
                    - /url: /contratos
                    - generic: Contratos
                - listitem:
                  - link:
                    - /url: /linhas-orcamentarias
                    - generic: Linhas Orçamentárias
                - listitem:
                  - link:
                    - /url: /orcamento
                    - generic: Orçamentos
                - listitem:
                  - link:
                    - /url: /setor
                    - generic: Setores
                - listitem:
                  - link:
                    - /url: /centro
                    - generic: Centros
                - listitem:
                  - link:
                    - /url: /alice
                    - generic: Fale com Gaby
                - listitem:
                  - link:
                    - /url: /ajuda
                    - generic: Ajuda
          - generic:
            - list:
              - listitem:
                - button:
                  - generic:
                    - generic: Admin
                    - generic: admin@admin.com
          - button
    - main:
      - generic:
        - button:
          - generic: Toggle Sidebar
        - navigation:
          - list:
            - listitem:
              - link:
                - /url: /dashboard
                - text: Home
            - listitem
            - listitem:
              - link [disabled]: Linhas Orçamentárias
        - generic:
          - button
      - main:
        - generic:
          - generic:
            - generic:
              - generic:
                - generic:
                  - generic:
                    - generic:
                      - heading [level=2]: Linhas Orçamentárias
                      - paragraph: Gerenciamento de linhas orçamentárias
                  - generic:
                    - button
                    - button [disabled]
                    - button
              - generic:
                - generic:
                  - generic:
                    - table:
                      - rowgroup:
                        - row:
                          - columnheader:
                            - generic:
                              - generic:
                                - generic:
                                  - button
                                - generic:
                                  - generic: Orçamento
                                  - generic: ↕
                          - columnheader:
                            - generic:
                              - generic:
                                - generic:
                                  - button
                                - generic:
                                  - generic: Categoria
                                  - generic: ↕
                          - columnheader:
                            - generic: Descrição
                          - columnheader:
                            - generic:
                              - generic:
                                - generic:
                                  - generic: Valor Orçado
                                  - generic: ↕
                          - columnheader:
                            - generic:
                              - generic:
                                - generic:
                                  - button
                                - generic:
                                  - generic: Status
                                  - generic: ↕
                      - rowgroup:
                        - row:
                          - cell:
                            - generic: "-"
                          - cell:
                            - generic: OPEX
                          - cell:
                            - generic: Servi??os de auditoria cont??bil externa
                          - cell:
                            - generic: R$ 50.000,00
                          - cell:
                            - generic: Ativo
                        - row:
                          - cell:
                            - generic: "-"
                          - cell:
                            - generic: CAPEX
                          - cell:
                            - generic: Reforma e adequa????o de instala????es f??sicas
                          - cell:
                            - generic: R$ 150.000,00
                          - cell:
                            - generic: Ativo
                        - row:
                          - cell:
                            - generic: "-"
                          - cell:
                            - generic: OPEX
                          - cell:
                            - generic: Manuten????o e suporte de infraestrutura de rede
                          - cell:
                            - generic: R$ 180.000,00
                          - cell:
                            - generic: Ativo
                        - row:
                          - cell:
                            - generic: "-"
                          - cell:
                            - generic: CAPEX
                          - cell:
                            - generic: Desenvolvimento de sistema de gest??o integrada
                          - cell:
                            - generic: R$ 200.000,00
                          - cell:
                            - generic: Ativo
                        - row:
                          - cell:
                            - generic: "-"
                          - cell:
                            - generic: CAPEX
                          - cell:
                            - generic: Renova????o do parque de servidores e storage
                          - cell:
                            - generic: R$ 400.000,00
                          - cell:
                            - generic: Ativo
                        - row:
                          - cell:
                            - generic: "-"
                          - cell:
                            - generic: OPEX
                          - cell:
                            - generic: Serviços de auditoria contábil externa
                          - cell:
                            - generic: R$ 80.000,00
                          - cell:
                            - generic: Ativo
                        - row:
                          - cell:
                            - generic: "-"
                          - cell:
                            - generic: CAPEX
                          - cell:
                            - generic: Reforma e adequação de instalações físicas
                          - cell:
                            - generic: R$ 150.000,00
                          - cell:
                            - generic: Ativo
                        - row:
                          - cell:
                            - generic: "-"
                          - cell:
                            - generic: OPEX
                          - cell:
                            - generic: Manutenção e suporte de infraestrutura de rede
                          - cell:
                            - generic: R$ 180.000,00
                          - cell:
                            - generic: Ativo
                        - row:
                          - cell:
                            - generic: "-"
                          - cell:
                            - generic: CAPEX
                          - cell:
                            - generic: Desenvolvimento de sistema de gestão integrada
                          - cell:
                            - generic: R$ 200.000,00
                          - cell:
                            - generic: Ativo
                        - row:
                          - cell:
                            - generic: "-"
                          - cell:
                            - generic: CAPEX
                          - cell:
                            - generic: Renovação do parque de servidores e storage
                          - cell:
                            - generic: R$ 400.000,00
                          - cell:
                            - generic: Ativo
                - generic:
                  - paragraph: Página 1 de 2 · 11 registros
                  - generic:
                    - button [disabled]
                    - button [disabled]
                    - button
                    - button
    - button
  - dialog [ref=e2]:
    - generic [ref=e3]:
      - heading "Nova Linha Orçamentária" [level=2] [ref=e5]
      - generic [ref=e7]:
        - generic [ref=e8]:
          - heading "Dados Básicos" [level=3] [ref=e9]
          - generic [ref=e11]:
            - generic [ref=e12]:
              - generic [ref=e13]:
                - text: Orçamento
                - generic [ref=e14]: "*"
              - combobox "Orçamento *" [ref=e15]:
                - generic: Selecione um orçamento
              - combobox [ref=e16]
              - generic [ref=e17]: Erro ao carregar dados. Verifique sua conexão.
            - generic [ref=e18]:
              - generic [ref=e19]: Categoria
              - combobox "Categoria" [active] [ref=e20]:
                - generic: OPEX
              - combobox [ref=e21]
            - generic [ref=e23]:
              - generic [ref=e24]:
                - text: Tipo de Despesa
                - generic [ref=e25]: "*"
              - combobox "Tipo de Despesa *" [ref=e26]:
                - generic: Base Principal
              - combobox [ref=e27]
            - generic [ref=e29]:
              - generic [ref=e30]: Classificação Orçamentária
              - combobox "Classificação Orçamentária" [ref=e31]:
                - generic: Novo
              - combobox [ref=e32]
            - generic [ref=e34]:
              - generic [ref=e35]:
                - text: Descrição Resumida
                - generic [ref=e36]: "*"
              - textbox "Descrição Resumida *" [ref=e37]:
                - /placeholder: Descrição resumida da linha orçamentária
            - generic [ref=e39]:
              - generic [ref=e40]:
                - text: Objeto
                - generic [ref=e41]: "*"
              - textbox "Objeto *" [ref=e42]:
                - /placeholder: Objeto da linha orçamentária
        - generic [ref=e44]:
          - heading "Centros" [level=3] [ref=e45]
          - generic [ref=e47]:
            - generic [ref=e48]:
              - generic [ref=e49]:
                - text: Centro Gestor
                - generic [ref=e50]: "*"
              - combobox "Centro Gestor *" [ref=e51]:
                - generic: Selecione um centro gestor
              - combobox [ref=e52]
            - generic [ref=e54]:
              - generic [ref=e55]:
                - text: Centro Solicitante
                - generic [ref=e56]: "*"
              - combobox "Centro Solicitante *" [ref=e57]:
                - generic: Selecione um centro solicitante
              - combobox [ref=e58]
        - generic [ref=e60]:
          - heading "Informações de Contrato" [level=3] [ref=e61]
          - generic [ref=e63]:
            - generic [ref=e64]:
              - generic [ref=e65]: Tipo de Contrato
              - combobox "Tipo de Contrato" [ref=e66]:
                - generic: Serviço
              - combobox [ref=e67]
            - generic [ref=e69]:
              - generic [ref=e70]:
                - text: Tipo de Aquisição
                - generic [ref=e71]: "*"
              - combobox "Tipo de Aquisição *" [ref=e72]:
                - generic: Licitação
              - combobox [ref=e73]
            - generic [ref=e75]:
              - generic [ref=e76]:
                - text: Valor Orçado
                - generic [ref=e77]: "*"
              - textbox "Valor Orçado *" [ref=e78]:
                - /placeholder: 0,00
        - generic [ref=e80]:
          - heading "Fiscais" [level=3] [ref=e81]
          - generic [ref=e83]:
            - generic [ref=e84]:
              - generic [ref=e85]: Fiscal Principal
              - combobox "Fiscal Principal" [ref=e86]:
                - generic: Selecione o fiscal principal
              - combobox [ref=e87]
            - generic [ref=e89]:
              - generic [ref=e90]: Fiscal Substituto
              - combobox "Fiscal Substituto" [ref=e91]:
                - generic: Selecione o fiscal substituto
              - combobox [ref=e92]
        - generic [ref=e94]:
          - heading "Status" [level=3] [ref=e95]
          - generic [ref=e97]:
            - generic [ref=e98]:
              - generic [ref=e99]: Status do Processo
              - combobox "Status do Processo" [ref=e100]:
                - generic: Selecione um status
              - combobox [ref=e101]
            - generic [ref=e103]:
              - generic [ref=e104]: Status do Contrato
              - combobox "Status do Contrato" [ref=e105]:
                - generic: Selecione um status
              - combobox [ref=e106]
        - generic [ref=e108]:
          - heading "Observações" [level=3] [ref=e109]
          - generic [ref=e111]:
            - generic [ref=e112]: Observações
            - textbox "Observações" [ref=e113]:
              - /placeholder: Observações adicionais sobre a linha orçamentária...
      - generic [ref=e115]:
        - button "Cancelar" [ref=e116]
        - button "Criar Linha Orçamentária" [ref=e117]
    - button "Close" [ref=e118]
```

# Test source

```ts
  1  | import { test, expect, Page } from "@playwright/test";
  2  | 
  3  | async function goToLinhas(page: Page) {
  4  |   await page.goto("/linhas-orcamentarias");
  5  |   await expect(page.getByRole("heading", { name: /linhas orçamentárias/i })).toBeVisible({ timeout: 10_000 });
  6  | }
  7  | 
  8  | async function openModal(page: Page) {
  9  |   await goToLinhas(page);
  10 |   await page.getByRole("button", { name: /adicionar novo item/i }).click();
  11 |   await expect(page.getByRole("dialog")).toBeVisible();
  12 | }
  13 | 
  14 | test.describe("Linhas Orçamentárias — Página", () => {
  15 |   test("exibe título e ícone da página", async ({ page }) => {
  16 |     await goToLinhas(page);
  17 |     await expect(page.getByRole("heading", { name: /linhas orçamentárias/i })).toBeVisible();
  18 |   });
  19 | 
  20 |   test("exibe subtítulo da página", async ({ page }) => {
  21 |     await goToLinhas(page);
  22 |     await expect(page.getByText(/gerenciamento de linhas orçamentárias/i)).toBeVisible();
  23 |   });
  24 | 
  25 |   test("exibe botão de adicionar", async ({ page }) => {
  26 |     await goToLinhas(page);
  27 |     await expect(page.getByRole("button", { name: /adicionar novo item/i })).toBeVisible();
  28 |   });
  29 | 
  30 |   test("não causa overflow horizontal", async ({ page }) => {
  31 |     await goToLinhas(page);
  32 |     const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  33 |     const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
  34 |     expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2);
  35 |   });
  36 | });
  37 | 
  38 | test.describe("Linhas Orçamentárias — Modal", () => {
  39 |   test("abre o modal ao clicar em adicionar", async ({ page }) => {
  40 |     await openModal(page);
  41 |     await expect(page.getByRole("heading", { name: /nova linha orçamentária/i })).toBeVisible();
  42 |   });
  43 | 
  44 |   test("modal exibe seções do formulário", async ({ page }) => {
  45 |     await openModal(page);
  46 |     await expect(page.getByText("Dados Básicos")).toBeVisible();
> 47 |     await expect(page.getByText("Centros")).toBeVisible();
     |                                             ^ Error: expect(locator).toBeVisible() failed
  48 |     await expect(page.getByText(/informações de contrato/i)).toBeVisible();
  49 |     await expect(page.getByText("Fiscais")).toBeVisible();
  50 |     await expect(page.getByText("Status")).toBeVisible();
  51 |   });
  52 | 
  53 |   test("fecha o modal com botão Cancelar", async ({ page }) => {
  54 |     await openModal(page);
  55 |     await page.getByRole("button", { name: /cancelar/i }).click();
  56 |     await expect(page.getByRole("dialog")).not.toBeVisible();
  57 |   });
  58 | 
  59 |   test("fecha o modal com ESC quando vazio", async ({ page }) => {
  60 |     await openModal(page);
  61 |     await page.keyboard.press("Escape");
  62 |     await expect(page.getByRole("dialog")).not.toBeVisible();
  63 |   });
  64 | 
  65 |   test("modal respeita altura máxima de 90vh", async ({ page }) => {
  66 |     await openModal(page);
  67 |     const dialog = page.getByRole("dialog");
  68 |     const box = await dialog.boundingBox();
  69 |     const viewportHeight = page.viewportSize()!.height;
  70 |     expect(box!.height).toBeLessThanOrEqual(viewportHeight * 0.92);
  71 |   });
  72 | 
  73 |   test("modal não causa overflow horizontal", async ({ page }) => {
  74 |     await openModal(page);
  75 |     const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  76 |     const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
  77 |     expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2);
  78 |   });
  79 | 
  80 |   test("exibe botão de submit com texto correto", async ({ page }) => {
  81 |     await openModal(page);
  82 |     await expect(page.getByRole("button", { name: /criar linha orçamentária/i })).toBeVisible();
  83 |   });
  84 | });
  85 | 
```