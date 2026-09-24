# CaronaCampus — backend
API do CaronaCampus. **Node + Express + TypeScript + PostgreSQL** (driver `pg`).
Autenticação com senha (bcrypt) e token JWT.

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

> Os scripts em `db/` só rodam na **primeira** criação do banco. para recriar do zero:
> `docker compose down -v && docker compose up -d`

## Endpoints
- `GET  /health`                     — saúde da API e do banco
- `GET  /caronas`                    — lista as caronas (público)
- `POST /auth/registrar`             — cria conta (ra, nome, email, senha) e devolve token
- `POST /auth/login`                 — autentica (ra, senha) e devolve token JWT
- `GET  /auth/eu`                    — usuário do token (protegida)
- `GET  /usuarios/:ra/trajeto`       — trajeto do usuário (protegida)
- `PUT  /usuarios/:ra/trajeto`       — salva/atualiza o trajeto (protegida)
- `POST /usuarios/:ra/solicitacoes`  — solicita uma carona (protegida)
- `GET  /usuarios/:ra/solicitacoes`  — lista as solicitações (protegida)

## Tabelas
- `usuarios` — aluno (ra, nome, email, senha_hash)
- `caronas` — caronas oferecidas
- `trajetos` — trajeto de cada usuário (chave estrangeira → `usuarios`)
- `solicitacoes` — pedidos de carona (chaves estrangeiras → `usuarios` e `caronas`)
