# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: colaboradores-modal.spec.ts >> Modal Novo Colaborador >> habilita Coordenação após selecionar Direção e Gerência
- Location: tests\e2e\colaboradores-modal.spec.ts:149:7

# Error details

```
TimeoutError: locator.click: Timeout 10000ms exceeded.
Call log:
  - waiting for getByRole('option').first()
    - locator resolved to <div cmdk-item="" role="option" id="radix-«r1b»" data-value="DBG" aria-selected="true" data-selected="true" aria-disabled="false" data-disabled="false" class="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none data-[disabled=true]:pointer-events-none data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground data-[disabled=true]:opacity-50">…</div>
  - attempting click action
    2 × waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <input value="" id="email" type="email" data-slot="input" aria-required="true" aria-invalid="false" placeholder="email@exemplo.com" class="file:text-foreground placeholder:text-muted-foreground/70 selection:bg-primary/20 selection:text-foreground dark:bg-input/20 border-input flex w-full min-w-0 border bg-background px-3 py-1 text-base shadow-xs transition-[border-color,box-shadow] duration-200 outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disa…/> from <div role="dialog" tabindex="-1" id="radix-«ro»" data-state="open" data-slot="dialog-content" aria-labelledby="radix-«rp»" aria-describedby="radix-«rq»" class="bg-card text-card-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 w-full translate-x-[-50%] translate-y-[-50%] rounded-2xl border border-border/60 shadow-[rgba(0,0,0,0…>…</div> subtree intercepts pointer events
    - retrying click action
    - waiting 20ms
    2 × waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <input value="" id="email" type="email" data-slot="input" aria-required="true" aria-invalid="false" placeholder="email@exemplo.com" class="file:text-foreground placeholder:text-muted-foreground/70 selection:bg-primary/20 selection:text-foreground dark:bg-input/20 border-input flex w-full min-w-0 border bg-background px-3 py-1 text-base shadow-xs transition-[border-color,box-shadow] duration-200 outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disa…/> from <div role="dialog" tabindex="-1" id="radix-«ro»" data-state="open" data-slot="dialog-content" aria-labelledby="radix-«rp»" aria-describedby="radix-«rq»" class="bg-card text-card-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 w-full translate-x-[-50%] translate-y-[-50%] rounded-2xl border border-border/60 shadow-[rgba(0,0,0,0…>…</div> subtree intercepts pointer events
    - retrying click action
      - waiting 100ms
    18 × waiting for element to be visible, enabled and stable
       - element is visible, enabled and stable
       - scrolling into view if needed
       - done scrolling
       - <input value="" id="email" type="email" data-slot="input" aria-required="true" aria-invalid="false" placeholder="email@exemplo.com" class="file:text-foreground placeholder:text-muted-foreground/70 selection:bg-primary/20 selection:text-foreground dark:bg-input/20 border-input flex w-full min-w-0 border bg-background px-3 py-1 text-base shadow-xs transition-[border-color,box-shadow] duration-200 outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disa…/> from <div role="dialog" tabindex="-1" id="radix-«ro»" data-state="open" data-slot="dialog-content" aria-labelledby="radix-«rp»" aria-describedby="radix-«rq»" class="bg-card text-card-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 w-full translate-x-[-50%] translate-y-[-50%] rounded-2xl border border-border/60 shadow-[rgba(0,0,0,0…>…</div> subtree intercepts pointer events
     - retrying click action
       - waiting 500ms

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
              - link [disabled]: Colaboradores
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
                      - heading [level=2]: Colaboradores
                      - paragraph: Gerencie os colaboradores cadastrados no sistema
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
                                  - generic: Nome
                                  - generic: ↕
                          - columnheader:
                            - generic:
                              - generic:
                                - generic:
                                  - button
                                - generic:
                                  - generic: CPF
                                  - generic: ↕
                          - columnheader:
                            - generic:
                              - generic:
                                - generic:
                                  - button
                                - generic: Telefone
                          - columnheader:
                            - generic:
                              - generic:
                                - generic:
                                  - button
                                - generic: Gerência
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
                            - generic: Func-1777515750
                          - cell:
                            - generic: "1777515750"
                          - cell:
                            - generic: "-"
                          - cell:
                            - generic: "-"
                          - cell:
                            - generic: Ativo
                        - row:
                          - cell:
                            - generic: Func2-1777515750
                          - cell:
                            - generic: "1777515751"
                          - cell:
                            - generic: "-"
                          - cell:
                            - generic: "-"
                          - cell:
                            - generic: Ativo
                        - row:
                          - cell:
                            - generic: Func2-1777515837
                          - cell:
                            - generic: "1777515838"
                          - cell:
                            - generic: "-"
                          - cell:
                            - generic: "-"
                          - cell:
                            - generic: Ativo
                        - row:
                          - cell:
                            - generic: Func2-1777515872
                          - cell:
                            - generic: "1777515873"
                          - cell:
                            - generic: "-"
                          - cell:
                            - generic: "-"
                          - cell:
                            - generic: Ativo
                        - row:
                          - cell:
                            - generic: Func2-1777515880
                          - cell:
                            - generic: "1777515881"
                          - cell:
                            - generic: "-"
                          - cell:
                            - generic: "-"
                          - cell:
                            - generic: Ativo
                        - row:
                          - cell:
                            - generic: Func2-1777515925
                          - cell:
                            - generic: "1777515926"
                          - cell:
                            - generic: "-"
                          - cell:
                            - generic: "-"
                          - cell:
                            - generic: Ativo
                        - row:
                          - cell:
                            - generic: Carlos Eduardo Lima
                          - cell:
                            - generic: "22233344455"
                          - cell:
                            - generic: "-"
                          - cell:
                            - generic: GER??NCIA DE INFRAESTRUTURA
                          - cell:
                            - generic: Ativo
                        - row:
                          - cell:
                            - generic: Ana Beatriz Carvalho
                          - cell:
                            - generic: "11122233344"
                          - cell:
                            - generic: "-"
                          - cell:
                            - generic: GER??NCIA DE SISTEMAS
                          - cell:
                            - generic: Ativo
                        - row:
                          - cell:
                            - generic: Lucas Pereira Gomes
                          - cell:
                            - generic: "00011122233"
                          - cell:
                            - generic: "-"
                          - cell:
                            - generic: GER??NCIA DE SISTEMAS
                          - cell:
                            - generic: Ativo
                        - row:
                          - cell:
                            - generic: Daniela Souza Martins
                          - cell:
                            - generic: "33344455566"
                          - cell:
                            - generic: "-"
                          - cell:
                            - generic: GER??NCIA DE SEGURAN??A
                          - cell:
                            - generic: Ativo
                        - row:
                          - cell:
                            - generic: Eduardo Ferreira Neto
                          - cell:
                            - generic: "44455566677"
                          - cell:
                            - generic: "-"
                          - cell:
                            - generic: GER??NCIA DE RECURSOS HUMANOS
                          - cell:
                            - generic: Ativo
                        - row:
                          - cell:
                            - generic: Gabriel Santos Rocha
                          - cell:
                            - generic: "66677788899"
                          - cell:
                            - generic: "-"
                          - cell:
                            - generic: GER??NCIA DE FACILITIES
                          - cell:
                            - generic: Ativo
                        - row:
                          - cell:
                            - generic: Fernanda Costa Alves
                          - cell:
                            - generic: "55566677788"
                          - cell:
                            - generic: "-"
                          - cell:
                            - generic: GER??NCIA DE CONTRATOS ADM
                          - cell:
                            - generic: Ativo
                        - row:
                          - cell:
                            - generic: Mariana Torres Campos
                          - cell:
                            - generic: "11133355577"
                          - cell:
                            - generic: "-"
                          - cell:
                            - generic: GER??NCIA DE CONTRATOS ADM
                          - cell:
                            - generic: Ativo
                        - row:
                          - cell:
                            - generic: Helena Oliveira Pinto
                          - cell:
                            - generic: "77788899900"
                          - cell:
                            - generic: "-"
                          - cell:
                            - generic: GER??NCIA OR??AMENT??RIA
                          - cell:
                            - generic: Ativo
                - generic:
                  - paragraph: Página 1 de 2 · 19 registros
                  - generic:
                    - button [disabled]
                    - button [disabled]
                    - button
                    - button
    - button
  - dialog [ref=e2]:
    - generic [ref=e3]:
      - heading "Novo Colaborador" [level=2] [ref=e4]
      - separator [ref=e5]
    - generic [ref=e6]:
      - generic [ref=e8]:
        - generic [ref=e9]:
          - heading "Dados Pessoais" [level=3] [ref=e10]
          - generic [ref=e12]:
            - generic [ref=e13]:
              - generic [ref=e14]:
                - text: Nome Completo
                - generic [ref=e15]: "*"
              - textbox "Nome Completo *" [invalid] [ref=e17]:
                - /placeholder: Nome completo do colaborador
              - generic [ref=e18]: Nome completo é obrigatório
            - generic [ref=e19]:
              - generic [ref=e20]:
                - generic [ref=e21]:
                  - text: Email
                  - generic [ref=e22]: "*"
                - textbox "Email *" [ref=e24]:
                  - /placeholder: email@exemplo.com
              - generic [ref=e25]:
                - generic [ref=e26]:
                  - text: CPF
                  - generic [ref=e27]: "*"
                - textbox "CPF *" [ref=e29]:
                  - /placeholder: 000.000.000-00
              - generic [ref=e30]:
                - generic [ref=e31]: Telefone
                - textbox "Telefone" [ref=e33]:
                  - /placeholder: (00) 00000-0000
        - generic [ref=e34]:
          - heading "Dados Funcionais" [level=3] [ref=e35]
          - generic [ref=e37]:
            - generic [ref=e38]:
              - generic [ref=e39]:
                - text: Matrícula
                - generic [ref=e40]: "*"
              - textbox "Matrícula *" [ref=e42]:
                - /placeholder: Matrícula do colaborador
            - generic [ref=e43]:
              - generic [ref=e44]:
                - text: Cargo
                - generic [ref=e45]: "*"
              - textbox "Cargo *" [ref=e47]:
                - /placeholder: Cargo do colaborador
        - generic [ref=e48]:
          - heading "Hierarquia Organizacional" [level=3] [ref=e49]
          - generic [ref=e51]:
            - generic [ref=e52]:
              - generic [ref=e53]: Direção
              - combobox "Direção" [expanded] [active] [ref=e55]:
                - generic [ref=e56]: Direção...
            - generic [ref=e57]:
              - generic [ref=e58]: Gerência
              - generic [ref=e60]:
                - combobox "Gerência" [disabled]:
                  - generic: Selec. direção
            - generic [ref=e61]:
              - generic [ref=e62]: Coordenação
              - generic [ref=e64]:
                - combobox "Coordenação" [disabled]:
                  - generic: Selec. gerência
      - generic [ref=e65]:
        - button "Cancelar" [ref=e66]
        - button "Criar Colaborador" [ref=e67]
    - button "Close" [ref=e68]
  - generic:
    - dialog:
      - generic:
        - generic:
          - combobox [expanded]
        - listbox "Suggestions":
          - generic:
            - group:
              - option "DBG" [selected]
              - option "DIR-1777515266-UPD"
              - option "DIR-1777515750-UPD"
              - option "DIR-1777515837-UPD"
              - option "DIR-1777515872-UPD"
              - option "DIR-1777515880-UPD"
              - option "DIR-1777515925-UPD"
              - option "DIR2-1777515266"
              - option "DIR2-1777515750"
              - option "DIR2-1777515837"
```

