-- Exclusão de conta: as denúncias que a pessoa FEZ continuam para a moderação, sem o denunciante
-- (antes, ON DELETE CASCADE as apagaria junto). As denúncias que ela RECEBEU somem com a conta.
ALTER TABLE denuncias ALTER COLUMN denunciante_ra DROP NOT NULL;
ALTER TABLE denuncias DROP CONSTRAINT IF EXISTS denuncias_denunciante_ra_fkey;
ALTER TABLE denuncias
  ADD CONSTRAINT denuncias_denunciante_ra_fkey
  FOREIGN KEY (denunciante_ra) REFERENCES usuarios(ra) ON DELETE SET NULL;
