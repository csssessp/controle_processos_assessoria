-- Adiciona coluna data_recebimento à tabela cgof_gpc_exercicio
-- Executar no Supabase SQL Editor

ALTER TABLE cgof_gpc_exercicio
  ADD COLUMN IF NOT EXISTS data_recebimento date NULL;

COMMENT ON COLUMN cgof_gpc_exercicio.data_recebimento IS 'Data em que o repasse/verba deste exercício foi recebido';
