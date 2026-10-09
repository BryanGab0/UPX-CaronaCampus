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
npm run migrar
npm run dev
```

No Windows (CMD), troque `cp` por `copy`.

## Variáveis de ambiente
Definidas no `.env` (modelo em `.env.example`):

| Variável | Para que serve |
|---|---|
| `DATABASE_URL` | Conexão com o PostgreSQL |
| `PORT` | Porta da API (padrão 3333) |
| `JWT_SECRET` | Segredo que assina os tokens. **Obrigatória**: sem ela a API não sobe |
| `CORS_ORIGINS` | Sites que podem chamar a API, separados por vírgula (padrão: `localhost:5173` e `5174`) |
| `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` | Chaves das notificações push (opcionais: sem elas a API funciona, só não envia avisos). Gerar com `npx web-push generate-vapid-keys` |
| `VAPID_SUBJECT` | Contato do remetente das notificações (padrão: `mailto:caronacampus.contato@gmail.com`) |
| `SENTRY_DSN` | Registro de erros no Sentry (opcional: sem ela nada é enviado). Endereço em *Settings → Projects → Client Keys (DSN)* |

A API sobe em http://localhost:3333.
Teste rápido: acesse http://localhost:3333/health → deve responder `{"status":"ok","db":"ok"}`.

## Migrações do banco
O schema evolui por arquivos SQL numerados em `db/migracoes/` (`001_schema_inicial.sql`, `002_...`).
`npm run migrar` aplica, em ordem, só os que ainda não rodaram naquele banco, e registra cada um na tabela `migracoes`.

- Cada migração roda numa transação: se der erro, nada dela fica no banco.
- O `npm start` (usado em produção) roda `npm run migrar` antes de subir a API.
- Para mudar o schema, **crie um arquivo novo** com o próximo número; nunca edite um que já foi aplicado.
- Recriar o banco local do zero (apaga os dados): `docker compose down -v`, `docker compose up -d` e `npm run migrar`.

## Testes
Com o banco do Docker no ar:

```bash
npm test
```

Os testes usam um banco separado, `caronacampus_test`, criado e recriado automaticamente a partir das migrações. Eles se recusam a rodar em um banco cujo nome não termine em `_test`.

## Segurança
- Senhas guardadas com hash bcrypt; login devolve um token JWT válido por 7 dias.
- CORS liberado só para as origens de `CORS_ORIGINS`.
- Limite de tentativas por IP: 10 logins com falha a cada 15 min e 5 cadastros por hora (resposta 429).
- Moderação: o admin bloqueia contas (`PATCH /admin/usuarios/:ra/bloqueio`). A cada requisição, o `autenticar` confere no banco se a conta existe e não está bloqueada; conta bloqueada não faz login e some da lista de caronas.
- Telefone só é exposto às duas partes de um pedido aceito.
- Notificações push (Web Push/VAPID) para pedido novo e para aceite/recusa; contas bloqueadas não recebem, e aparelhos que cancelaram a inscrição (404/410) são removidos automaticamente.
- Erros em produção vão para o Sentry (`src/instrument.ts`, carregado com `--import` antes da API). O envio é restrito: sem corpo das requisições (senha, telefone), cabeçalhos (token), IP, query string, variáveis locais nem o `detail` dos erros do Postgres.

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
- `usuarios` — aluno (ra, nome, email, senha_hash, telefone, admin)
- `trajetos` — trajeto de cada usuário: papel (motorista/passageiro), endereço, coordenadas, dias e horários (chave estrangeira → `usuarios`)
- `solicitacoes` — pedidos de carona do passageiro ao motorista, com status `pendente`, `aceita` ou `recusada` (chaves estrangeiras → `usuarios`)
- `denuncias` — denúncia de um usuário contra outro (motivo, descrição, status `aberta`/`resolvida`; uma aberta por par)
- `avaliacoes` — nota de 1 a 5 que cada lado dá ao outro em um pedido aceito (uma por lado; a média é calculada na consulta)
- `inscricoes_push` — aparelhos inscritos para receber notificações (endereço e chaves do navegador)
- `migracoes` — controle de quais migrações já foram aplicadas
