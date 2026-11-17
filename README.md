# Minerva

Sistema de gestão de contratos, orçamentos e colaboradores com assistente de IA integrado.

## Stack

| Camada | Tecnologias |
|--------|------------|
| Frontend | Next.js 15, TypeScript, Tailwind CSS v4, shadcn/ui |
| Backend | Django 5.2, Django REST Framework, PostgreSQL 16, pgvector |
| IA | LangChain, Google Gemini 2.5 Flash |
| Infra | Docker, Nginx, Celery, Redis |

---

## Início rápido (Docker)

**1. Variáveis de ambiente** — crie `.env` na raiz:

```env
SECRET_KEY=sua-chave-secreta-django
CORS_ALLOWED_ORIGINS=http://localhost:4002
GEMINI_API_KEY=sua-chave-gemini
```

> Gerar SECRET_KEY: `python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"`

**2. Subir**

```bash
docker compose up -d --build
```

**3. Criar superusuário (primeira vez)**

```bash
docker compose exec backend python manage.py shell -c "
from django.contrib.auth import get_user_model
User = get_user_model()
User.objects.create_superuser(email='admin@admin.com', password='admin')
"
```

**4. Acessar**

| Serviço | URL |
|---------|-----|
| Aplicação | http://localhost:4002 |
| API Docs (Swagger) | http://localhost:4002/api/docs/ |
| Django Admin | http://localhost:4002/admin/ |

---

## Configuração de e-mail

O arquivo `.env.example` na raiz contém as variáveis do Docker prontas para preencher. Se já existir um `.env`, mantenha os valores atuais e acrescente somente as variáveis ausentes. Não versione credenciais.

Para envio real de recuperação de senha, convites e avisos de vencimento, configure no `.env` da raiz:

```env
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=
EMAIL_HOST_PASSWORD=
DEFAULT_FROM_EMAIL=
APP_URL=http://localhost:4002
```

Preencha host, usuário, senha e remetente com os dados do provedor. `APP_URL` deve ser o endereço público do Minerva, usado nos links dos e-mails. Backend e worker recebem a mesma configuração. Após preencher, recrie os serviços com `docker compose up -d backend celery`.

Para testes locais, `EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend` registra as mensagens no console. O override `docker-compose.local.yml` força esse modo no backend e no worker, mesmo que o `.env` indique SMTP; execute sem esse override para validar entrega externa. No desenvolvimento sem Docker, use `backend_minerva/.env.example` e ajuste `FRONTEND_URL`.

---

## Desenvolvimento local

**Backend**

```bash
cd backend_minerva
python -m venv venv && source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
python manage.py migrate
python manage.py runserver
```

**Frontend**

```bash
cd frontend_minerva
npm install
npm run dev   # http://localhost:3000
```

`.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

**Lint / Typecheck**

```bash
cd frontend_minerva
npm run lint             # ESLint
npx tsc --noEmit -p tsconfig.json   # Typecheck
```

---

## Controle de acesso

Papéis via **Groups do Django**. Cada usuário pertence a exatamente um grupo.

| Grupo | Escopo de dados |
|-------|----------------|
| PRESIDENTE | Todos |
| DIRETOR | Sua direção |
| GERENTE | Sua gerência |
| COORDENADOR | Sua coordenação |
| FUNCIONARIO | Próprios dados |

---

## Celery (tarefas assíncronas)

O Celery é responsável pelo envio de notificações de vencimento de contratos. No Docker ele sobe automaticamente (`celery` worker + `celery-beat` scheduler). Para dev local:

```bash
# Terminal 1 — worker
celery -A core worker --loglevel=info

# Terminal 2 — scheduler (dispara tarefas periódicas)
celery -A core beat --loglevel=info --scheduler django_celery_beat.schedulers:DatabaseScheduler
```

> Requer Redis rodando localmente (`redis-server`). Configure `REDIS_URL` no `.env`.

---

## Assistente de IA — Alice

Acessível em `/alice` (botão flutuante também disponível em todas as telas). Responde perguntas em linguagem natural consultando o banco de dados via SQL gerado por LLM.

**Fluxo:** pergunta → resolução de contexto → busca semântica (pgvector) → geração de SQL (Gemini) → validação/auto-correção → execução → resposta humanizada.

**Feedback:** 👍 salva a query como exemplo futuro · 👎 substitui o exemplo incorreto.

**Setup inicial obrigatório** (executar uma vez após o primeiro deploy):

```bash
# Indexar schema do banco no contexto da IA
docker compose exec backend python manage.py populate_database_schema

