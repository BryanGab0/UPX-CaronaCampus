-- Schema inicial (usuarios, trajetos, solicitacoes).
-- Usa IF NOT EXISTS: em bancos que ja tinham as tabelas (Docker antigo, Neon),
-- esta migracao so fica registrada como aplicada, sem alterar nada.

CREATE TABLE IF NOT EXISTS usuarios (
  ra          TEXT PRIMARY KEY,
  nome        TEXT NOT NULL,
  email       TEXT NOT NULL,
  senha_hash  TEXT NOT NULL,
  telefone    TEXT NOT NULL,
  admin       BOOLEAN NOT NULL DEFAULT false,
  criado_em   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS trajetos (
  usuario_ra    TEXT PRIMARY KEY REFERENCES usuarios(ra) ON DELETE CASCADE,
  papel         TEXT NOT NULL,
  endereco      TEXT NOT NULL,
  origem_lat    DOUBLE PRECISION NOT NULL,
  origem_lng    DOUBLE PRECISION NOT NULL,
  dias          TEXT[] NOT NULL,
  chegada       TEXT NOT NULL,
  saida         TEXT NOT NULL,
  carro_modelo  TEXT NOT NULL DEFAULT '',
  carro_lugares INTEGER NOT NULL DEFAULT 4,
  carro_consumo NUMERIC(5,2) NOT NULL DEFAULT 12,
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS solicitacoes (
  id            SERIAL PRIMARY KEY,
  passageiro_ra TEXT NOT NULL REFERENCES usuarios(ra) ON DELETE CASCADE,
  motorista_ra  TEXT NOT NULL REFERENCES usuarios(ra) ON DELETE CASCADE,
  status        TEXT NOT NULL DEFAULT 'pendente',
  criado_em     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (passageiro_ra, motorista_ra)
);
