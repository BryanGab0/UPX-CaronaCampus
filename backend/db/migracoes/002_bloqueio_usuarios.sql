-- Permite ao administrador bloquear um usuário (moderação).
-- Conta bloqueada não faz login, não usa a API e some da lista de caronas.
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS bloqueado BOOLEAN NOT NULL DEFAULT false;