# Indexar embeddings para busca semântica
docker compose exec backend python manage.py index_embeddings
```

---

## Dashboard

O `/dashboard` concentra visualizações por perfil:

- **Visão Geral** — gráficos de Orçamento por Categoria (com filtros de Ano/Nível/Direção/Gerência/Coordenação) e cards de resumo de contratos.
- **Orçamentos** — gráfico de barras Total vs Disponível (CAPEX/OPEX) com botão expandir.
- **Linhas Orçamentárias** — KPIs (Totais, Ativas, Inativas) — admin only.
- **Contratos** — pizza de Status dos Contratos + listas de vencimentos e recentes.
- **Auxílios** — KPIs (Auxílios, Contratos Ativos, Colaboradores).

Tabs administrativas (Financeiro/Maiores Contratos) são visíveis apenas para perfis admin/presidente.

---

## Estrutura do projeto

```
minerva/
├── backend_minerva/   # Django + DRF + Celery
│   ├── accounts/      # Auth, JWT cookies, RBAC, admin
│   ├── sector/         # Direção/Gerência/Coordenação
│   ├── employee/       # Colaboradores
│   ├── center/         # Centros de custo + hierarquia
│   ├── budget/         # Orçamentos + movimentações
│   ├── budgetline/     # Linhas orçamentárias + versões
│   ├── aid/            # Auxílios
│   ├── contract/       # Contratos + aditivos + parcelas + dashboard
│   ├── dashboard/      # Orçamento por hierarquia (direções/gráficos/resumo)
│   ├── ai_assistant/   # Alice (LangChain + Gemini)
│   ├── notifications/  # Notificações de vencimento
│   └── sharing/        # Compartilhamento de recursos
├── frontend_minerva/   # Next.js 15 + shadcn/ui
│   └── src/
│       ├── app/           # Rotas (App Router)
│       ├── components/    # UI (shadcn) + dashboard + layout
│       ├── features/      # Features por domínio (formulários, colunas, tipos)
│       ├── hooks/         # useCrudTable, usePermissions, use-toast
│       ├── services/      # Wrappers de API
│       └── lib/api/       # Clientes HTTP por domínio
├── nginx/              # Proxy reverso (porta 4002)
└── docker-compose.yml
```

---

## API

Todas as endpoints sob `/api/v1/`. Autenticação via cookie JWT (`access` + `refresh`) configurada automaticamente no login. Swagger UI em `/api/v1/docs/` documenta todos os endpoints.

Principais namespaces:

| Prefixo | Domínio |
|---------|---------|
| `/accounts` | Auth, usuários, convites, grupos, permissões |
| `/sector` | Direções, gerências, coordenações |
| `/employee` | Colaboradores |
| `/center` | Centros de custo (gestor + solicitante) |
| `/budget` | Orçamentos + movimentações + PDFs |
| `/budgetline` | Linhas orçamentárias + versões |
| `/aid` | Auxílios |
| `/contract` | Contratos + aditivos + parcelas + dashboard |
| `/dashboard` | Orçamento por hierarquia (direções/gráficos/resumo) |
| `/alice` | Assistente de IA (chat, sessões, schema, feedback) |
| `/notifications` | Notificações de vencimento de contratos |
| `/sharing` | Compartilhamento de recursos + notificações |


## Testes de interface com dados reais

Para rodar localmente com e-mails registrados apenas no console:

```bash
docker compose -f docker-compose.yml -f docker-compose.local.yml up -d --build
```

A suíte padrão verifica telas, formulários e responsividade. A suíte
`frontend_minerva/tests/e2e/crud-workflows.spec.ts` exercita cadastros, edições,
vínculos, movimentações, PDFs, encerramento, inativação e exclusões pelo navegador.
Ela fica desabilitada por padrão porque grava dados no banco. Use um banco local
de teste e habilite explicitamente, por exemplo no PowerShell:

```powershell
cd frontend_minerva
$env:RUN_CRUD_WORKFLOWS = '1'
$env:QA_LEDGER_FILE = Join-Path $env:TEMP 'minerva-qa-ledger.json'
npm run test:e2e -- crud-workflows.spec.ts --project desktop-1366
```

Os registros recebem prefixo `QA-MV-` e os IDs são registrados no arquivo indicado
por `QA_LEDGER_FILE`. Execute um projeto de navegador por vez quando usar o mesmo
arquivo de registro. A sequência testa a exclusão de linhas vazias e o bloqueio
de linhas com contratos; registros inativados continuam no banco para auditoria.
Após o teste, descarte o banco de teste ou remova somente os IDs QA registrados.
Os e-mails de teste usam `example.invalid`. O modo de indisponibilidade da Alice
pode ser validado sem chave de IA.
