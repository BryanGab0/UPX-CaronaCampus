# CaronaCampus
[![CI](https://github.com/BryanGab0/UPX-CaronaCampus/actions/workflows/ci.yml/badge.svg)](https://github.com/BryanGab0/UPX-CaronaCampus/actions/workflows/ci.yml)

Plataforma de **carona universitária** exclusiva para a comunidade da Facens (Sorocaba).
O cadastro é restrito ao formato de e-mail da Facens (`RA@facens.br`), e a confiança entre os usuários vem da moderação: o administrador pode bloquear contas, e o telefone só é revelado depois que o motorista aceita o pedido.

> Projeto acadêmico de faculdade.

## No ar
- **App do aluno:** https://carona-campus-aluno.vercel.app
- **API:** https://caronacampus.onrender.com
- **Painel administrativo:** https://carona-campus-admin.vercel.app

> A API usa hospedagem gratuita e "dorme" após alguns minutos sem uso: a **primeira** requisição pode levar ~30–60s para responder. Depois, normaliza.

O repositório tem três partes:
- **front-end** do aluno — na raiz
- **back-end** (API) — em [`backend/`](backend/)
- **painel administrativo** — em [`admin/`](admin/)

## Stack
- Frontend: React + TypeScript + Vite (Tailwind CSS)
- Backend: Node.js + Express + TypeScript
- Banco: PostgreSQL
- Deploy: Vercel (front-ends), Render (API), Neon (banco)

## Funcionalidades
- Login e cadastro com senha e e-mail no formato da Facens (`RA@facens.br`)
- Cadastro de trajeto (origem, dias e horários)
- Match de caronas por proximidade e horário (compatibilidade calculada)
- Mapa com o trajeto até o campus (Leaflet + OpenStreetMap)
- Divisão do custo de combustível
- Solicitação de caronas, com aceite ou recusa pelo motorista
- Aviso de pedidos pendentes na tela inicial
- Impacto estimado das caronas aceitas (economia de combustível e CO₂ evitado no mês)
- Avaliação de 1 a 5 estrelas entre passageiro e motorista após o aceite, com a média exibida nos cards
- Denúncia de motorista ou passageiro, analisada pela administração
- Página de privacidade (LGPD) explicando quais dados são usados e quem vê o quê
- Painel administrativo: estatísticas, usuários (com bloqueio de conta), solicitações e denúncias
- Instalável na tela inicial do celular (PWA), abrindo em tela cheia
- Notificações push: o motorista é avisado de pedidos novos e o passageiro, do aceite ou da recusa (ativadas no Perfil; no iPhone, com o app instalado)
- Acessibilidade: contraste AA, navegação por teclado e rótulos para leitores de tela

## Como rodar localmente
Precisa de Node 20.19+ (ou 22.12+) e do back-end no ar.

1. Suba o back-end e o banco seguindo o [README do backend](backend/README.md).
2. Na raiz, rode o front-end:

```bash
npm install
npm run dev
```

O site abre em http://localhost:5173 (a API precisa estar rodando em http://localhost:3333).

Para o painel administrativo, veja o [README do admin](admin/README.md).

## Qualidade
- `npm run lint` — ESLint (cobre app, admin e API)
- `npm test` — testes do app e do admin (compatibilidade, impacto estimado, formatadores, busca e paginação), com Vitest
- `npm test` em `backend/` — testes da API (autenticação, permissões, aceite/recusa, moderação, avaliações, notificações, limite de tentativas e migrações)
- A cada push na `main` e em cada Pull Request, o GitHub Actions roda lint, checagem de tipos, testes e build dos três projetos.
