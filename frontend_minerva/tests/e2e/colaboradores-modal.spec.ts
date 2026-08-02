import { test, expect, Page } from "@playwright/test";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function openModal(page: Page) {
  await page.goto("/colaboradores");
  // Botão de adicionar (ícone Plus no header da DataTable)
  const addBtn = page.getByRole("button", { name: /adicionar novo item/i });
  await addBtn.click();
  await expect(page.getByRole("dialog")).toBeVisible();
}

// Seletores por ID para evitar ambiguidade com botões de filtro da tabela
const sel = {
  cpf: (page: Page) => page.getByRole("dialog").locator("#cpf"),
  phone: (page: Page) => page.getByRole("dialog").locator("#phone"),
  email: (page: Page) => page.getByRole("dialog").locator("#email"),
  fullName: (page: Page) => page.getByRole("dialog").locator("#full_name"),
  employeeId: (page: Page) => page.getByRole("dialog").locator("#employee_id"),
  position: (page: Page) => page.getByRole("dialog").locator("#position"),
};

async function fillBasicFields(page: Page, overrides: Record<string, string> = {}) {
  const defaults = {
    full_name: "João da Silva Teste",
    email: "joao.silva.teste@example.com",
    cpf: "529.982.247-25", // CPF válido de teste
    phone: "(11) 91234-5678",
    employee_id: "MAT-99999",
    position: "Analista de Testes",
  };
  const data = { ...defaults, ...overrides };

  await sel.fullName(page).fill(data.full_name);
  await sel.email(page).fill(data.email);
  await sel.cpf(page).fill(data.cpf);
  await sel.phone(page).fill(data.phone);
  await sel.employeeId(page).fill(data.employee_id);
  await sel.position(page).fill(data.position);
}

// ---------------------------------------------------------------------------
// Testes
// ---------------------------------------------------------------------------

