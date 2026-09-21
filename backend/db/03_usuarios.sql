-- Usuário do app (identificado pelo RA da Facens).
CREATE TABLE IF NOT EXISTS usuarios (
  ra         TEXT PRIMARY KEY,           -- matrícula (parte antes do @)
  nome       TEXT NOT NULL,
  email      TEXT NOT NULL,
  criado_em  TIMESTAMPTZ NOT NULL DEFAULT now()
);
 
-- Trajeto do usuário (1 por usuário). A FK liga cada trajeto a um usuário.
CREATE TABLE IF NOT EXISTS trajetos (
  usuario_ra    TEXT PRIMARY KEY REFERENCES usuarios(ra) ON DELETE CASCADE,
  papel         TEXT NOT NULL,
  bairro        TEXT NOT NULL,
  dias          TEXT[] NOT NULL,
  chegada       TEXT NOT NULL,
  saida         TEXT NOT NULL,
  carro_modelo  TEXT NOT NULL DEFAULT '',
  carro_lugares INTEGER NOT NULL DEFAULT 4,
  carro_consumo NUMERIC(5,2) NOT NULL DEFAULT 12,
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);
