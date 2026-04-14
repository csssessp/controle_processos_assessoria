-- ============================================================
-- parte_18_responsavel_assinatura.sql
-- Adiciona os campos de responsável pela assinatura do processo
-- na tabela de recebidos, e o flag can_sign na tabela de usuários
-- ============================================================

-- 1. Adicionar coluna can_sign na tabela users
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS can_sign BOOLEAN NOT NULL DEFAULT FALSE;

-- 2. Adicionar colunas de responsável pela assinatura em cgof_gpc_recebidos
ALTER TABLE cgof_gpc_recebidos
  ADD COLUMN IF NOT EXISTS responsavel_assinatura TEXT,
  ADD COLUMN IF NOT EXISTS responsavel_assinatura_2 TEXT;

-- 3. Comentários de documentação
COMMENT ON COLUMN users.can_sign IS 'Indica se o usuário pode ser indicado como responsável pela assinatura de processos no fluxo técnico.';
COMMENT ON COLUMN cgof_gpc_recebidos.responsavel_assinatura IS 'Nome do 1º responsável pela assinatura do processo (indicado pelo administrador).';
COMMENT ON COLUMN cgof_gpc_recebidos.responsavel_assinatura_2 IS 'Nome do 2º responsável pela assinatura do processo (opcional, indicado pelo administrador).';
