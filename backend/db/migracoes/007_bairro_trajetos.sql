-- Endereço público do motorista: só bairro e cidade. O endereço completo (rua, CEP) e as
-- coordenadas continuam guardados para o próprio usuário e para o cálculo da compatibilidade,
-- mas não são mais enviados aos outros alunos. Preenchidos ao salvar o trajeto (detalhes do
-- endereço vindos do Nominatim); trajetos antigos ficam sem bairro até serem salvos de novo.
ALTER TABLE trajetos ADD COLUMN IF NOT EXISTS bairro TEXT;
ALTER TABLE trajetos ADD COLUMN IF NOT EXISTS cidade TEXT;
