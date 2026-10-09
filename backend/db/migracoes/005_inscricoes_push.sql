-- Aparelhos inscritos para receber notificações push (um registro por navegador/aparelho).
-- "endpoint" é o endereço único que o serviço de push do navegador fornece; p256dh e auth
-- são as chaves para criptografar a mensagem só para aquele aparelho.
CREATE TABLE IF NOT EXISTS inscricoes_push (
  endpoint   TEXT PRIMARY KEY,
  usuario_ra TEXT NOT NULL REFERENCES usuarios(ra) ON DELETE CASCADE,
  p256dh     TEXT NOT NULL,
  auth       TEXT NOT NULL,
  criado_em  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS inscricoes_push_por_usuario ON inscricoes_push (usuario_ra);
