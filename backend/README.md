# CaronaCampus — backend

API do CaronaCampus. **Node + Express + TypeScript + PostgreSQL** (driver `pg`).

## Requisitos
- Node.js 20.19+ ou 22.12+
- Docker (para o banco)

## Como rodar

```bash
docker compose up -d

cp .env.example .env

npm install
npm run dev
```

A API sobe em http://localhost:3333.
Teste rápido: acesse http://localhost:3333/health → deve responder `{"status":"ok","db":"ok"}`.

> Os scripts em `db/` só rodam na **primeira** criação do banco. Se mudar o seed
> depois, recrie o volume: `docker compose down -v && docker compose up -d`.

## Endpoints
- `GET /health`  — saúde da API e do banco
- `GET /caronas` — lista todas as caronas
