-- =============================================================================
-- PARTE 70: GGCON — Análise Processo: status "Conferência com Pendência"
-- Alternativa a "Concluir preenchimento": o analista/liberador marca que a
-- conferência encontrou algo a corrigir (documento faltando/incorreto etc.),
-- descreve a pendência e o processo pula direto para Encaminhar — sem passar
-- pela etapa de Assinatura. A pendência fica registrada permanentemente
-- (data_pendencia/pendencia_descricao), mesmo depois de encaminhado.
-- Execute no SQL Editor do Supabase, depois de parte_69.
-- =============================================================================

ALTER TABLE public.cgof_ggcon_analises
  ADD COLUMN IF NOT EXISTS data_pendencia date,
  ADD COLUMN IF NOT EXISTS pendencia_descricao text;

ALTER TABLE public.cgof_ggcon_analises
  DROP CONSTRAINT IF EXISTS cgof_ggcon_analises_status_check;

ALTER TABLE public.cgof_ggcon_analises
  ADD CONSTRAINT cgof_ggcon_analises_status_check
  CHECK (status IN ('AGUARDANDO_LIBERACAO', 'AGUARDANDO_ANALISE', 'EM_ANALISE', 'AGUARDANDO_ASSINATURA', 'CONFERENCIA_PENDENCIA', 'CONCLUIDA'));

ALTER TABLE public.cgof_ggcon_analise_historico
  DROP CONSTRAINT IF EXISTS cgof_ggcon_analise_historico_evento_check;

ALTER TABLE public.cgof_ggcon_analise_historico
  ADD CONSTRAINT cgof_ggcon_analise_historico_evento_check
  CHECK (evento IN ('LIBERADA', 'REATRIBUIDA', 'INICIADA', 'CONCLUIDA', 'ENCAMINHADA', 'RESETADA', 'STATUS_ALTERADO', 'HISTORICO_LIMPO', 'LIBERADA_ASSINATURA', 'ASSINADA', 'CONCLUIDA_COM_PENDENCIA'));