# Test source

```ts
  63  | 
  64  |   // 3. Fechamento com ESC sem alterações
  65  |   test("fecha o modal com ESC quando não há alterações", async ({ page }) => {
  66  |     await openModal(page);
  67  |     await page.keyboard.press("Escape");
  68  |     await expect(page.getByRole("dialog")).not.toBeVisible();
  69  |   });
  70  | 
  71  |   // 4. Confirmação ao fechar com dados preenchidos
  72  |   test("exibe confirmação ao tentar fechar com dados não salvos", async ({ page }) => {
  73  |     await openModal(page);
  74  |     await page.getByLabel(/nome completo/i).fill("Nome Teste");
  75  |     await page.keyboard.press("Escape");
  76  |     await expect(page.getByRole("alertdialog")).toBeVisible();
  77  |     await expect(page.getByText(/descartar alterações/i)).toBeVisible();
  78  |   });
  79  | 
  80  |   // 5. Descarta alterações ao confirmar
  81  |   test("fecha o modal ao confirmar descarte das alterações", async ({ page }) => {
  82  |     await openModal(page);
  83  |     await page.getByLabel(/nome completo/i).fill("Nome Teste");
  84  |     await page.keyboard.press("Escape");
  85  |     await page.getByRole("button", { name: /descartar/i }).click();
  86  |     await expect(page.getByRole("dialog")).not.toBeVisible();
  87  |   });
  88  | 
  89  |   // 6. Validações obrigatórias
  90  |   test("exibe erros de validação ao submeter formulário vazio", async ({ page }) => {
  91  |     await openModal(page);
  92  |     await page.getByRole("button", { name: /criar colaborador/i }).click();
  93  |     await expect(page.getByText(/nome completo é obrigatório/i)).toBeVisible();
  94  |     await expect(page.getByText(/email é obrigatório/i)).toBeVisible();
  95  |     await expect(page.getByText(/cpf é obrigatório/i)).toBeVisible();
  96  |     await expect(page.getByText(/matrícula é obrigatória/i)).toBeVisible();
  97  |     await expect(page.getByText(/cargo é obrigatório/i)).toBeVisible();
  98  |   });
  99  | 
  100 |   // 7. Validação de CPF inválido
  101 |   test("exibe erro para CPF inválido", async ({ page }) => {
  102 |     await openModal(page);
  103 |     const cpfInput = sel.cpf(page);
  104 |     await cpfInput.fill("111.111.111-11");
  105 |     await cpfInput.blur();
  106 |     await expect(page.getByText(/cpf inválido/i)).toBeVisible();
  107 |   });
  108 | 
  109 |   // 8. Máscara de CPF
  110 |   test("aplica máscara no campo CPF", async ({ page }) => {
  111 |     await openModal(page);
  112 |     const cpfInput = sel.cpf(page);
  113 |     await cpfInput.fill("52998224725");
  114 |     await expect(cpfInput).toHaveValue("529.982.247-25");
  115 |   });
  116 | 
  117 |   // 9. Máscara de telefone
  118 |   test("aplica máscara no campo Telefone", async ({ page }) => {
  119 |     await openModal(page);
  120 |     const phoneInput = sel.phone(page);
  121 |     await phoneInput.fill("11912345678");
  122 |     await expect(phoneInput).toHaveValue("(11) 91234-5678");
  123 |   });
  124 | 
  125 |   // 10. Validação de email inválido
  126 |   test("exibe erro para email inválido", async ({ page }) => {
  127 |     await openModal(page);
  128 |     const emailInput = page.getByLabel(/email/i);
  129 |     await emailInput.fill("email-invalido");
  130 |     await emailInput.blur();
  131 |     await expect(page.getByText(/email deve ter um formato válido/i)).toBeVisible();
  132 |   });
  133 | 
  134 |   // 11. Hierarquia: Gerência desabilitada sem Direção
  135 |   test("campo Gerência fica desabilitado até selecionar Direção", async ({ page }) => {
  136 |     await openModal(page);
  137 |     const managementTrigger = page.locator('[id="management"]');
  138 |     await expect(managementTrigger).toBeDisabled();
  139 |   });
  140 | 
  141 |   // 12. Hierarquia: Coordenação desabilitada sem Gerência
  142 |   test("campo Coordenação fica desabilitado até selecionar Gerência", async ({ page }) => {
  143 |     await openModal(page);
  144 |     const coordinationTrigger = page.locator('[id="coordination"]');
  145 |     await expect(coordinationTrigger).toBeDisabled();
  146 |   });
  147 | 
  148 |   // 13. Hierarquia: Coordenação habilita após seleção de Gerência
  149 |   test("habilita Coordenação após selecionar Direção e Gerência", async ({ page }) => {
  150 |     await openModal(page);
  151 | 
  152 |     // Seleciona a primeira Direção disponível
  153 |     const directionTrigger = page.locator('[id="direction"]');
  154 |     await directionTrigger.click();
  155 |     const firstDirection = page.getByRole("option").first();
  156 |     const directionCount = await page.getByRole("option").count();
  157 | 
  158 |     if (directionCount === 0) {
  159 |       test.skip();
  160 |       return;
  161 |     }
  162 | 
> 163 |     await firstDirection.click();
      |                          ^ TimeoutError: locator.click: Timeout 10000ms exceeded.
  164 | 
  165 |     // Aguarda opções de Gerência
  166 |     const managementTrigger = page.locator('[id="management"]');
  167 |     await expect(managementTrigger).not.toBeDisabled({ timeout: 5_000 });
  168 |     await managementTrigger.click();
  169 | 
  170 |     const managementCount = await page.getByRole("option").count();
  171 |     if (managementCount === 0) {
  172 |       test.skip();
  173 |       return;
  174 |     }
  175 | 
  176 |     await page.getByRole("option").first().click();
  177 | 
  178 |     const coordinationTrigger = page.locator('[id="coordination"]');
  179 |     await expect(coordinationTrigger).not.toBeDisabled({ timeout: 5_000 });
  180 |   });
  181 | 
  182 |   // 14. Botão submit exibe loading durante submissão
  183 |   test("botão de submit exibe estado de carregamento durante envio", async ({ page }) => {
  184 |     await openModal(page);
  185 |     await fillBasicFields(page);
  186 | 
  187 |     // Aguarda a checagem async de CPF e matrícula concluir (debounce 400ms + request)
  188 |     await page.waitForTimeout(1_000);
  189 | 
  190 |     // Intercepta qualquer chamada POST à API para simular lentidão
  191 |     await page.route("**/*", async (route) => {
  192 |       if (route.request().method() === "POST") {
  193 |         await new Promise((r) => setTimeout(r, 2_000));
  194 |         await route.continue();
  195 |       } else {
  196 |         await route.continue();
  197 |       }
  198 |     });
  199 | 
  200 |     const submitBtn = page.getByRole("button", { name: /criar colaborador/i });
  201 |     await submitBtn.click();
  202 |     await expect(page.getByRole("button", { name: /criando colaborador/i })).toBeVisible({ timeout: 3_000 });
  203 |   });
  204 | 
  205 |   // 15. Botão submit fica desabilitado com CPF duplicado
  206 |   test("botão submit fica desabilitado quando CPF é duplicado", async ({ page }) => {
  207 |     await openModal(page);
  208 | 
  209 |     // Preenche campos básicos com CPF que causará duplicidade
  210 |     await sel.fullName(page).fill("Teste Duplicado");
  211 |     const cpfInput = sel.cpf(page);
  212 |     await cpfInput.fill("529.982.247-25");
  213 | 
  214 |     // Aguarda a checagem de duplicidade
  215 |     await page.waitForTimeout(800);
  216 | 
  217 |     // Se duplicado, o botão deve estar desabilitado
  218 |     const submitBtn = page.getByRole("button", { name: /criar colaborador/i });
  219 |     // O estado depende dos dados do servidor — apenas verifica que o botão existe
  220 |     await expect(submitBtn).toBeVisible();
  221 |   });
  222 | 
  223 |   // 16. Navegação por teclado entre campos
  224 |   test("navega entre campos com Tab", async ({ page }) => {
  225 |     await openModal(page);
  226 |     const nameInput = sel.fullName(page);
  227 |     await expect(nameInput).toBeFocused();
  228 | 
  229 |     await page.keyboard.press("Tab");
  230 |     await expect(sel.email(page)).toBeFocused();
  231 | 
  232 |     await page.keyboard.press("Tab");
  233 |     await expect(sel.cpf(page)).toBeFocused();
  234 |   });
  235 | 
  236 |   // 17. Enter avança para o próximo campo
  237 |   test("tecla Enter avança para o próximo campo", async ({ page }) => {
  238 |     await openModal(page);
  239 |     const nameInput = page.getByLabel(/nome completo/i);
  240 |     await nameInput.fill("Teste");
  241 |     await nameInput.press("Enter");
  242 |     await expect(page.getByLabel(/email/i)).toBeFocused();
  243 |   });
  244 | 
  245 |   // 18. Seções visuais presentes
  246 |   test("exibe as três seções do formulário", async ({ page }) => {
  247 |     await openModal(page);
  248 |     await expect(page.getByText("Dados Pessoais")).toBeVisible();
  249 |     await expect(page.getByText("Dados Funcionais")).toBeVisible();
  250 |     await expect(page.getByText("Hierarquia Organizacional")).toBeVisible();
  251 |   });
  252 | 
  253 |   // 19. Responsividade — sem overflow horizontal
  254 |   test("modal não causa overflow horizontal no viewport", async ({ page }) => {
  255 |     await openModal(page);
  256 |     const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  257 |     const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
  258 |     expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2); // tolerância de 2px
  259 |   });
  260 | 
  261 |   // 20. Altura máxima de 90vh
  262 |   test("modal respeita altura máxima de 90vh", async ({ page }) => {
  263 |     await openModal(page);
```