-- Avaliação entre passageiro e motorista depois que o pedido de carona é aceito.
-- Cada lado avalia o outro uma vez por pedido (pode trocar a nota depois).
CREATE TABLE IF NOT EXISTS avaliacoes (
  id             SERIAL PRIMARY KEY,
  solicitacao_id INTEGER NOT NULL REFERENCES solicitacoes(id) ON DELETE CASCADE,
  avaliador_ra   TEXT NOT NULL REFERENCES usuarios(ra) ON DELETE CASCADE,
  avaliado_ra    TEXT NOT NULL REFERENCES usuarios(ra) ON DELETE CASCADE,
  nota           SMALLINT NOT NULL CHECK (nota BETWEEN 1 AND 5),
  criado_em      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (solicitacao_id, avaliador_ra),
  CHECK (avaliador_ra <> avaliado_ra)
);

-- Acelera a média por pessoa avaliada (lista de caronas, pedidos).
CREATE INDEX IF NOT EXISTS avaliacoes_por_avaliado ON avaliacoes (avaliado_ra);
