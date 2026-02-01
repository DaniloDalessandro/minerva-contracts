-- Script de inicialização do PostgreSQL com pgvector
-- Executado automaticamente na criação do container

-- Habilita a extensão pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- Verifica se a extensão foi criada
SELECT extname, extversion FROM pg_extension WHERE extname = 'vector';
