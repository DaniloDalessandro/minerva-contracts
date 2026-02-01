# Sistema Minerva

Sistema de gestão de orçamentos, contratos e colaboradores com Next.js e Django REST Framework.

## Stack

- **Frontend:** Next.js 15, React 19, TypeScript, Tailwind CSS, Shadcn/ui
- **Backend:** Django 5.2, DRF, PostgreSQL 16 + pgvector, LangChain + Gemini AI

## Quick Start

### Backend

```bash
cd backend_minerva
python -m venv venv && venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env  # Configure suas variáveis
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

### Frontend

```bash
cd frontend_minerva
npm install
npm run dev
```

## Docker

```bash
# Iniciar
docker-compose up -d --build

# Primeira execução
docker-compose exec backend python manage.py migrate
docker-compose exec backend python manage.py createsuperuser

# Logs
docker-compose logs -f

# Parar
docker-compose down
```

**URLs:**
- Frontend: http://localhost:3000
- Backend: http://localhost:8000
- Swagger: http://localhost:8000/api/schema/swagger-ui/
- Admin: http://localhost:8000/admin/

## Variáveis de Ambiente

### Backend (.env)

Copie o arquivo de exemplo e configure suas variáveis:

```bash
cd backend_minerva
cp .env.example .env
```

Principais variáveis:

```env
DEBUG=True
SECRET_KEY=sua-chave-secreta
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:3000
GEMINI_API_KEY=sua-chave-gemini

# Para Docker, use PostgreSQL:
DATABASE_ENGINE=django.db.backends.postgresql
DATABASE_NAME=minerva_db
DATABASE_USER=minerva_user
DATABASE_PASSWORD=minerva_password
DATABASE_HOST=db
DATABASE_PORT=5432
```

### Frontend (.env.local)

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Comandos Úteis

```bash
# Backend
python manage.py index_embeddings  # Indexar docs para IA
python manage.py recalculate_budget_cache

# Frontend
npm run build && npm run start
```

---

**Versão:** 2.2 | **Atualizado:** Fevereiro 2026
