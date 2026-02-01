/**
 * Script automatizado para inserir 50 auxílios
 * Execute: node scripts/seed-auxilios-auto.js <email> <senha>
 * Ou: EMAIL=user@example.com PASSWORD=senha node scripts/seed-auxilios-auto.js
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const AUXILIO_TYPES = ['GRADUACAO', 'POS_GRADUACAO', 'AUXILIO_CRECHE_ESCOLA', 'LINGUA_ESTRANGEIRA'];
const STATUS_OPTIONS = ['AGUARDANDO', 'ATIVO', 'CONCLUIDO', 'CANCELADO'];

function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function formatDate(date) {
  return date.toISOString().split('T')[0];
}

function randomAmount(min, max) {
  return (Math.random() * (max - min) + min).toFixed(2);
}

async function getToken(email, password) {
  const url = `${API_BASE}/api/v1/accounts/token/`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Erro ao autenticar: ${error}`);
  }

  return response.json();
}

async function authenticatedFetch(url, token, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    ...options.headers
  };

  const response = await fetch(url, { ...options, headers });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`HTTP ${response.status}: ${error}`);
  }

  return response.json();
}

async function fetchColaboradores(token) {
  console.log('📥 Buscando colaboradores...');
  const url = `${API_BASE}/api/v1/employee/?page_size=100&status=ATIVO`;
  const data = await authenticatedFetch(url, token);
  console.log(`✅ ${data.results.length} colaboradores encontrados`);
  return data.results;
}

async function fetchBudgetLines(token) {
  console.log('📥 Buscando linhas orçamentárias...');
  const url = `${API_BASE}/api/v1/budgetline/budgetslines/?page_size=100`;
  const data = await authenticatedFetch(url, token);
  console.log(`✅ ${data.results.length} linhas orçamentárias encontradas`);
  return data.results;
}

async function createAuxilio(data, token) {
  const url = `${API_BASE}/api/v1/aid/aid/create/`;
  return await authenticatedFetch(url, token, {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

function generateAuxilioData(employees, budgetLines) {
  const employee = employees[Math.floor(Math.random() * employees.length)];
  const budgetLine = budgetLines[Math.floor(Math.random() * budgetLines.length)];
  const type = AUXILIO_TYPES[Math.floor(Math.random() * AUXILIO_TYPES.length)];
  const status = STATUS_OPTIONS[Math.floor(Math.random() * STATUS_OPTIONS.length)];

  const startDate = randomDate(new Date(2024, 0, 1), new Date(2025, 11, 31));
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + Math.floor(Math.random() * 12) + 6);

  const totalAmount = randomAmount(1000, 50000);
  const installmentCount = Math.floor(Math.random() * 12) + 1;
  const amountPerInstallment = (parseFloat(totalAmount) / installmentCount).toFixed(2);

  const notes = [
    'Auxílio para desenvolvimento profissional',
    'Investimento em qualificação técnica',
    'Apoio educacional ao colaborador',
    'Programa de capacitação institucional',
    null
  ];

  return {
    employee: employee.id,
    budget_line: budgetLine.id,
    type,
    total_amount: totalAmount,
    installment_count: installmentCount,
    amount_per_installment: amountPerInstallment,
    start_date: formatDate(startDate),
    end_date: formatDate(endDate),
    status,
    notes: notes[Math.floor(Math.random() * notes.length)]
  };
}

async function main() {
  console.log('🚀 Seed de Auxílios - Sistema Minerva\n');

  // Obter credenciais dos argumentos ou variáveis de ambiente
  const email = process.argv[2] || process.env.EMAIL;
  const password = process.argv[3] || process.env.PASSWORD;

  if (!email || !password) {
    console.error('❌ Credenciais não fornecidas!');
    console.log('\n💡 Uso:');
    console.log('   node scripts/seed-auxilios-auto.js <email> <senha>');
    console.log('\nOu com variáveis de ambiente:');
    console.log('   EMAIL=user@example.com PASSWORD=senha node scripts/seed-auxilios-auto.js\n');
    process.exit(1);
  }

  try {
    // 1. Autenticação
    console.log('🔄 Autenticando...');
    const authData = await getToken(email, password);
    console.log('✅ Autenticado com sucesso!\n');

    // 2. Buscar dados necessários
    const [employees, budgetLines] = await Promise.all([
      fetchColaboradores(authData.access),
      fetchBudgetLines(authData.access)
    ]);

    if (employees.length === 0) {
      console.error('\n❌ Nenhum colaborador encontrado! Crie colaboradores primeiro.');
      process.exit(1);
    }

    if (budgetLines.length === 0) {
      console.error('\n❌ Nenhuma linha orçamentária encontrada! Crie linhas orçamentárias primeiro.');
      process.exit(1);
    }

    console.log('📊 Resumo:');
    console.log(`   Colaboradores: ${employees.length}`);
    console.log(`   Linhas orçamentárias: ${budgetLines.length}`);
    console.log(`   Auxílios a criar: 50\n`);

    console.log('📝 Criando auxílios...\n');

    // 3. Criar 50 auxílios
    let successCount = 0;
    let errorCount = 0;

    for (let i = 1; i <= 50; i++) {
      try {
        const auxilioData = generateAuxilioData(employees, budgetLines);
        const result = await createAuxilio(auxilioData, authData.access);

        successCount++;
        console.log(`✅ [${i}/50] ID ${result.id} - ${auxilioData.type} - ${auxilioData.status}`);

        // Pequeno delay para não sobrecarregar a API
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        errorCount++;
        console.error(`❌ [${i}/50] Erro: ${error.message}`);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log(`🎉 Processo concluído!`);
    console.log(`✅ Sucessos: ${successCount}`);
    console.log(`❌ Erros: ${errorCount}`);
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n❌ Erro fatal:', error.message);
    process.exit(1);
  }
}

main();