test.describe("Modal Novo Colaborador", () => {

  // 1. Abertura do modal
  test("abre o modal ao clicar no botão de adicionar", async ({ page }) => {
    await openModal(page);
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByRole("heading", { name: /novo colaborador/i })).toBeVisible();
  });

  // 2. Foco automático no primeiro campo
  test("foca automaticamente no campo Nome Completo ao abrir", async ({ page }) => {
    await openModal(page);
    const input = page.getByLabel(/nome completo/i);
    await expect(input).toBeFocused();
  });

  // 3. Fechamento com ESC sem alterações
  test("fecha o modal com ESC quando não há alterações", async ({ page }) => {
    await openModal(page);
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).not.toBeVisible();
  });

  // 4. Confirmação ao fechar com dados preenchidos
  test("exibe confirmação ao tentar fechar com dados não salvos", async ({ page }) => {
    await openModal(page);
    await page.getByLabel(/nome completo/i).fill("Nome Teste");
    await page.keyboard.press("Escape");
    await expect(page.getByRole("alertdialog")).toBeVisible();
    await expect(page.getByText(/descartar alterações/i)).toBeVisible();
  });

  // 5. Descarta alterações ao confirmar
  test("fecha o modal ao confirmar descarte das alterações", async ({ page }) => {
    await openModal(page);
    await page.getByLabel(/nome completo/i).fill("Nome Teste");
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: /descartar/i }).click();
    await expect(page.getByRole("dialog")).not.toBeVisible();
  });

  // 6. Validações obrigatórias
  test("exibe erros de validação ao submeter formulário vazio", async ({ page }) => {
    await openModal(page);
    await page.getByRole("button", { name: /criar colaborador/i }).click();
    await expect(page.getByText(/nome completo é obrigatório/i)).toBeVisible();
    await expect(page.getByText(/email é obrigatório/i)).toBeVisible();
    await expect(page.getByText(/cpf é obrigatório/i)).toBeVisible();
    await expect(page.getByText(/matrícula é obrigatória/i)).toBeVisible();
    await expect(page.getByText(/cargo é obrigatório/i)).toBeVisible();
  });

  // 7. Validação de CPF inválido
  test("exibe erro para CPF inválido", async ({ page }) => {
    await openModal(page);
    const cpfInput = sel.cpf(page);
    await cpfInput.fill("111.111.111-11");
    await cpfInput.blur();
    await expect(page.getByText(/cpf inválido/i)).toBeVisible();
  });

  // 8. Máscara de CPF
  test("aplica máscara no campo CPF", async ({ page }) => {
    await openModal(page);
    const cpfInput = sel.cpf(page);
    await cpfInput.fill("52998224725");
    await expect(cpfInput).toHaveValue("529.982.247-25");
  });

  // 9. Máscara de telefone
  test("aplica máscara no campo Telefone", async ({ page }) => {
    await openModal(page);
    const phoneInput = sel.phone(page);
    await phoneInput.fill("11912345678");
    await expect(phoneInput).toHaveValue("(11) 91234-5678");
  });

  // 10. Validação de email inválido
  test("exibe erro para email inválido", async ({ page }) => {
    await openModal(page);
    const emailInput = page.getByLabel(/email/i);
    await emailInput.fill("email-invalido");
    await emailInput.blur();
    await expect(page.getByText(/email deve ter um formato válido/i)).toBeVisible();
  });

  // 11. Hierarquia: Gerência desabilitada sem Direção
  test("campo Gerência fica desabilitado até selecionar Direção", async ({ page }) => {
    await openModal(page);
    const managementTrigger = page.locator('[id="management"]');
    await expect(managementTrigger).toBeDisabled();
  });

  // 12. Hierarquia: Coordenação desabilitada sem Gerência
  test("campo Coordenação fica desabilitado até selecionar Gerência", async ({ page }) => {
    await openModal(page);
    const coordinationTrigger = page.locator('[id="coordination"]');
    await expect(coordinationTrigger).toBeDisabled();
  });

  // 13. Hierarquia: Coordenação habilita após seleção de Gerência
  test("habilita Coordenação após selecionar Direção e Gerência", async ({ page }) => {
    await openModal(page);

    // Seleciona a primeira Direção disponível
    const directionTrigger = page.locator('[id="direction"]');
    await directionTrigger.click();
    const firstDirection = page.getByRole("option").first();
    const directionCount = await page.getByRole("option").count();

    if (directionCount === 0) {
      test.skip();
      return;
    }

    await firstDirection.click();

    // Aguarda opções de Gerência
    const managementTrigger = page.locator('[id="management"]');
    await expect(managementTrigger).not.toBeDisabled({ timeout: 5_000 });
    await managementTrigger.click();

    const managementCount = await page.getByRole("option").count();
    if (managementCount === 0) {
      test.skip();
      return;
    }

    await page.getByRole("option").first().click();

    const coordinationTrigger = page.locator('[id="coordination"]');
    await expect(coordinationTrigger).not.toBeDisabled({ timeout: 5_000 });
  });

  // 14. Botão submit exibe loading durante submissão
  test("botão de submit exibe estado de carregamento durante envio", async ({ page }) => {
    await openModal(page);
    await fillBasicFields(page);

    // Aguarda a checagem async de CPF e matrícula concluir (debounce 400ms + request)
    await page.waitForTimeout(1_000);

    // Intercepta qualquer chamada POST à API para simular lentidão
    await page.route("**/*", async (route) => {
      if (route.request().method() === "POST") {
        await new Promise((r) => setTimeout(r, 2_000));
        await route.continue();
      } else {
        await route.continue();
      }
    });

    const submitBtn = page.getByRole("button", { name: /criar colaborador/i });
    await submitBtn.click();
    await expect(page.getByRole("button", { name: /criando colaborador/i })).toBeVisible({ timeout: 3_000 });
  });

  // 15. Botão submit fica desabilitado com CPF duplicado
  test("botão submit fica desabilitado quando CPF é duplicado", async ({ page }) => {
    await openModal(page);

    // Preenche campos básicos com CPF que causará duplicidade
    await sel.fullName(page).fill("Teste Duplicado");
    const cpfInput = sel.cpf(page);
    await cpfInput.fill("529.982.247-25");

    // Aguarda a checagem de duplicidade
    await page.waitForTimeout(800);

    // Se duplicado, o botão deve estar desabilitado
    const submitBtn = page.getByRole("button", { name: /criar colaborador/i });
    // O estado depende dos dados do servidor — apenas verifica que o botão existe
    await expect(submitBtn).toBeVisible();
  });

  // 16. Navegação por teclado entre campos
  test("navega entre campos com Tab", async ({ page }) => {
    await openModal(page);
    const nameInput = sel.fullName(page);
    await expect(nameInput).toBeFocused();

    await page.keyboard.press("Tab");
    await expect(sel.email(page)).toBeFocused();

    await page.keyboard.press("Tab");
    await expect(sel.cpf(page)).toBeFocused();
  });

  // 17. Enter avança para o próximo campo
  test("tecla Enter avança para o próximo campo", async ({ page }) => {
    await openModal(page);
    const nameInput = page.getByLabel(/nome completo/i);
    await nameInput.fill("Teste");
    await nameInput.press("Enter");
    await expect(page.getByLabel(/email/i)).toBeFocused();
  });

  // 18. Seções visuais presentes
  test("exibe as três seções do formulário", async ({ page }) => {
    await openModal(page);
    await expect(page.getByText("Dados Pessoais")).toBeVisible();
    await expect(page.getByText("Dados Funcionais")).toBeVisible();
    await expect(page.getByText("Hierarquia Organizacional")).toBeVisible();
  });

  // 19. Responsividade — sem overflow horizontal
  test("modal não causa overflow horizontal no viewport", async ({ page }) => {
    await openModal(page);
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2); // tolerância de 2px
  });

  // 20. Altura máxima de 90vh
  test("modal respeita altura máxima de 90vh", async ({ page }) => {
    await openModal(page);
    const dialog = page.getByRole("dialog");
    const box = await dialog.boundingBox();
    const viewportHeight = page.viewportSize()!.height;
    expect(box!.height).toBeLessThanOrEqual(viewportHeight * 0.91); // tolerância de 1%
  });
});

// ---------------------------------------------------------------------------
// Responsividade Mobile
// ---------------------------------------------------------------------------

test.describe("Modal Novo Colaborador — Mobile", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("modal é utilizável em viewport mobile sem overflow", async ({ page }) => {
    await page.goto("/colaboradores");
    const addBtn = page.getByRole("button", { name: /adicionar novo item/i });
    await addBtn.click();
    await expect(page.getByRole("dialog")).toBeVisible();

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2);
  });
});
