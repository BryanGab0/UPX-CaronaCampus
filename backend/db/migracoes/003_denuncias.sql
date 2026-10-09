-- Denúncias entre usuários (moderação). O admin analisa, pode bloquear o denunciado
-- e marca a denúncia como resolvida.
CREATE TABLE IF NOT EXISTS denuncias (
  id             SERIAL PRIMARY KEY,
  denunciante_ra TEXT NOT NULL REFERENCES usuarios(ra) ON DELETE CASCADE,
  denunciado_ra  TEXT NOT NULL REFERENCES usuarios(ra) ON DELETE CASCADE,
  motivo         TEXT NOT NULL
                 CHECK (motivo IN ('comportamento', 'seguranca', 'perfil_falso', 'nao_compareceu', 'outro')),
  descricao      TEXT NOT NULL DEFAULT '',
  status         TEXT NOT NULL DEFAULT 'aberta' CHECK (status IN ('aberta', 'resolvida')),
  criado_em      TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (denunciante_ra <> denunciado_ra)
);

-- Uma denúncia em aberto por par (evita a mesma pessoa denunciar várias vezes seguidas).
CREATE UNIQUE INDEX IF NOT EXISTS denuncias_uma_aberta_por_par
  ON denuncias (denunciante_ra, denunciado_ra) WHERE status = 'aberta';
