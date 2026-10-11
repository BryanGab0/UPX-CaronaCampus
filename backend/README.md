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
- Trocar a senha encerra as sessões dos outros aparelhos: `senha_alterada_em` (migração `008`) guarda o momento da troca e o `autenticar` recusa (401) tokens emitidos antes dela. Quem trocou recebe um token novo. As inscrições de notificação da pessoa também são apagadas, para um aparelho perdido não continuar recebendo avisos; o aparelho atual se inscreve de novo.
- CORS liberado só para as origens de `CORS_ORIGINS`.
- Limite de tentativas por IP: 10 logins com falha a cada 15 min e 5 cadastros por hora (resposta 429).
- Exclusão da conta (LGPD): `DELETE /usuarios/:ra` exige a senha (uma sessão esquecida aberta não basta). Saem em cascata trajeto, pedidos, avaliações, aparelhos de notificação e denúncias recebidas; as denúncias **feitas** pela pessoa continuam para a moderação, anônimas (`denunciante_ra` vira nulo, migração `010`). Quem tinha carona aceita ou pedido pendente com ela recebe um aviso.
- Senha esquecida (não há e-mail para recuperar): o admin gera uma senha temporária (`POST /admin/usuarios/:ra/senha-temporaria`), sorteada com gerador criptográfico e sem caracteres ambíguos, mostrada só nessa resposta (o banco guarda o hash). Ela encerra as sessões e os avisos do aluno e marca `senha_temporaria` (migração `009`): até o aluno definir a própria senha, o `autenticar` responde 403 (`trocarSenha: true`) a tudo, exceto trocar a senha e `GET /auth/eu`. Não vale para administradores.
- Moderação: o admin bloqueia contas (`PATCH /admin/usuarios/:ra/bloqueio`). A cada requisição, o `autenticar` confere no banco se a conta existe e não está bloqueada; conta bloqueada não faz login e some da lista de caronas.
- Telefone só é exposto às duas partes de um pedido aceito.
- Notificações push (Web Push/VAPID) para pedido novo e para aceite/recusa; contas bloqueadas não recebem, e aparelhos que cancelaram a inscrição (404/410) são removidos automaticamente.
- Erros em produção vão para o Sentry (`src/instrument.ts`, carregado com `--import` antes da API). O envio é restrito: sem corpo das requisições (senha, telefone), cabeçalhos (token), IP, query string, variáveis locais nem o `detail` dos erros do Postgres.

## Compatibilidade e privacidade da localização
O algoritmo de compatibilidade fica em `src/match.ts` (parâmetros no topo do arquivo) e roda na API, não no navegador: assim a coordenada exata da casa do motorista nunca sai do servidor.

- Horários por viagem: em cada dia, a ida (chegada na Facens) e a volta (saída) são opcionais. A nota de horário é a média, entre as viagens de quem pede, da proximidade do horário (zera em `TOLERANCIA_MIN`); a viagem que o motorista não faz (outro dia ou outro sentido) vale 0. O combustível é calculado por viagem (`custoTrecho`) e devolvido com as viagens em comum (`trechosComuns`).
- A nota usa o trajeto **salvo** de quem pede; a origem nunca vem da requisição, então não dá para sondar a casa testando coordenadas.
- O desvio da rota e a distância até a Facens são arredondados em passos de 0,5 km antes de entrar na nota e no combustível. Sem isso, quem mudasse o próprio trajeto várias vezes e comparasse os números poderia triangular a casa.
- A localização enviada é o centro de uma célula de 0,01° (~1 km) da grade, fixa para cada motorista: um deslocamento sorteado a cada requisição poderia ser desfeito com a média.
- O endereço enviado é só bairro e cidade (colunas `bairro`/`cidade`, migração `007`); a rua e o CEP ficam com o dono do trajeto.

