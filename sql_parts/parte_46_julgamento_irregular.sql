-- ============================================================
-- parte_46_julgamento_irregular.sql
-- Detalha o desfecho do julgamento quando situacao = 'IRREGULAR':
--   IRREGULAR
--     ├─ SEM_DEBITO  -> MULTA (valor_multa)
--     └─ COM_DEBITO  -> RESSARCIMENTO (valor_a_devolver/valor_devolvido)
--                         ├─ RECOLHIDO
--                         └─ NAO_RECOLHIDO -> COBRANCA -> DIVIDA_ATIVA -> EXECUCAO_FISCAL
-- Execute no SQL Editor do Supabase
-- ============================================================

-- 1. Novas colunas
ALTER TABLE cgof_gpc_recebidos
  ADD COLUMN IF NOT EXISTS irregular_debito TEXT
    CHECK (irregular_debito IN ('SEM_DEBITO', 'COM_DEBITO')),
  ADD COLUMN IF NOT EXISTS valor_multa NUMERIC(15,2) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS ressarcimento_status TEXT
    CHECK (ressarcimento_status IN ('RECOLHIDO', 'NAO_RECOLHIDO')),
  ADD COLUMN IF NOT EXISTS cobranca_estagio TEXT
    CHECK (cobranca_estagio IN ('COBRANCA', 'DIVIDA_ATIVA', 'EXECUCAO_FISCAL'));

COMMENT ON COLUMN cgof_gpc_recebidos.irregular_debito IS
  'Desfecho do julgamento IRREGULAR: SEM_DEBITO (gera multa) ou COM_DEBITO (gera ressarcimento)';

COMMENT ON COLUMN cgof_gpc_recebidos.valor_multa IS
  'Valor da multa aplicada (aplicável quando irregular_debito = SEM_DEBITO)';

COMMENT ON COLUMN cgof_gpc_recebidos.ressarcimento_status IS
  'Situação do ressarcimento: RECOLHIDO ou NAO_RECOLHIDO (aplicável quando irregular_debito = COM_DEBITO)';

COMMENT ON COLUMN cgof_gpc_recebidos.cobranca_estagio IS
  'Estágio da cobrança do débito não recolhido: COBRANCA, DIVIDA_ATIVA ou EXECUCAO_FISCAL (aplicável quando ressarcimento_status = NAO_RECOLHIDO)';

-- 2. Migra registros que já tinham a tag solta 'DIVIDA_ATIVA' em irregular_tipos
--    para o novo fluxo de cobrança (débito não recolhido em dívida ativa)
UPDATE cgof_gpc_recebidos
  SET irregular_debito = 'COM_DEBITO',
      ressarcimento_status = 'NAO_RECOLHIDO',
      cobranca_estagio = 'DIVIDA_ATIVA'
  WHERE 'DIVIDA_ATIVA' = ANY(irregular_tipos);

UPDATE cgof_gpc_recebidos
  SET irregular_tipos = array_remove(irregular_tipos, 'DIVIDA_ATIVA')
  WHERE 'DIVIDA_ATIVA' = ANY(irregular_tipos);
