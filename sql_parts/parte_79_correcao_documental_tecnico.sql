-- Adiciona o técnico responsável pela correção documental (por exercício), para que a
-- produtividade da correção seja creditada a quem de fato corrigiu, não a todos os
-- responsáveis pela análise do exercício.
-- Execute este script no Supabase SQL Editor

ALTER TABLE cgof_gpc_registro_exercicio
  ADD COLUMN IF NOT EXISTS correcao_tecnico text NULL;

COMMENT ON COLUMN cgof_gpc_registro_exercicio.correcao_tecnico IS 'Técnico que realizou a correção documental deste exercício';
