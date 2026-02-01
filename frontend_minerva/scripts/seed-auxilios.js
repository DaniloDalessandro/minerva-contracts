/**
 * Script para inserir 50 auxílios de teste no sistema
 * Execute: node scripts/seed-auxilios.js
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Tipos de auxílio disponíveis
const AUXILIO_TYPES = [
  'GRADUACAO',
  'POS_GRADUACAO',
  'AUXILIO_CRECHE_ESCOLA',
  'LINGUA_ESTRANGEIRA'
];

// Status disponíveis
const STATUS_OPTIONS = ['AGUARDANDO', 'ATIVO', 'CONCLUIDO', 'CANCELADO'];

// Função para gerar data aleatória
function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// Função para formatar data no formato YYYY-MM-DD
function formatDate(date) {
  return date.toISOString().split('T')[0];
}

// Função para gerar valor aleatório entre min e max
function randomAmount(min, max) {
  return (Math.random() * (max - min) + min).toFixed(2);
}

// Função para fazer requisições autenticadas
async function authenticatedFetch(url, options = {}) {
  const token = process.env.AUTH_TOKEN;

  if (!token) {
    console.error('❌ Token de autenticação não encontrado!');
    console.log('💡 Execute: export AUTH_TOKEN="seu_token_aqui"');
    process.exit(1);
  }

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

// Buscar colaboradores
async function fetchColaboradores() {
  console.log('📥 Buscando colaboradores...');
  const url = `${API_BASE}/api/v1/employee/?page_size=100&status=ATIVO`;
  const data = await authenticatedFetch(url);
  console.log(`✅ ${data.results.length} colaboradores encontrados`);
  return data.results;
}

// Buscar linhas orçamentárias
async function fetchBudgetLines() {
  console.log('📥 Buscando linhas orçamentárias...');
  const url = `${API_BASE}/api/v1/budgetline/budgetslines/?page_size=100`;
  const data = await authenticatedFetch(url);
  console.log(`✅ ${data.results.length} linhas orçamentárias encontradas`);
  return data.results;
}

// Criar um auxílio
async function createAuxilio(data) {
  const url = `${API_BASE}/api/v1/aid/aid/create/`;
  return await authenticatedFetch(url, {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

// Gerar dados de auxílio aleatório
function generateAuxilioData(employees, budgetLines, index) {
  const employee = employees[Math.floor(Math.random() * employees.length)];
  const budgetLine = budgetLines[Math.floor(Math.random() * budgetLines.length)];
  const type = AUXILIO_TYPES[Math.floor(Math.random() * AUXILIO_TYPES.length)];
  const status = STATUS_OPTIONS[Math.floor(Math.random() * STATUS_OPTIONS.length)];

  // Gerar datas
  const startDate = randomDate(new Date(2024, 0, 1), new Date(2025, 11, 31));
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + Math.floor(Math.random() * 12) + 6); // 6-18 meses

  // Gerar valores
  const totalAmount = randomAmount(1000, 50000);
  const installmentCount = Math.floor(Math.random() * 12) + 1; // 1-12 parcelas
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

// Função principal
async function main() {
  console.log('🚀 Iniciando inserção de 50 auxílios...\n');

  try {
    // 1. Buscar dados necessários
    const [employees, budgetLines] = await Promise.all([
      fetchColaboradores(),
      fetchBudgetLines()
    ]);

    if (employees.length === 0) {
      console.error('❌ Nenhum colaborador encontrado! Crie colaboradores primeiro.');
      process.exit(1);
    }

    if (budgetLines.length === 0) {
      console.error('❌ Nenhuma linha orçamentária encontrada! Crie linhas orçamentárias primeiro.');
      process.exit(1);
    }

    console.log('\n📝 Criando auxílios...\n');

    // 2. Criar 50 auxílios
    let successCount = 0;
    let errorCount = 0;

    for (let i = 1; i <= 50; i++) {
      try {
        const auxilioData = generateAuxilioData(employees, budgetLines, i);
        const result = await createAuxilio(auxilioData);

        successCount++;
        console.log(`✅ [${i}/50] Auxílio criado: ID ${result.id} - ${auxilioData.type} - ${auxilioData.status}`);
      } catch (error) {
        errorCount++;
        console.error(`❌ [${i}/50] Erro ao criar auxílio: ${error.message}`);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log(`🎉 Processo concluído!`);
    console.log(`✅ Sucessos: ${successCount}`);
    console.log(`❌ Erros: ${errorCount}`);
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  }
}

// Executar
main();
