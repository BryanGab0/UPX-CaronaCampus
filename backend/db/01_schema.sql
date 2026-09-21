-- Tabela de caronas oferecidas.
CREATE TABLE IF NOT EXISTS caronas (
  id              TEXT PRIMARY KEY,
  nome            TEXT NOT NULL,
  bairro          TEXT NOT NULL,
  origem_lat      DOUBLE PRECISION NOT NULL,
  origem_lng      DOUBLE PRECISION NOT NULL,
  carro           TEXT NOT NULL,
  chegada         TEXT NOT NULL,           -- "HH:MM"
  dias            TEXT[] NOT NULL,          -- {seg,ter,qua,...}
  ponto_nome      TEXT NOT NULL,
  ponto_lat       DOUBLE PRECISION NOT NULL,
  ponto_lng       DOUBLE PRECISION NOT NULL,
  ponto_caminhada TEXT NOT NULL,
  custo_dia       NUMERIC(6,2) NOT NULL
);
