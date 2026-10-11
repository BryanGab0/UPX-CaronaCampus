# CaronaCampus — admin
 
Painel administrativo do CaronaCampus. **React + TypeScript + Vite**.
Consome a mesma API do backend; o acesso é restrito a administradores.
 
## Requisitos
- Node.js 20.19+ ou 22.12+
- O back-end no ar (ver [`backend/`](../backend/README.md))
## Como rodar
 
```bash
npm install
npm run dev
```
 
Abre em http://localhost:5174 — porta diferente do app do aluno (5173), então os dois rodam juntos.
 
## Acesso
Entre com uma conta de **administrador** (o mesmo login do app do aluno, com a
permissão de admin). Para tornar um usuário admin, no banco (dentro de `backend/`):
 
```bash
docker compose exec db psql -U carona -d caronacampus -c "UPDATE usuarios SET admin=true WHERE ra='RA';"
```

## Telas
Todas as listas têm busca (sem diferenciar acentos), filtros com contagem e paginação de 20 em 20.

- **Estatísticas** — totais de usuários, caronas, trajetos e solicitações
- **Usuários** — lista dos cadastrados (marca quem é admin), com bloquear/desbloquear conta e gerar senha temporária para quem esqueceu a senha (mostrada uma vez, com botão de copiar; o aluno é obrigado a trocá-la ao entrar)

Se a sessão deixar de valer (token expirado, senha trocada, conta bloqueada ou sem acesso de admin), o painel volta ao login explicando o motivo.
- **Solicitações** — todos os pedidos de carona (pendentes, aceitos, recusados e cancelados, com quem cancelou)
- **Denúncias** — denúncias dos alunos, com atalhos para bloquear o denunciado e marcar como resolvida
