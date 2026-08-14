-- ============================================================
-- parte_49_assinatura_por_exercicio.sql
-- Move o Responsável pela Assinatura de um dado do registro (cgof_gpc_recebidos)
-- para um dado por (registro x exercício), já que cada exercício tem sua própria
-- Análise/Situação/Fluxo agora — faz sentido que a assinatura do parecer também
-- seja por exercício.
--
-- As colunas responsavel_assinatura/responsavel_assinatura_2 em cgof_gpc_recebidos
-- NÃO são removidas (podem ficar como referência histórica), só deixam de ser
-- editadas pela UI — a edição passa a ser só em cgof_gpc_registro_exercicio.
--
-- Execute no SQL Editor do Supabase
-- ============================================================

ALTER TABLE cgof_gpc_registro_exercicio
  ADD COLUMN IF NOT EXISTS responsavel_assinatura   TEXT,
  ADD COLUMN IF NOT EXISTS responsavel_assinatura_2  TEXT;

COMMENT ON COLUMN cgof_gpc_registro_exercicio.responsavel_assinatura IS
  'Responsável(is) pela assinatura do parecer/relatório deste exercício (nomes separados por " | ")';

COMMENT ON COLUMN cgof_gpc_registro_exercicio.responsavel_assinatura_2 IS
  'Campo legado (segundo responsável) — mantido por compatibilidade, novos registros usam só responsavel_assinatura';