## Endpoints
- `GET  /ping`                       — a API está no ar (não consulta o banco; usado pelo monitor de uptime)
- `GET  /health`                     — saúde da API e do banco
- `GET  /caronas`                    — lista as caronas já ranqueadas pela compatibilidade com o trajeto salvo de quem pede, com o detalhamento da nota, bairro, região aproximada e vagas livres (protegida)
- `POST /auth/registrar`             — cria conta (ra, nome, email, senha) e devolve token
- `POST /auth/login`                 — autentica (ra, senha) e devolve token JWT (com `senhaTemporaria` quando a senha veio do admin)
- `GET  /auth/eu`                    — usuário do token, com o telefone (protegida)
- `GET  /usuarios/:ra/trajeto`       — trajeto do usuário (protegida)
- `PATCH /usuarios/:ra`               — altera o próprio nome (2 a 80 caracteres) e/ou telefone; RA e e-mail não mudam (protegida)
- `PATCH /usuarios/:ra/senha`         — troca a senha conferindo a atual (mesmo limite de tentativas do login) e devolve um token novo (protegida)
- `DELETE /usuarios/:ra`              — exclui a própria conta confirmando a senha (mesmo limite de tentativas); administradores não se excluem pelo app (protegida)
- `PUT  /usuarios/:ra/trajeto`       — salva/atualiza o trajeto, com `horarios` por dia (`{"seg": {"ida": "08:00", "volta": null}}`: dias de seg a sex, HH:MM, ao menos a ida ou a volta em cada dia; senão 400) e bairro e cidade opcionais (protegida; vagas de 1 a 6, nunca abaixo dos passageiros já aceitos: 409)
- `POST /usuarios/:ra/solicitacoes`  — solicita uma carona (protegida)
- `GET  /usuarios/:ra/solicitacoes`  — lista as solicitações (protegida)
- `GET  /usuarios/:ra/pedidos`       — pedidos recebidos pelo motorista (protegida)
- `PATCH /solicitacoes/:id`           — motorista aceita ou recusa um pedido pendente (protegida; 409 se não estiver pendente)
- `PATCH /solicitacoes/:id/cancelamento` — passageiro cancela (pendente ou aceito) ou motorista desfaz o aceite (protegida; 409 se o status já mudou)

Regras dos pedidos: um por par passageiro/motorista. Depois de cancelado, pedir de novo o reabre como pendente; depois de recusado, não. O telefone das partes só aparece com o pedido aceito, então some se ele for cancelado. As avaliações feitas durante a carona são mantidas.

Vagas: `carro_lugares` é o número de vagas para passageiros (sem contar o motorista). As vagas livres são calculadas (vagas − pedidos aceitos), nunca guardadas, então cancelar libera a vaga sozinho. Com o carro lotado, o aceite e os pedidos novos recebem 409. O aceite roda numa transação que trava o trajeto do motorista (`SELECT ... FOR UPDATE`, em `src/vagas.ts`), para dois aceites ao mesmo tempo não ocuparem a mesma última vaga.

## Tabelas
- `usuarios` — aluno (ra, nome, email, senha_hash, telefone, admin, bloqueado, senha_alterada_em, senha_temporaria)
- `trajetos` — trajeto de cada usuário: papel (motorista/passageiro), endereço, bairro e cidade, coordenadas, `horarios` (JSONB com a ida e a volta de cada dia, migração `011`, no lugar de `dias`/`chegada`/`saida`) e, para motoristas, carro e vagas (chave estrangeira → `usuarios`)
- `solicitacoes` — pedidos de carona do passageiro ao motorista, com status `pendente`, `aceita`, `recusada` ou `cancelada` e quem cancelou (`cancelado_por`) (chaves estrangeiras → `usuarios`)
- `denuncias` — denúncia de um usuário contra outro (motivo, descrição, status `aberta`/`resolvida`; uma aberta por par; denunciante nulo quando quem denunciou excluiu a conta)
- `avaliacoes` — nota de 1 a 5 que cada lado dá ao outro em um pedido aceito (uma por lado; a média é calculada na consulta)
- `inscricoes_push` — aparelhos inscritos para receber notificações (endereço e chaves do navegador)
- `migracoes` — controle de quais migrações já foram aplicadas
