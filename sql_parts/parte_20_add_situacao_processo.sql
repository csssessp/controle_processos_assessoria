-- ============================================================
-- parte_20_add_situacao_processo.sql
-- Adiciona campos de Situação do Processo na tabela cgof_gpc_recebidos
-- Situações possíveis: REGULAR, IRREGULAR, PARCIALMENTE_REGULAR
-- ============================================================

-- 1. Adicionar colunas de situação
ALTER TABLE cgof_gpc_recebidos
  ADD COLUMN IF NOT EXISTS situacao TEXT
    CHECK (situacao IN ('REGULAR', 'IRREGULAR', 'PARCIALMENTE_REGULAR')),
  ADD COLUMN IF NOT EXISTS valor_a_devolver NUMERIC(15,2) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS valor_devolvido  NUMERIC(15,2) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS situacao_obs     TEXT DEFAULT NULL;

-- 2. Índice para facilitar filtros por situação
CREATE INDEX IF NOT EXISTS idx_gpc_recebidos_situacao
  ON cgof_gpc_recebidos (situacao);

-- 3. Comentários descritivos
COMMENT ON COLUMN cgof_gpc_recebidos.situacao IS
  'Situação do processo: REGULAR (sem pendências), IRREGULAR (com pendências), PARCIALMENTE_REGULAR (regularidades parciais)';

COMMENT ON COLUMN cgof_gpc_recebidos.valor_a_devolver IS
  'Valor total que deve ser devolvido ao erário (aplicável quando IRREGULAR ou PARCIALMENTE_REGULAR)';

COMMENT ON COLUMN cgof_gpc_recebidos.valor_devolvido IS
  'Valor já efetivamente devolvido ao erário até a data da análise';

COMMENT ON COLUMN cgof_gpc_recebidos.situacao_obs IS
  'Observações e fundamentação sobre a situação do processo';
