import { test, expect, type Page } from '@playwright/test';
import fs from 'fs';

test.describe.configure({ mode: 'serial' });
test.skip(!process.env.RUN_CRUD_WORKFLOWS, 'CRUD real: habilite RUN_CRUD_WORKFLOWS=1 em ambiente local de teste.');
test.setTimeout(90000);

const seed = process.env.QA_SEED ? JSON.parse(fs.readFileSync(process.env.QA_SEED, 'utf8')) : null;
const prefix = (seed?.prefix || process.env.QA_RUN_PREFIX || `QA-MV-${Date.now()}`).toUpperCase();
const names = {
  center: `${prefix}-GESTOR`, center2: `${prefix}-OUTRO`, requesting: `${prefix}-SOLICITANTE`,
  direction: `${prefix}-DIRECAO`, management: `${prefix}-GERENCIA`, coordination: `${prefix}-COORDENACAO`,
  employee: `${prefix} PRINCIPAL`, substitute: `${prefix} SUBSTITUTO`, line: `${prefix}-LINHA`,
};
if (seed) Object.assign(names, seed.names);
const records: Array<{ kind: string; id: number; name?: string }> = seed?.records || [];
const ledger = process.env.QA_LEDGER_FILE;
function remember(kind: string, data: any, name?: string) {
  records.push({ kind, id: data.id, name });
  if (ledger) fs.writeFileSync(ledger, JSON.stringify({ prefix, names, records }, null, 2));
  return data;
}

