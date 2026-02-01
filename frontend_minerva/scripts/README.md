# Scripts de Seed do Sistema Minerva

Este diretório contém scripts para popular o banco de dados com dados de teste.

## 📋 Pré-requisitos

- Node.js instalado
- Backend rodando em `http://localhost:8000`
- Usuário com credenciais válidas

## 🚀 Como Usar

### 1. Obter Token de Autenticação

Primeiro, obtenha um token de autenticação:

```bash
node scripts/get-auth-token.js
```

Digite seu email e senha quando solicitado. O script retornará um token de acesso.

### 2. Configurar Variável de Ambiente

**Linux/Mac:**
```bash
export AUTH_TOKEN="seu_token_aqui"
```

**Windows PowerShell:**
```powershell
$env:AUTH_TOKEN="seu_token_aqui"
```

**Windows CMD:**
```cmd
set AUTH_TOKEN=seu_token_aqui
```

### 3. Executar Script de Seed

Para inserir 50 auxílios:

```bash
node scripts/seed-auxilios.js
```

## 📝 Scripts Disponíveis

### `get-auth-token.js`
Obtém token de autenticação do sistema.

**Uso:**
```bash
node scripts/get-auth-token.js
```

### `seed-auxilios.js`
Insere 50 registros de auxílios com dados variados.

**Características:**
- Tipos: GRADUACAO, POS_GRADUACAO, AUXILIO_CRECHE_ESCOLA, LINGUA_ESTRANGEIRA
- Status: AGUARDANDO, ATIVO, CONCLUIDO, CANCELADO
- Datas aleatórias entre 2024-2025
- Valores entre R$ 1.000,00 e R$ 50.000,00
- 1-12 parcelas

**Uso:**
```bash
export AUTH_TOKEN="seu_token"
node scripts/seed-auxilios.js
```

## ⚠️ Observações

- Certifique-se de ter colaboradores e linhas orçamentárias cadastrados antes de executar o seed de auxílios
- Os scripts usam dados aleatórios, então cada execução gera dados diferentes
- Em caso de erro, verifique se o backend está rodando e o token está válido
