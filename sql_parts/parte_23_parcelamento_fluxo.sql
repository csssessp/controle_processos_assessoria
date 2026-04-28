-- ============================================================
-- parte_23_parcelamento_fluxo.sql
-- Adiciona campos de fluxo de autorização ao parcelamento
-- ============================================================

ALTER TABLE cgof_gpc_parcelamento
  ADD COLUMN IF NOT EXISTS tipo_parcelamento TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS autorizo_secretario BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS autorizo_casa_civil  BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS data_assinatura      DATE    DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS autorizo_governador  BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN cgof_gpc_parcelamento.tipo_parcelamento  IS 'PARCELAMENTO ou REPARCELAMENTO';
COMMENT ON COLUMN cgof_gpc_parcelamento.autorizo_secretario IS 'Autorização do Secretário concedida';
COMMENT ON COLUMN cgof_gpc_parcelamento.autorizo_casa_civil  IS 'Autorização da Casa Civil concedida';
COMMENT ON COLUMN cgof_gpc_parcelamento.data_assinatura      IS 'Data da assinatura do termo';
COMMENT ON COLUMN cgof_gpc_parcelamento.autorizo_governador  IS 'Autorização do Governador (obrigatório se parcelas > 60)';

ALTER TABLE cgof_gpc_parcelamento
  ADD COLUMN IF NOT EXISTS autorizacoes_log JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN cgof_gpc_parcelamento.autorizacoes_log IS 'Log de eventos de autorização [{tipo, data, obs, registrado_por, registrado_em}]';
