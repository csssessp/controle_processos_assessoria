-- =============================================================================
-- PARTE 67: GGCON — Análise Processo: alterar status manualmente + limpar histórico
-- Dois novos eventos de histórico:
--   STATUS_ALTERADO — quem libera processos pode corrigir o status manualmente
--     (útil para os registros importados da planilha antiga, que já vêm com
--     status "Concluída" mas sem checklist digitalizado, e para qualquer
--     correção pontual).
--   HISTORICO_LIMPO — administrador apaga o histórico de responsáveis de uma
--     análise (ex.: entradas de teste) e fica um marcador registrando quem
--     limpou e quando, para não sumir completamente o rastro da limpeza.
-- Execute no SQL Editor do Supabase, depois de parte_66.
-- =============================================================================

ALTER TABLE public.cgof_ggcon_analise_historico
  DROP CONSTRAINT IF EXISTS cgof_ggcon_analise_historico_evento_check;

ALTER TABLE public.cgof_ggcon_analise_historico
  ADD CONSTRAINT cgof_ggcon_analise_historico_evento_check
  CHECK (evento IN ('LIBERADA', 'REATRIBUIDA', 'INICIADA', 'CONCLUIDA', 'ENCAMINHADA', 'RESETADA', 'STATUS_ALTERADO', 'HISTORICO_LIMPO'));
