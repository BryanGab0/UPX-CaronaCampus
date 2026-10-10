-- Momento da última troca de senha. O token (JWT) vale 7 dias e não é guardado no servidor;
-- com esta data, o autenticar recusa tokens emitidos antes da troca: trocar a senha encerra
-- as sessões abertas em outros aparelhos (ex.: um celular perdido). Nulo = nunca trocou.
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS senha_alterada_em TIMESTAMPTZ;
