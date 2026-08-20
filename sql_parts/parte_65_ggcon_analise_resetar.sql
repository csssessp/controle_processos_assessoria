-- =============================================================================
-- PARTE 65: GGCON — Análise Processo: evento "RESETADA" no histórico
-- Permite que quem libera processos (podeLiberarAnalise) resete uma análise —
-- limpa as respostas do checklist e as datas de análise/encaminhamento, mediante
-- confirmação de senha — mantendo o registro no histórico de responsáveis.
-- Execute no SQL Editor do Supabase, depois de parte_64.
-- =============================================================================

ALTER TABLE public.cgof_ggcon_analise_historico
  DROP CONSTRAINT IF EXISTS cgof_ggcon_analise_historico_evento_check;

ALTER TABLE public.cgof_ggcon_analise_historico
  ADD CONSTRAINT cgof_ggcon_analise_historico_evento_check
  CHECK (evento IN ('LIBERADA', 'REATRIBUIDA', 'INICIADA', 'CONCLUIDA', 'ENCAMINHADA', 'RESETADA'));