async function tab(page: Page, path: string, label?: string) {
  await page.goto(path);
  if (label) await page.getByRole('tab', { name: label, exact: true }).click();
  await expect(page.getByRole('table')).toBeVisible();
  await expect(page.getByRole('alert').filter({ hasText: 'Não foi possível carregar' })).toHaveCount(0);
}
async function add(page: Page) {
  await page.getByRole('button', { name: 'Adicionar novo item', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
}
async function choose(page: Page, id: string, name: string | RegExp) {
  await page.getByRole('dialog').locator(`#${id}`).click();
  await page.getByRole('option', { name, exact: typeof name === 'string' && !['employee','main_fiscal','secondary_fiscal','main_inspector','substitute_inspector'].includes(id) }).click();
}
async function save(page: Page, button: string | RegExp, url: string, method = 'POST') {
  const response = page.waitForResponse(r => r.request().method() === method && r.url().includes(url), { timeout: 12000 });
  await page.getByRole('dialog').getByRole('button', { name: button, exact: typeof button === 'string' }).click();
  const res = await response;
  const data = await res.json();
  expect(res.status(), JSON.stringify(data)).toBeGreaterThanOrEqual(200);
  expect(res.status(), JSON.stringify(data)).toBeLessThan(300);
  await expect(page.getByRole('dialog')).toBeHidden();
  return data.data || data;
}
async function filter(page: Page, value: string) {
  await page.getByRole('button', { name: 'Filtrar coluna Nome', exact: true }).click();
  await page.getByPlaceholder('Filtrar...', { exact: true }).fill(value);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('cell', { name: value, exact: true })).toBeVisible();
}
async function editName(page: Page, from: string, to: string, url: string, button = 'Salvar Alterações') {
  await filter(page, from);
  await page.getByRole('cell', { name: from, exact: true }).click();
  await page.getByRole('button', { name: 'Editar item selecionado', exact: true }).click();
  await expect(page.getByRole('dialog').locator('#name')).toHaveValue(from);
  await expect(page.getByRole('dialog').getByText(/Este nome já está sendo usado/)).toHaveCount(0);
  await page.getByRole('dialog').locator('#name').fill(to);
  await save(page, button, url, 'PUT');
  await filter(page, to);
}
async function inactivate(page: Page, name: string, url: string) {
  await filter(page, name);
  await page.getByRole('cell', { name, exact: true }).click();
  await page.getByRole('button', { name: 'Excluir item selecionado', exact: true }).click();
  const response = page.waitForResponse(r => r.request().method() === 'PUT' && r.url().includes(url), { timeout: 12000 });
  await page.getByRole('alertdialog').getByRole('button', { name: 'Confirmar', exact: true }).click();
  expect((await response).status()).toBe(200);
  await expect(page.getByRole('alertdialog')).toBeHidden();
}

test('Centros: cadastro, edição persistida, solicitantes por gestor e Escape', async ({ page }) => {
  let listRequests = 0;
  page.on('request', r => { if (r.method() === 'GET' && r.url().includes('/center/management-centers/?')) listRequests++; });
  await tab(page, '/centro', 'Centros Gestores');
  await page.waitForTimeout(800);
  expect(listRequests).toBeLessThanOrEqual(3);
  for (const name of [names.center, names.center2]) {
    await add(page);
    await page.getByRole('dialog').locator('#name').fill(name);
    remember('management_center', await save(page, 'Criar Centro Gestor', '/center/management-centers/create/'), name);
  }
  await editName(page, names.center, names.center + '-EDIT', '/center/management-centers/');
  names.center += '-EDIT';
  await page.reload();
  await filter(page, names.center);
  await page.getByRole('tab', { name: 'Centros Solicitantes', exact: true }).click();
  await add(page);
  const select = page.getByRole('dialog').locator('#management_center_id');
  await expect(select).toBeEnabled();
  await select.click();
  await expect(page.getByRole('option', { name: names.center, exact: true })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByRole('listbox')).toHaveCount(0);
  await page.getByRole('button', { name: 'Cancelar', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeHidden();
  expect(await page.evaluate(() => getComputedStyle(document.body).pointerEvents)).not.toBe('none');
  for (const center of [names.center, names.center2]) {
    await add(page);
    await page.getByRole('dialog').locator('#name').fill(names.requesting);
    await choose(page, 'management_center_id', center);
    remember('requesting_center', await save(page, 'Criar Centro Solicitante', '/center/requesting-centers/create/'), names.requesting);
  }
  await expect(page.getByRole('cell', { name: names.requesting, exact: true })).toHaveCount(2);
});

test('Setores: criar direção, gerência e coordenação e editar direção', async ({ page }) => {
  await tab(page, '/setor', 'Direções');
  await add(page);
  await page.getByRole('dialog').locator('#name').fill(names.direction);
  remember('direction', await save(page, /Criar Direção/i, '/sector/directions/create/'), names.direction);
  await editName(page, names.direction, names.direction+'-EDIT', '/sector/directions/');
  names.direction += '-EDIT';
  await page.getByRole('tab', { name: 'Gerências', exact: true }).click();
  await add(page);
  await page.getByRole('dialog').locator('#name').fill(names.management);
  await choose(page, 'direction_id', names.direction);
  remember('management', await save(page, /Criar Gerência/i, '/sector/managements/create/'), names.management);
  await page.getByRole('tab', { name: 'Coordenações', exact: true }).click();
  await add(page);
  await page.getByRole('dialog').locator('#name').fill(names.coordination);
  await choose(page, 'management_id', names.management);
  remember('coordination', await save(page, /Criar Coordenação/i, '/sector/coordinations/create/'), names.coordination);
});


function cpf(seed: number) {
  const digits = String(seed).padStart(9, '0').slice(-9).split('').map(Number);
  for (const length of [9,10]) {
    const mod = digits.reduce((sum, n, i) => sum+n*(length+1-i),0)%11;
    digits.push(mod<2 ? 0 : 11-mod);
  }
  return digits.join('');
}
test('Financeiros: colaboradores, orçamento, linha, contrato e auxílio pela interface', async ({ page }) => {
  test.setTimeout(180000);
  await tab(page, '/colaboradores');
  for (const [index, name] of [names.employee, names.substitute].entries()) {
    if(records.some(r=>r.kind==='employee' && r.name===name)) continue;
    await add(page);
    for (const [id,value] of Object.entries({full_name:name,email:`${prefix}-${index}@example.invalid`,cpf:cpf(Date.now()%900000000+index),employee_id:`${prefix}-${index}`,position:'Analista QA'})) {
      await page.getByRole('dialog').locator(`#${id}`).fill(value);
    }
    await choose(page,'direction',names.direction);
    await choose(page,'management',names.management);
    await choose(page,'coordination',names.coordination);
    remember('employee',await save(page,'Criar Colaborador','/employee/create/'),name);
  }
  await tab(page,'/orcamento');
  if(!records.some(r=>r.kind==='budget')) {
  await add(page);
  await page.getByRole('dialog').locator('#year').fill('2099');
  await choose(page,'category','CAPEX');
  await choose(page,'management_center',names.center);
  await page.getByRole('dialog').locator('#total_amount').fill('1000000');
  remember('budget',await save(page,'Criar Orçamento','/budget/budgets/create/'));
  }
  await page.getByRole('cell',{name:names.center,exact:true}).click();
  await page.getByRole('button',{name:'Editar item selecionado',exact:true}).click();
  await expect(page.getByRole('dialog').locator('#available_amount')).toHaveAttribute('readonly','');
  await save(page,'Salvar Alterações','/budget/budgets/','PUT');
  await tab(page,'/linhas-orcamentarias');
  let line=records.find(r=>r.kind==='budget_line');
  if(!line) {
  await add(page);
  await choose(page,'budget',`2099 - CAPEX - ${names.center}`);
  await choose(page,'category','CAPEX');
  await choose(page,'management_center',names.center);
  await choose(page,'requesting_center',names.requesting);
  await page.getByRole('dialog').locator('#summary_description').fill(names.line);
  await page.getByRole('dialog').locator('#object').fill('Objeto QA de integração');
  await page.getByRole('dialog').locator('#budgeted_amount').fill('400000');
  await choose(page,'main_fiscal',names.employee+' ('+prefix+'-0)');
  await choose(page,'secondary_fiscal',names.substitute+' ('+prefix+'-1)');
  await page.getByRole('dialog').locator('#contract_notes').fill('Observação QA persistida');
  line=remember('budget_line',await save(page,'Criar Linha Orçamentária','/budgetline/budgetslines/create/'),names.line);
  }
  await page.goto(`/linhas-orcamentarias/${line!.id}`);
  await expect(page.getByText(names.line,{exact:true}).first()).toBeVisible();
  await page.goto('/contratos');
  let contract=records.find(r=>r.kind==='contract');
  if(!contract) {
  await add(page);
  await choose(page,'budget_line',names.line);
  await choose(page,'main_inspector',names.employee);
  await choose(page,'substitute_inspector',names.substitute);
  await choose(page,'payment_nature','Único');
  for(const [id,value] of Object.entries({description:`${prefix} CONTRATO`,original_value:'1000',current_value:'1000',start_date:'2099-01-01',end_date:'2099-12-31',signing_date:'2098-12-01',expiration_date:'2099-12-31'})) await page.getByRole('dialog').locator(`#${id}`).fill(value);
  contract=remember('contract',await save(page,'Criar Contrato','/contract/contracts/create/'));
  }
  await page.goto(`/contratos/${contract!.id}`);
  await expect(page.getByText(names.employee,{exact:true})).toBeVisible();
  await expect(page.getByText('01/01/2099',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Editar',exact:true}).click();
  await expect(page.getByRole('dialog').locator('#main_inspector')).toContainText(names.employee);
  await page.getByRole('dialog').locator('#description').fill(`${prefix} CONTRATO EDITADO`);
  await save(page,'Salvar Alterações','/contract/contracts/','PUT');
  await page.goto(`/contratos/${contract!.id}`);
  await expect(page.getByText(`${prefix} CONTRATO EDITADO`,{exact:true})).toBeVisible();
  await tab(page,'/auxilios');
  await add(page);
  await choose(page,'employee',names.employee);
  await choose(page,'budget_line',names.line);
  await page.getByRole('dialog').locator('#type').click();
  await page.getByRole('option').first().click();
  for(const [id,value] of Object.entries({total_amount:'100',installment_count:'2',start_date:'2099-01-01',end_date:'2099-12-31',notes:`${prefix} AUXILIO`})) await page.getByRole('dialog').locator(`#${id}`).fill(value);
  const aid=remember('aid',await save(page,'Criar Auxílio','/aid/aid/create/'));
  await page.goto(`/auxilios/${aid.id}`);
  await expect(page.getByText(names.employee,{exact:true}).first()).toBeVisible();
});

test('Relatorios: PDFs de todos os detalhes', async({page})=>{
 for(const [kind,path] of [['employee','colaboradores'],['budget','orcamento'],['budget_line','linhas-orcamentarias'],['contract','contratos'],['aid','auxilios']]) {
   const item=records.find(r=>r.kind===kind)!;
   await page.goto(`/${path}/${item.id}`);
   const downloaded=page.waitForEvent('download',{timeout:12000});
   await page.getByRole('button',{name:/Gerar PDF|Baixar PDF/}).click();
   const file=await downloaded;
   const filePath=await file.path();
   expect(filePath).toBeTruthy();
   const bytes=fs.readFileSync(filePath!);
   expect(bytes.subarray(0,4).toString()).toBe('%PDF');
   expect(bytes.length).toBeGreaterThan(1000);
 }
});

test('Operacoes: editar vínculos, movimentar orçamento, excluir auxílio e alternar status', async({page})=>{
 test.setTimeout(180000);
 const line=records.find(r=>r.kind==='budget_line')!;
 const budget=records.find(r=>r.kind==='budget')!;
 const aid=records.find(r=>r.kind==='aid')!;
 const employee=records.find(r=>r.kind==='employee')!;
 await page.goto(`/linhas-orcamentarias/${line.id}`);
 await page.getByRole('button',{name:'Editar',exact:true}).click();
 await expect(page.getByRole('dialog').locator('#summary_description')).toHaveValue(names.line);
 await expect(page.getByRole('dialog').locator('#secondary_fiscal')).toContainText(names.substitute);
 await expect(page.getByRole('dialog').locator('#contract_notes')).toHaveValue('Observação QA persistida');
 await page.getByRole('dialog').locator('#object').fill('Objeto QA editado');
 await save(page,'Salvar Alterações','/budgetline/budgetslines/','PUT');
 await page.goto(`/linhas-orcamentarias/${line.id}`);
 await expect(page.getByText('Objeto QA editado',{exact:true})).toBeVisible();
 await page.goto(`/auxilios/${aid.id}`);
 await page.getByRole('button',{name:'Editar',exact:true}).click();
 await expect(page.getByRole('dialog').locator('#employee')).toContainText(names.employee);
 await page.getByRole('dialog').locator('#notes').fill(`${prefix} AUXILIO EDITADO`);
 await save(page,'Salvar Alterações','/aid/aid/','PUT');
 await page.goto(`/auxilios/${aid.id}`);
 await expect(page.getByText(`${prefix} AUXILIO EDITADO`,{exact:true})).toBeVisible();
 await page.goto(`/colaboradores/${employee.id}`);
 await page.getByRole('button',{name:'Editar',exact:true}).click();
 await expect(page.getByRole('dialog').locator('#coordination')).toContainText(names.coordination);
 await page.getByRole('dialog').locator('#position').fill('Analista QA editado');
 await page.getByRole('dialog').locator('#employee_id').fill(`${prefix}-0`);
 await save(page,'Salvar Alterações','/employee/','PUT');
 await page.goto(`/colaboradores/${employee.id}`);
 await expect(page.getByText('Analista QA editado',{exact:true}).first()).toBeVisible();
 if(records.filter(r=>r.kind==='budget').length<2) {
 await tab(page,'/orcamento');
 await add(page);
 await page.getByRole('dialog').locator('#year').fill('2099');
 await choose(page,'category','CAPEX');
 await choose(page,'management_center',names.center2);
 await page.getByRole('dialog').locator('#total_amount').fill('1000000');
 remember('budget',await save(page,'Criar Orçamento','/budget/budgets/create/'));
 }
 await page.goto(`/orcamento/${budget.id}`);
 let movement=records.find(r=>r.kind==='budget_movement');
 if(!movement) {
 await page.getByRole('button',{name:'Nova Movimentação',exact:true}).click();
 const dialog=page.getByRole('dialog');
 await dialog.getByRole('combobox').nth(0).click();
 await page.getByRole('option').filter({hasText:names.center}).click();
 await dialog.getByRole('combobox').nth(1).click();
 await page.getByRole('option').filter({hasText:names.center2}).click();
 await dialog.locator('#amount').fill('100');
 await dialog.locator('#notes').fill(`${prefix} MOVIMENTO`);
 movement=remember('budget_movement',await save(page,'Criar','/budget/movements/create/'));
 }
 const row=page.getByRole('row').filter({hasText:`${prefix} MOVIMENTO`});
 await expect(row).toBeVisible();
 await row.getByTitle('Editar',{exact:true}).click();
 await page.getByRole('dialog').locator('#amount').fill('200');
 await save(page,'Salvar','/budget/movements/','PUT');
 await row.getByTitle('Excluir',{exact:true}).click();
 const response=page.waitForResponse(r=>r.request().method()==='DELETE'&&r.url().includes(`/movements/${movement!.id}/`),{timeout:12000});
 await page.getByRole('dialog').getByRole('button',{name:'Excluir',exact:true}).click();
 expect((await response).status()).toBeLessThan(300);
 await expect(page.getByRole('dialog')).toBeHidden();
 await expect(row).toHaveCount(0);
 await tab(page,'/auxilios');
 await page.getByRole('button',{name:'Filtrar coluna Status',exact:true}).click();
 await page.getByRole('dialog').getByRole('combobox').click();
 await page.getByRole('option',{name:'Todos',exact:true}).click();
 await page.keyboard.press('Escape');
 const aidrow=page.getByRole('row').filter({hasText:names.employee});
 await aidrow.click();
 await page.getByRole('button',{name:'Excluir item selecionado',exact:true}).click();
 const removed=page.waitForResponse(r=>r.request().method()==='DELETE'&&r.url().includes(`/aid/delete/${aid.id}/`),{timeout:12000});
 await page.getByRole('alertdialog').getByRole('button',{name:'Excluir',exact:true}).click();
 expect((await removed).status()).toBeLessThan(300);
 await expect(page.getByRole('alertdialog')).toBeHidden();
 await expect(aidrow).toHaveCount(0);
 await tab(page,'/centro','Centros Solicitantes');
 await page.getByRole('cell',{name:names.requesting,exact:true}).first().click();
 await page.getByRole('button',{name:'Editar item selecionado',exact:true}).click();
 await page.getByRole('dialog').locator('#name').fill(names.requesting+'-EDIT');
 await save(page,'Salvar Alterações','/center/requesting-centers/','PUT');
 await inactivate(page,names.requesting+'-EDIT','/center/requesting-centers/');
 await tab(page,'/setor','Coordenações');
 await editName(page,names.coordination,names.coordination+'-EDIT','/sector/coordinations/');
 await inactivate(page,names.coordination+'-EDIT','/sector/coordinations/');
 await tab(page,'/setor','Gerências');
 await editName(page,names.management,names.management+'-EDIT','/sector/managements/');
 await inactivate(page,names.management+'-EDIT','/sector/managements/');
 await tab(page,'/setor','Direções');
 await inactivate(page,names.direction,'/sector/directions/');
});




test('Encerramento: status de contrato, colaborador e gestor, exclusão de linha e orçamentos', async({page})=>{
 test.setTimeout(120000);
 const contract=records.find(r=>r.kind==='contract')!;
 await page.goto(`/contratos/${contract.id}`);
 await page.getByRole('button',{name:'Editar',exact:true}).click();
 await choose(page,'status','Encerrado');
 await save(page,'Salvar Alterações','/contract/contracts/','PUT');
 await page.goto(`/contratos/${contract.id}`);
 await expect(page.getByText('Encerrado',{exact:true})).toBeVisible();
 await tab(page,'/colaboradores');
 await page.getByRole('button',{name:'Filtrar coluna Status',exact:true}).click();
 await page.getByRole('dialog').getByRole('combobox').click();
 await page.getByRole('option',{name:'Todos',exact:true}).click();
 await page.keyboard.press('Escape');
 await filter(page,names.employee);
 await page.getByRole('cell',{name:names.employee,exact:true}).click();
 await page.getByRole('button',{name:'Excluir item selecionado',exact:true}).click();
 const toggled=page.waitForResponse(r=>r.request().method()==='PATCH'&&r.url().includes('/employee/'),{timeout:12000});
 await page.getByRole('alertdialog').getByRole('button',{name:'Confirmar',exact:true}).click();
 expect((await toggled).status()).toBe(200);
 await expect(page.getByRole('alertdialog')).toBeHidden();
 await page.goto('/linhas-orcamentarias');
 await page.getByRole('row').filter({hasText:names.line}).click();
 await page.getByRole('button',{name:'Excluir item selecionado',exact:true}).click();
 const lineDeleted=page.waitForResponse(r=>r.request().method()==='DELETE'&&r.url().includes('/budgetline/'),{timeout:12000});
 await page.getByRole('alertdialog').getByRole('button',{name:'Excluir',exact:true}).click();
 expect((await lineDeleted).status()).toBe(400);
 await expect(page.getByRole('alertdialog')).toBeVisible();
 await page.getByRole('alertdialog').getByRole('button',{name:'Cancelar',exact:true}).click();
 if(!records.some(r=>r.kind==='requesting_center' && r.name===prefix+'-SOLICITANTE-EXCLUIR')) {
 await tab(page,'/centro','Centros Solicitantes');
 await add(page);
 await page.getByRole('dialog').locator('#name').fill(prefix+'-SOLICITANTE-EXCLUIR');
 await choose(page,'management_center_id',names.center2);
 remember('requesting_center',await save(page,'Criar Centro Solicitante','/center/requesting-centers/create/'),prefix+'-SOLICITANTE-EXCLUIR');
 }
 await tab(page,'/linhas-orcamentarias');
 await add(page);
 await choose(page,'budget',`2099 - CAPEX - ${names.center2}`);
 await choose(page,'category','CAPEX');
 await choose(page,'management_center',names.center2);
 await choose(page,'requesting_center',prefix+'-SOLICITANTE-EXCLUIR');
 await page.getByRole('dialog').locator('#summary_description').fill(names.line+'-EXCLUIR');
 await page.getByRole('dialog').locator('#object').fill('Linha vazia para testar exclusão');
 await page.getByRole('dialog').locator('#budgeted_amount').fill('10');
 remember('budget_line',await save(page,'Criar Linha Orçamentária','/budgetline/budgetslines/create/'),names.line+'-EXCLUIR');
 await page.getByRole('row').filter({hasText:names.line+'-EXCLUIR'}).click();
 await page.getByRole('button',{name:'Excluir item selecionado',exact:true}).click();
 const emptyLineDeleted=page.waitForResponse(r=>r.request().method()==='DELETE'&&r.url().includes('/budgetline/'),{timeout:12000});
 await page.getByRole('alertdialog').getByRole('button',{name:'Excluir',exact:true}).click();
 expect((await emptyLineDeleted).status()).toBe(204);
 await expect(page.getByRole('alertdialog')).toBeHidden();
 await expect(page.getByRole('row').filter({hasText:names.line+'-EXCLUIR'})).toHaveCount(0);
 for(const name of [names.center,names.center2]) {
   await tab(page,'/orcamento');
   await page.getByRole('cell',{name,exact:true}).click();
   await page.getByRole('button',{name:'Excluir item selecionado',exact:true}).click();
   const removed=page.waitForResponse(r=>r.request().method()==='DELETE'&&r.url().includes('/budget/budgets/'),{timeout:12000});
   await page.getByRole('alertdialog').getByRole('button',{name:'Excluir',exact:true}).click();
   const response = await removed;
   if(name===names.center) {
     expect(response.status()).toBe(400);
     await expect(page.getByText(/Não é possível excluir um orçamento com linhas vinculadas/).first()).toBeVisible();
     await expect(page.getByRole('alertdialog')).toBeVisible();
     await page.getByRole('alertdialog').getByRole('button',{name:'Cancelar',exact:true}).click();
   } else {
     expect(response.status()).toBe(204);
     await expect(page.getByRole('alertdialog')).toBeHidden();
   }
 }
 await tab(page,'/centro','Centros Gestores');
 await inactivate(page,names.center,'/center/management-centers/');
 await page.reload();
 await page.getByRole('button',{name:'Filtrar coluna Status',exact:true}).click();
 await page.getByRole('dialog').getByRole('combobox').click();
 await page.getByRole('option',{name:'Todos',exact:true}).click();
 await page.keyboard.press('Escape');
 await filter(page,names.center);
 await expect(page.getByRole('row').filter({hasText:names.center})).toContainText('Inativo');
});
