-- Cancelamento de pedidos: o passageiro desiste (pedido pendente ou aceito) e o motorista
-- desfaz um aceite. O pedido continua no banco com status 'cancelada', para o histórico
-- do admin e para manter as avaliações feitas durante a carona.
ALTER TABLE solicitacoes
  ADD COLUMN IF NOT EXISTS cancelado_por TEXT CHECK (cancelado_por IN ('passageiro', 'motorista'));

-- Até aqui o status era texto livre: a API só gravava estes valores, então os dados atuais
-- já cumprem a regra.
ALTER TABLE solicitacoes
  ADD CONSTRAINT solicitacoes_status_valido CHECK (status IN ('pendente', 'aceita', 'recusada', 'cancelada'));
