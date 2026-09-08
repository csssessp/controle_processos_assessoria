-- =============================================================================
-- PARTE 81: GGCON Análise — evento CONTRIBUICAO_PARCIAL no histórico
-- Quando um processo já tem progresso (algum item do checklist respondido) e é
-- reatribuído para outro técnico, o técnico anterior passa a receber um evento
-- de histórico próprio (CONTRIBUICAO_PARCIAL) creditando o trabalho já feito —
-- ver GgconAnaliseService.reatribuirAnalista/getProdutividade. Sem isso, só quem
-- concluísse o checklist aparecia na Produtividade da Análise.
-- Execute no SQL Editor do Supabase, depois de parte_80_ggcon_ver_produtividade_analise.
-- =============================================================================

ALTER TABLE public.cgof_ggcon_analise_historico
  DROP CONSTRAINT IF EXISTS cgof_ggcon_analise_historico_evento_check;
ALTER TABLE public.cgof_ggcon_analise_historico
  ADD CONSTRAINT cgof_ggcon_analise_historico_evento_check
  CHECK (evento IN ('LIBERADA', 'REATRIBUIDA', 'INICIADA', 'CONCLUIDA', 'ENCAMINHADA', 'RESETADA',
                     'STATUS_ALTERADO', 'HISTORICO_LIMPO', 'LIBERADA_ASSINATURA', 'ASSINADA',
                     'CONCLUIDA_COM_PENDENCIA', 'ENCAMINHADA_GPC', 'RETORNO_GPC', 'CONTRIBUICAO_PARCIAL'));
