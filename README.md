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
npx next lint            # ESLint
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
