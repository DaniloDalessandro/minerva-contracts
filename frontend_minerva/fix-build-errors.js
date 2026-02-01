const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 Iniciando correção dos erros de build...');

// 1. Limpar cache e arquivos temporários
console.log('📁 Limpando arquivos temporários...');
try {
  if (fs.existsSync('.next')) {
    fs.rmSync('.next', { recursive: true, force: true });
  }
  console.log('✅ Pasta .next removida');
} catch (error) {
  console.log('⚠️  Erro ao remover .next:', error.message);
}

// 2. Limpar cache do npm
console.log('🧹 Limpando cache do npm...');
try {
  execSync('npm cache clean --force', { stdio: 'inherit' });
  console.log('✅ Cache do npm limpo');
} catch (error) {
  console.log('⚠️  Erro ao limpar cache:', error.message);
}

// 3. Verificar e corrigir next.config.js
console.log('⚙️  Verificando configuração do Next.js...');
const nextConfigPath = path.join(__dirname, 'next.config.mjs');

if (!fs.existsSync(nextConfigPath)) {
  const nextConfig = `/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    turbo: {
      resolveAlias: {
        underscore: 'lodash',
      },
    },
  },
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
        ignored: /node_modules/,
      }
    }
    return config
  },
  swcMinify: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
}

export default nextConfig`;

  fs.writeFileSync(nextConfigPath, nextConfig);
  console.log('✅ next.config.mjs criado');
}

// 4. Verificar package.json
console.log('📦 Verificando package.json...');
const packageJsonPath = path.join(__dirname, 'package.json');
if (fs.existsSync(packageJsonPath)) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  // Adicionar scripts se não existirem
  if (!packageJson.scripts) {
    packageJson.scripts = {};
  }
  
  packageJson.scripts = {
    ...packageJson.scripts,
    "dev": "next dev --turbopack",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "clean": "rimraf .next && npm cache clean --force"
  };
  
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  console.log('✅ package.json atualizado');
}

// 5. Criar .gitignore se não existir
console.log('📝 Verificando .gitignore...');
const gitignorePath = path.join(__dirname, '.gitignore');
if (!fs.existsSync(gitignorePath)) {
  const gitignore = `# Dependencies
node_modules/

# Next.js build output
.next/
out/

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Vercel
.vercel

# TypeScript
*.tsbuildinfo

# OS generated files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# IDE
.vscode/
.idea/

# Logs
logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Build artifacts
dist/
build/`;

  fs.writeFileSync(gitignorePath, gitignore);
  console.log('✅ .gitignore criado');
}

console.log('🎉 Correção concluída!');
console.log('');
console.log('📋 Próximos passos:');
console.log('1. Execute: npm install');
console.log('2. Execute: npm run dev');
console.log('');
console.log('Se ainda houver problemas, execute: npm run clean && npm install');