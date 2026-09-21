CREATE TABLE IF NOT EXISTS solicitacoes (
  id          SERIAL PRIMARY KEY,
  usuario_ra  TEXT NOT NULL REFERENCES usuarios(ra) ON DELETE CASCADE,
  carona_id   TEXT NOT NULL REFERENCES caronas(id) ON DELETE CASCADE,
  status      TEXT NOT NULL DEFAULT 'pendente',
  criado_em   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (usuario_ra, carona_id)  -- evita pedir a mesma carona 2x
);
