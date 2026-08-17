-- ============================================================
-- parte_52_municipio.sql
-- Adiciona campo municipio em cgof_gpc_recebidos
-- Separa o município da entidade no cadastro do processo
-- ============================================================

ALTER TABLE cgof_gpc_recebidos
  ADD COLUMN IF NOT EXISTS municipio TEXT DEFAULT NULL;

COMMENT ON COLUMN cgof_gpc_recebidos.municipio IS
  'Município do processo (separado do campo entidade)';
