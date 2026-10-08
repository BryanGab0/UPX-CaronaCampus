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

## Variáveis de ambiente
Definidas no `.env` (modelo em `.env.example`):

| Variável | Para que serve |
|---|---|
| `DATABASE_URL` | Conexão com o PostgreSQL |
| `PORT` | Porta da API (padrão 3333) |
| `JWT_SECRET` | Segredo que assina os tokens. **Obrigatória**: sem ela a API não sobe |
| `CORS_ORIGINS` | Sites que podem chamar a API, separados por vírgula (padrão: `localhost:5173` e `5174`) |

A API sobe em http://localhost:3333.
Teste rápido: acesse http://localhost:3333/health → deve responder `{"status":"ok","db":"ok"}`.

> Os scripts em `db/` só rodam na **primeira** criação do banco. para recriar do zero:
> `docker compose down -v && docker compose up -d`

## Segurança
- Senhas guardadas com hash bcrypt; login devolve um token JWT válido por 7 dias.
- CORS liberado só para as origens de `CORS_ORIGINS`.
- Limite de tentativas por IP: 10 logins com falha a cada 15 min e 5 cadastros por hora (resposta 429).

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
