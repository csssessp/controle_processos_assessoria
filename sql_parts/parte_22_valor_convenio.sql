-- ============================================================
-- parte_22_valor_convenio.sql
-- Adiciona campo valor_convenio em cgof_gpc_recebidos
-- Valor global do convênio conforme termo assinado
-- ============================================================

ALTER TABLE cgof_gpc_recebidos
  ADD COLUMN IF NOT EXISTS valor_convenio NUMERIC(15, 2) DEFAULT NULL;

COMMENT ON COLUMN cgof_gpc_recebidos.valor_convenio IS
  'Valor global do convênio conforme termo de convênio (campo informativo no cadastro do processo)';
