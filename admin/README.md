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
- **Estatísticas** — totais de usuários, caronas, trajetos e solicitações
- **Usuários** — lista dos cadastrados (marca quem é admin)
- **Solicitações** — todos os pedidos de carona
