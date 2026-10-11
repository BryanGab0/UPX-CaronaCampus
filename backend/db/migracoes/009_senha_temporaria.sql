-- Senha temporária gerada pelo admin para quem esqueceu a senha (o app não tem e-mail utilizável).
-- Enquanto for verdadeira, a API só deixa o aluno trocar a senha: o admin viu a temporária, então
-- ela não pode virar a senha de uso. Volta a falso quando o aluno define a própria.
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS senha_temporaria BOOLEAN NOT NULL DEFAULT false;
