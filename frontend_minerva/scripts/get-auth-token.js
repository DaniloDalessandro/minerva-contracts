/**
 * Script para obter token de autenticação
 * Execute: node scripts/get-auth-token.js
 */

const readline = require('readline');

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function getToken(email, password) {
  const url = `${API_BASE}/api/v1/accounts/token/`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Erro ao autenticar: ${error}`);
  }

  return response.json();
}

async function main() {
  console.log('🔐 Obter Token de Autenticação\n');

  try {
    const email = await question('Email: ');
    const password = await question('Senha: ');

    console.log('\n🔄 Autenticando...');

    const data = await getToken(email.trim(), password.trim());

    console.log('\n✅ Autenticação bem-sucedida!\n');
    console.log('Token de Acesso:');
    console.log('─'.repeat(60));
    console.log(data.access);
    console.log('─'.repeat(60));
    console.log('\n💡 Para usar no script de seed, execute:');
    console.log(`\nexport AUTH_TOKEN="${data.access}"`);
    console.log('\n# Ou no Windows PowerShell:');
    console.log(`$env:AUTH_TOKEN="${data.access}"`);
    console.log('\n# Ou no Windows CMD:');
    console.log(`set AUTH_TOKEN=${data.access}`);

  } catch (error) {
    console.error('\n❌ Erro:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

main();
