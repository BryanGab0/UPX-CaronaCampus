-- Horário por dia, com ida e volta opcionais: {"seg": {"ida": "08:00", "volta": "18:00"}, ...}.
-- Substitui dias + chegada + saida (um único par de horários para a semana inteira). Os trajetos
-- existentes viram ida e volta, com os horários de antes, em cada dia que estava marcado.
ALTER TABLE trajetos ADD COLUMN horarios JSONB;

UPDATE trajetos t SET horarios = (
  SELECT jsonb_object_agg(d, jsonb_build_object('ida', t.chegada, 'volta', t.saida))
  FROM unnest(t.dias) AS d
  WHERE d IN ('seg', 'ter', 'qua', 'qui', 'sex')
);
-- Trajeto sem nenhum dia válido (não deveria existir): fica vazio e o app pede para salvar de novo.
UPDATE trajetos SET horarios = '{}'::jsonb WHERE horarios IS NULL;

ALTER TABLE trajetos
  ALTER COLUMN horarios SET NOT NULL,
  ADD CONSTRAINT trajetos_horarios_objeto CHECK (jsonb_typeof(horarios) = 'object');

ALTER TABLE trajetos DROP COLUMN dias, DROP COLUMN chegada, DROP COLUMN saida;
